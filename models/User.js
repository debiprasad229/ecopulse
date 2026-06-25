import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Interface Preferences
  settings: {
    highContrast: { type: Boolean, default: false },
    fontSize: { type: String, default: 'normal' },
    reducedMotion: { type: Boolean, default: false }
  },

  // Carbon Assessments Questionnaire Inputs
  inputs: {
    commuteDistance: { type: Number, default: 0 },
    transportType: { type: String, default: 'none' },
    flightHours: { type: Number, default: 0 },
    electricityKwh: { type: Number, default: 0 },
    greenEnergyShare: { type: Number, default: 0 },
    heatingSource: { type: String, default: 'none' },
    dietType: { type: String, default: 'lowMeat' },
    shoppingHabit: { type: String, default: 'average' },
    recycles: { type: Boolean, default: false }
  },

  // Gamification Parameters
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  badges: {
    type: [String],
    default: []
  },
  challengeStats: {
    streak: { type: Number, default: 0 },
    completedTotal: { type: Number, default: 0 },
    lastCompletedDate: { type: Date, default: null }
  },
  completedHabits: {
    type: Map,
    of: Number,
    default: {}
  },
  offsets: {
    treesPlanted: { type: Number, default: 0 },
    cleanEnergyFund: { type: Number, default: 0 },
    plasticRemoved: { type: Number, default: 0 }
  },

  // Historical calculations (Assessments history)
  history: [
    {
      timestamp: { type: String, required: true },
      footprint: { type: Number, required: true }
    }
  ],

  // AI Chat History
  chatHistory: [
    {
      id: { type: String, required: true },
      sender: { type: String, required: true, enum: ['user', 'ai'] },
      text: { type: String, required: true },
      timestamp: { type: String, required: true }
    }
  ],

  // Notifications
  notifications: [
    {
      id: { type: String, required: true },
      category: { type: String, required: true },
      title: { type: String, required: true },
      description: { type: String, required: true },
      timestamp: { type: String, required: true },
      read: { type: Boolean, default: false }
    }
  ]
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;
