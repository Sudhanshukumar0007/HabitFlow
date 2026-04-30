const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String },
  googleId: { type: String },
  username: { type: String, required: true, unique: true, trim: true },
  avatar: { type: String, default: '' },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{ id: String, earnedAt: Date, name: String, description: String }],
  reminderEmail: { type: String, default: '' },
  dailyDigestTime: { type: String, default: '08:00' },
  notificationsEnabled: { type: Boolean, default: true },
  isPublic: { type: Boolean, default: false },
  accountabilityPartners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  if (this.passwordHash) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.getLevelTitle = function () {
  const levels = {
    1: 'Beginner',
    2: 'Consistent',
    3: 'Dedicated',
    4: 'Streak Master',
    5: 'Habit Legend',
  };
  return levels[this.level] || 'Legend';
};

module.exports = mongoose.model('User', userSchema);
