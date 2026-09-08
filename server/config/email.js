import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: (process.env.SMTP_PORT || '465') === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const isSmtpConfigured = () => {
  return Boolean(
    process.env.SMTP_USER &&
    process.env.SMTP_USER !== 'your-email@gmail.com' &&
    process.env.SMTP_PASS &&
    process.env.SMTP_PASS !== 'your-16-character-app-password'
  );
};
