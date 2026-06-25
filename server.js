import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from './models/User.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ecopulse_jwt_key_2026_change_me';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecopulse';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: ['https://ecopulse-802996668281.asia-south2.run.app', 'http://localhost:5173']
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// JWT Verification Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token.' });
    }
    req.user = decoded;
    next();
  });
}

// Gemini API Setup
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

// Authentication Routes

// Sign Up Route
app.post('/api/auth/signup', async (req, res) => {
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
      password: hashedPassword
    });

    await newUser.save();

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
app.post('/api/auth/login', async (req, res) => {
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
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Obfuscated success response
      return res.json({ message: 'If that email exists in our system, a reset token has been generated.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    console.log(`[FORGOT PASSWORD] Reset token for ${email}: ${resetToken}`);

    res.json({
      message: 'If that email exists in our system, a reset token has been generated.',
      debugToken: resetToken // Return for demo and testing convenience
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});

// Reset Password Route
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
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

// Protected Profile Routes

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ error: 'Internal Server Error fetching profile.' });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const { 
      settings, 
      inputs, 
      xp, 
      badges, 
      challengeStats, 
      completedHabits, 
      offsets, 
      history, 
      chatHistory, 
      notifications 
    } = req.body;

    if (settings !== undefined) user.settings = settings;
    if (inputs !== undefined) user.inputs = inputs;
    if (xp !== undefined) user.xp = xp;
    if (badges !== undefined) user.badges = badges;
    if (challengeStats !== undefined) user.challengeStats = challengeStats;
    if (completedHabits !== undefined) user.completedHabits = completedHabits;
    if (offsets !== undefined) user.offsets = offsets;
    if (history !== undefined) user.history = history;
    if (chatHistory !== undefined) user.chatHistory = chatHistory;
    if (notifications !== undefined) user.notifications = notifications;

    await user.save();

    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Internal Server Error updating profile.' });
  }
});

// Protected Gemini API Routes

app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { contents, systemInstruction } = req.body;
    
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Invalid contents format' });
    }
    
    const modelConfig = { model: 'gemini-2.5-flash' };
    if (systemInstruction?.parts?.[0]?.text) {
        modelConfig.systemInstruction = systemInstruction.parts[0].text;
    }
    
    const model = genAI.getGenerativeModel(modelConfig);

    const formattedContents = contents.map(c => ({
      role: c.role === 'model' ? 'model' : 'user',
      parts: c.parts.map(p => ({ text: p.text }))
    }));

    const result = await model.generateContent({ contents: formattedContents });
    const responseText = result.response.text();
    
    res.json({
      candidates: [{
        content: {
          parts: [{ text: responseText }]
        }
      }]
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.post('/api/scan', authenticateToken, async (req, res) => {
  try {
    const { contents } = req.body;
    
    if (!contents || !Array.isArray(contents) || !contents[0]?.parts) {
      return res.status(400).json({ error: 'Invalid contents format' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const formattedParts = contents[0].parts.map(part => {
      if (part.text) return part.text;
      if (part.inlineData) {
        return {
          inlineData: {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType
          }
        };
      }
      return '';
    });

    const result = await model.generateContent(formattedParts);
    const responseText = result.response.text();

    res.json({
      candidates: [{
        content: {
          parts: [{ text: responseText }]
        }
      }]
    });
  } catch (error) {
    console.error('Scan API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Serve static files from the Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for React Router / SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

