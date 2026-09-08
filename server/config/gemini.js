import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();

if (!apiKey) {
  console.warn('WARNING: Gemini API key is missing or empty in environment.');
}

export const genAI = new GoogleGenerativeAI(apiKey);
