import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { transporter, isSmtpConfigured } from '../config/email.js';
import { forgotPasswordLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

// Sign Up Route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isNewUser: true
    });

    await newUser.save();

    const JWT_SECRET = process.env.JWT_SECRET;
    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Internal Server Error during signup.' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error during login.' });
  }
});

// Forgot Password Route
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'An account with this email address does not exist.' });
    }

    // Generate a 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const logCodeToConsole = () => {
      console.log('\n==================================================');
      console.log(`RESET CODE EMAIL SENT TO: ${email}`);
      console.log(`Your EcoPulse password reset code is: ${resetCode}`);
      console.log('==================================================\n');
    };

    if (isSmtpConfigured()) {
      try {
        const mailOptions = {
          from: `"EcoPulse Platform" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Your EcoPulse Password Reset Code',
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; color: #333333;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #10b981; margin: 0; font-size: 28px; font-weight: 800; display: inline-block; vertical-align: middle;">EcoPulse</h2>
              </div>
              <h3 style="color: #1f2937; margin-bottom: 16px;">Password Reset Request</h3>
              <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">We received a request to reset the password for your EcoPulse account. Use the following 6-digit verification code to complete the process. This code will expire in 1 hour:</p>
              <div style="text-align: center; margin: 32px 0;">
                <span style="display: inline-block; padding: 12px 32px; background-color: #f3f4f6; color: #10b981; font-size: 32px; font-weight: 800; letter-spacing: 6px; border-radius: 8px; border: 1px solid #e5e7eb;">${resetCode}</span>
              </div>
              <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-top: 24px;">If you did not request this reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">This is an automated system email. Please do not reply directly to this message.</p>
            </div>
          `
        };
        await transporter.sendMail(mailOptions);
        console.log(`[SMTP] Verification email sent successfully to ${email}`);
      } catch (mailError) {
        console.error('[SMTP Error] Failed to send email via SMTP, falling back to console log:', mailError);
        logCodeToConsole();
      }
    } else {
      console.log('[SMTP Warning] SMTP credentials not fully configured. Code logged below:');
      logCodeToConsole();
    }

    res.json({
      message: 'Verification code has been sent to your email.'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

// Verify Code Route
router.post('/verify-code', async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    res.json({ message: 'Code verified successfully.' });
  } catch (error) {
    console.error('Verify Code Error:', error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset code.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

export default router;
