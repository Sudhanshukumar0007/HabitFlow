const User = require('../models/User');

const BADGES = [
  {
    id: 'launcher',
    name: '🚀 Launcher',
    description: 'Add your first 3 habits',
  },
  {
    id: 'on_fire',
    name: '🔥 On Fire',
    description: '7-day streak on any habit',
  },
  {
    id: 'diamond_discipline',
    name: '💎 Diamond Discipline',
    description: '30-day streak on any habit',
  },
  {
    id: 'perfect_week',
    name: '📅 Perfect Week',
    description: 'All habits done Mon–Sun',
  },
  {
    id: 'perfect_month',
    name: '🏆 Perfect Month',
    description: '100% completion in a calendar month',
  },
  {
    id: 'scholar',
    name: '🧠 Scholar',
    description: 'Complete a Learning habit 20 times',
  },
  {
    id: 'early_bird',
    name: '🌅 Early Bird',
    description: 'Complete all habits before 9am (3 days in a row)',
  },
];

const checkAndAwardBadges = async (userId, habits) => {
  const user = await User.findById(userId);
  if (!user) return [];

  const existingIds = user.badges.map((b) => b.id);
  const newBadges = [];

  // Launcher: 3 habits created
  if (!existingIds.includes('launcher') && habits.length >= 3) {
    newBadges.push('launcher');
  }

  // On Fire: 7-day streak
  const hasSevenStreak = habits.some((h) => h.currentStreak >= 7);
  if (!existingIds.includes('on_fire') && hasSevenStreak) {
    newBadges.push('on_fire');
  }

  // Diamond Discipline: 30-day streak
  const has30Streak = habits.some((h) => h.currentStreak >= 30);
  if (!existingIds.includes('diamond_discipline') && has30Streak) {
    newBadges.push('diamond_discipline');
  }

  // Scholar: Learning habit completed 20 times
  const learningHabit = habits.find((h) => h.category === 'Learning');
  if (!existingIds.includes('scholar') && learningHabit && learningHabit.completedDates.length >= 20) {
    newBadges.push('scholar');
  }

  if (newBadges.length > 0) {
    const badgeObjects = newBadges.map((id) => {
      const badge = BADGES.find((b) => b.id === id);
      return { id, earnedAt: new Date(), name: badge.name, description: badge.description };
    });
    user.badges.push(...badgeObjects);
    await user.save();
  }

  return newBadges;
};

module.exports = { BADGES, checkAndAwardBadges };
