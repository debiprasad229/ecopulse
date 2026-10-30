import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { DEMO_USER_EMAIL } from '../config/seedDemoUser.js';
import { userStore } from '../services/userStore.js';

const router = express.Router();

// Helper: check if request is for demo user
const isDemoUser = (req) => {
  if (!req.user) return false;
  if (req.user.isDemo) return true;
  const email = req.user.email ? req.user.email.toLowerCase() : '';
  return email === DEMO_USER_EMAIL.toLowerCase() || email === 'demo@ecopulse.app' || email.startsWith('demo@');
};

// Fetch Profile Route
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (isDemoUser(req)) {
      const demoUser = await userStore.getDemoUser();
      return res.json(demoUser);
    }

    const user = await userStore.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error('Fetch Profile Error:', error.message || error);
    res.status(500).json({ error: 'Internal Server Error fetching profile.' });
  }
});

// Update Profile Route
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const targetId = isDemoUser(req) ? DEMO_USER_EMAIL : (req.user.id || req.user.email);
    const updatedUser = await userStore.updateUser(targetId, req.body);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error('Update Profile Error:', error.message || error);
    res.status(500).json({ error: 'Internal Server Error updating profile.' });
  }
});

export default router;
