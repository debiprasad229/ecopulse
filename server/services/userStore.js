import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import {
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  DEMO_USER_NAME,
  FALLBACK_DEMO_ID,
  fallbackDemoUserData
} from '../config/seedDemoUser.js';

export const isMongoConnected = () => mongoose.connection.readyState === 1;

// In-memory user store map: email (lowercase) -> userObject
const inMemoryUsers = new Map();

// Helper to generate 24-character hex ObjectIds for in-memory users
let nextIdCounter = 1;
const generateId = () => {
  const hex = (nextIdCounter++).toString(16).padStart(6, '0');
  return `507f1f77bcf86cd799${hex}`;
};

// Initialize with demo account
export const initStore = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedDemoPassword = await bcrypt.hash(DEMO_USER_PASSWORD, salt);

    inMemoryUsers.set(DEMO_USER_EMAIL.toLowerCase(), {
      ...fallbackDemoUserData,
      _id: FALLBACK_DEMO_ID,
      id: FALLBACK_DEMO_ID,
      password: hashedDemoPassword,
      completedHabits: { ...(fallbackDemoUserData.completedHabits || {}) }
    });
  } catch (err) {
    console.error('[Store Error] Failed to initialize in-memory demo user:', err);
  }
};

initStore().catch(console.error);

export const userStore = {
  isMongoConnected,

  async findByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();

    if (isMongoConnected()) {
      try {
        const user = await User.findOne({ email: normalized });
        if (user) return user;
      } catch (err) {
        console.warn('[Store] MongoDB query failed, falling back to local store:', err.message);
      }
    }

    const localUser = inMemoryUsers.get(normalized);
    if (localUser) {
      return {
        ...localUser,
        _id: localUser._id || localUser.id,
        id: localUser.id || localUser._id
      };
    }
    return null;
  },

  async findById(id) {
    if (!id) return null;

    if (isMongoConnected()) {
      try {
        if (/^[0-9a-fA-F]{24}$/.test(id)) {
          const user = await User.findById(id).select('-password');
          if (user) return user;
        }
      } catch (err) {
        console.warn('[Store] MongoDB findById failed, falling back to local store:', err.message);
      }
    }

    for (const u of inMemoryUsers.values()) {
      if (u._id === id || u.id === id) {
        const copy = { ...u, _id: u._id || u.id, id: u.id || u._id };
        delete copy.password;
        return copy;
      }
    }
    return null;
  },

  async createUser({ name, email, password, isNewUser = true }) {
    const normalized = email.trim().toLowerCase();

    if (isMongoConnected()) {
      try {
        const newUser = new User({
          name: name.trim(),
          email: normalized,
          password,
          isNewUser
        });
        await newUser.save();
        return newUser;
      } catch (err) {
        console.warn('[Store] MongoDB user creation failed, falling back to local store:', err.message);
      }
    }

    const newId = generateId();
    const newUser = {
      _id: newId,
      id: newId,
      name: name.trim(),
      email: normalized,
      password,
      isNewUser,
      inputs: null,
      xp: 0,
      badges: [],
      challengeStats: { streak: 0, completedTotal: 0, lastCompletedDate: null },
      completedHabits: {},
      offsets: { treesPlanted: 0, cleanEnergyFund: 0, plasticRemoved: 0 },
      history: [],
      chatHistory: [],
      notifications: [],
      settings: { highContrast: false, fontSize: 'normal', reducedMotion: false }
    };

    inMemoryUsers.set(normalized, newUser);
    return newUser;
  },

  async updateUser(idOrEmail, updates) {
    if (!idOrEmail) return null;

    if (isMongoConnected()) {
      try {
        let user;
        if (/^[0-9a-fA-F]{24}$/.test(idOrEmail)) {
          user = await User.findById(idOrEmail);
        } else {
          user = await User.findOne({ email: idOrEmail.toLowerCase() });
        }

        if (user) {
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
            isNewUser,
            password,
            resetPasswordToken,
            resetPasswordExpires
          } = updates;

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
          if (password !== undefined) user.password = password;
          if (resetPasswordToken !== undefined) user.resetPasswordToken = resetPasswordToken;
          if (resetPasswordExpires !== undefined) user.resetPasswordExpires = resetPasswordExpires;

          await user.save();
          return await User.findById(user._id).select('-password');
        }
      } catch (err) {
        console.warn('[Store] MongoDB updateUser failed, falling back to local store:', err.message);
      }
    }

    // Local update
    let target = null;
    for (const [em, u] of inMemoryUsers.entries()) {
      if (u._id === idOrEmail || u.id === idOrEmail || em === idOrEmail.toLowerCase()) {
        target = u;
        break;
      }
    }

    if (target) {
      Object.assign(target, updates);
      if (updates.settings) target.settings = { ...target.settings, ...updates.settings };
      if (updates.inputs) target.inputs = { ...target.inputs, ...updates.inputs };
      if (updates.challengeStats) target.challengeStats = { ...target.challengeStats, ...updates.challengeStats };
      if (updates.offsets) target.offsets = { ...target.offsets, ...updates.offsets };

      const copy = { ...target, _id: target._id || target.id, id: target.id || target._id };
      delete copy.password;
      return copy;
    }

    return null;
  },

  async getDemoUser() {
    let demoUser = await this.findByEmail(DEMO_USER_EMAIL);
    if (!demoUser) {
      demoUser = {
        ...fallbackDemoUserData,
        _id: FALLBACK_DEMO_ID,
        id: FALLBACK_DEMO_ID
      };
    }
    return demoUser;
  }
};

