import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Fetch Profile Route
router.get('/profile', authenticateToken, async (req, res) => {
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

// Update Profile Route
router.put('/profile', authenticateToken, async (req, res) => {
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
      notifications,
      isNewUser
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
    if (isNewUser !== undefined) user.isNewUser = isNewUser;

    await user.save();

    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Internal Server Error updating profile.' });
  }
});

export default router;
