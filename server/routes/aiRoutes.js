import express from 'express';
import { genAI } from '../config/gemini.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Protected Gemini Chat Route
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { contents, systemInstruction } = req.body;
    
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Invalid contents format' });
    }
    
    const modelConfig = { model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite' };
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

// Protected Gemini Scan Route
router.post('/scan', authenticateToken, async (req, res) => {
  try {
    const { contents } = req.body;
    
    if (!contents || !Array.isArray(contents) || !contents[0]?.parts) {
      return res.status(400).json({ error: 'Invalid contents format' });
    }

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite' });

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

export default router;
