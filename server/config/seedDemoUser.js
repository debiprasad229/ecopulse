import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@ecopulse.app';
export const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'EcoDemo123!';
export const DEMO_USER_NAME = process.env.DEMO_USER_NAME || 'Eco Demo User';

export const isMongoConnected = () => mongoose.connection.readyState === 1;

export const FALLBACK_DEMO_ID = '507f1f77bcf86cd799439011';

export const fallbackDemoUserData = {
  _id: FALLBACK_DEMO_ID,
  name: DEMO_USER_NAME,
  email: DEMO_USER_EMAIL.toLowerCase(),
  isNewUser: false,
  inputs: {
    commuteDistance: 25,
    transportType: 'hybrid',
    flightHours: 4,
    electricityKwh: 240,
    greenEnergyShare: 35,
    heatingSource: 'electric',
    dietType: 'lowMeat',
    shoppingHabit: 'conscious',
    recycles: true
  },
  xp: 450,
  badges: ['First Step', 'Eco Conscious', 'Energy Saver'],
  challengeStats: {
    streak: 5,
    completedTotal: 12,
    lastCompletedDate: new Date()
  },
  completedHabits: {
    commute_green: 5,
    unplug_unused: 8,
    air_dry_laundry: 4,
    cold_shower: 3
  },
  offsets: {
    treesPlanted: 15,
    cleanEnergyFund: 75,
    plasticRemoved: 10
  },
  history: [
    { timestamp: new Date(Date.now() - 90 * 86400000).toISOString(), footprint: 4800 },
    { timestamp: new Date(Date.now() - 60 * 86400000).toISOString(), footprint: 4350 },
    { timestamp: new Date(Date.now() - 30 * 86400000).toISOString(), footprint: 3900 },
    { timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), footprint: 3450 }
  ],
  chatHistory: [
    {
      id: 'demo-chat-1',
      sender: 'user',
      text: 'What are the top three ways I can reduce my emissions this month?',
      timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'demo-chat-2',
      sender: 'ai',
      text: 'Hello Eco Demo! Based on your footprint: 1) Increasing your green energy share from 35% can save ~200 kg CO₂e. 2) Replacing 2 car commutes with cycling or public transit saves ~45 kg CO₂e. 3) You are already doing great with cold showers and line-drying laundry!',
      timestamp: new Date(Date.now() - 86400000 + 4000).toISOString()
    }
  ],
  notifications: [
    {
      id: 'demo-notif-1',
      category: 'AI Recommendations',
      title: 'Welcome to EcoPulse Demo',
      description: 'Explore carbon analytics, AI coaching, habit tracking, and offsets without sharing personal data.',
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: 'demo-notif-2',
      category: 'Achievements',
      title: 'Eco Conscious Badge Unlocked',
      description: 'You unlocked the Eco Conscious badge by maintaining green habits!',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: false
    },
    {
      id: 'demo-notif-3',
      category: 'Carbon Score Updates',
      title: 'Monthly Footprint Dropped 12%',
      description: 'Consistent habit logging helped reduce transportation and home emissions.',
      timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
      read: true
    }
  ],
  settings: {
    highContrast: false,
    fontSize: 'normal',
    reducedMotion: false
  }
};

let inMemoryDemoUser = { ...fallbackDemoUserData };

export const getFallbackDemoUser = () => inMemoryDemoUser;

export const updateFallbackDemoUser = (updates) => {
  inMemoryDemoUser = {
    ...inMemoryDemoUser,
    ...updates,
    settings: updates.settings ? { ...inMemoryDemoUser.settings, ...updates.settings } : inMemoryDemoUser.settings,
    inputs: updates.inputs ? { ...inMemoryDemoUser.inputs, ...updates.inputs } : inMemoryDemoUser.inputs,
    challengeStats: updates.challengeStats ? { ...inMemoryDemoUser.challengeStats, ...updates.challengeStats } : inMemoryDemoUser.challengeStats,
    offsets: updates.offsets ? { ...inMemoryDemoUser.offsets, ...updates.offsets } : inMemoryDemoUser.offsets
  };
  return inMemoryDemoUser;
};

export const getDemoCredentials = () => ({
  email: DEMO_USER_EMAIL,
  password: DEMO_USER_PASSWORD,
  name: DEMO_USER_NAME
});

export const seedDemoUser = async () => {
  try {
    if (!isMongoConnected()) {
      return inMemoryDemoUser;
    }

    let demoUser = await User.findOne({ email: DEMO_USER_EMAIL.toLowerCase() });

    if (!demoUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(DEMO_USER_PASSWORD, salt);

      demoUser = new User({
        ...fallbackDemoUserData,
        _id: undefined,
        password: hashedPassword
      });

      await demoUser.save();
      console.log(`[Seed] Demo account successfully initialized in MongoDB: ${DEMO_USER_EMAIL}`);
    } else {
      const isMatch = await bcrypt.compare(DEMO_USER_PASSWORD, demoUser.password);
      if (!isMatch) {
        const salt = await bcrypt.genSalt(10);
        demoUser.password = await bcrypt.hash(DEMO_USER_PASSWORD, salt);
        await demoUser.save();
        console.log(`[Seed] Demo account password refreshed to match configuration.`);
      }
    }

    return demoUser;
  } catch (err) {
    console.error('[Seed Error] Failed to seed demo user in database:', err.message || err);
    return inMemoryDemoUser;
  }
};
