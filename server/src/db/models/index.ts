import mongoose from 'mongoose';

// Team Schema
const teamSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  score: { type: Number, default: 0 },
  penalties: {
    major: { type: Number, default: 0 },
    minor: { type: Number, default: 0 }
  },
  emoji: { type: String, enum: ['hand', 'fist', null], default: null },
  scoreboard: { type: mongoose.Schema.Types.ObjectId, ref: 'Scoreboard' }
});

// Scoreboard Schema
const scoreboardSchema = new mongoose.Schema({
  name: { type: String, default: 'Default Scoreboard' },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  logoUrl: { type: String, default: null, required: false },
  logoSize: { type: Number, default: 50 },
  titleText: { type: String, default: '' },
  footerText: { type: String, default: null, required: false },
  titleTextColor: { type: String, default: '#FFFFFF' },
  titleTextSize: { type: Number, default: 2 },
  footerTextColor: { type: String, default: '#FFFFFF' },
  footerTextSize: { type: Number, default: 1.25 },
  showScore: { type: Boolean, default: true },
  showPenalties: { type: Boolean, default: true },
  showEmojis: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// User Schema (for authentication)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Store hashed password
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to update the updatedAt field
scoreboardSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create models
export const Team = mongoose.model('Team', teamSchema);
export const Scoreboard = mongoose.model('Scoreboard', scoreboardSchema);
export const User = mongoose.model('User', userSchema);

// Export types
export interface TeamDocument extends mongoose.Document {
  id: string;
  name: string;
  color: string;
  score: number;
  penalties: {
    major: number;
    minor: number;
  };
  emoji: 'hand' | 'fist' | null;
  scoreboard: mongoose.Types.ObjectId;
}

export interface ScoreboardDocument extends mongoose.Document {
  name: string;
  teams: mongoose.Types.ObjectId[] | TeamDocument[];
  logoUrl: string | null;
  logoSize: number;
  titleText: string;
  footerText: string | null;
  titleTextColor: string;
  titleTextSize: number;
  footerTextColor: string;
  footerTextSize: number;
  showScore: boolean;
  showPenalties: boolean;
  showEmojis: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = mongoose.Document & {
  username: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
};