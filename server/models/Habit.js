const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Health', 'Learning', 'Productivity', 'Mindfulness', 'Fitness', 'Custom'],
    default: 'Health',
  },
  color: { type: String, default: '#6366f1' },
  frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  weekDays: [{ type: Number }], // 0=Sun ... 6=Sat
  goal: { type: Number, default: 30 },
  reminderTime: { type: String, default: '' },
  reminderType: { type: String, enum: ['browser', 'email', 'both', 'none'], default: 'none' },
  completedDates: [{ type: Date }],
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

habitSchema.index({ userId: 1, isDeleted: 1, isArchived: 1 });

module.exports = mongoose.model('Habit', habitSchema);
