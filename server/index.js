import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const app = express();
app.set('trust proxy', 1); // Trust first proxy for express-rate-limit IP tracking
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('CRITICAL ERROR: JWT_SECRET environment variable is not configured.');
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// Global Middleware
const allowedOrigins = [
  'https://ecopulse-802996668281.asia-south2.run.app',
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];
app.use(cors({
  origin: allowedOrigins
}));
app.use(express.json({ limit: '10mb' }));

// Rate Limiting for all API routes
app.use('/api/', apiLimiter);

// Mount Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', aiRoutes);

// Serve static files from the Vite build (dist)
app.use(express.static(path.join(projectRoot, 'dist')));

// Fallback to index.html for SPA Client-Side Routing
app.use((req, res) => {
  res.sendFile(path.join(projectRoot, 'dist', 'index.html'));
});

// Start Server listener
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;
