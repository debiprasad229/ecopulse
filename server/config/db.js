import mongoose from 'mongoose';
import dns from 'dns';
import { seedDemoUser } from './seedDemoUser.js';

// Resolve querySrv ECONNREFUSED on local ISP / router DNS by falling back to public DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecopulse';
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('Successfully connected to MongoDB.');
    await seedDemoUser();
  } catch (err) {
    console.error('MongoDB connection error:', err.message || err);
    console.warn('[Fallback] Server will continue running. Demo account works in-memory. Signup/login for personal accounts requires a working MongoDB connection.');
  }
};
