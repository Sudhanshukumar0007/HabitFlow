const User = require('../models/User');
const XPLog = require('../models/XPLog');

const XP_RULES = {
  HABIT_COMPLETE: 10,
  ALL_DONE_BONUS: 25,
  SEVEN_DAY_STREAK: 50,
  PERFECT_MONTH: 100,
};

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: 'Beginner' },
  { level: 2, xp: 200, title: 'Consistent' },
  { level: 3, xp: 500, title: 'Dedicated' },
  { level: 4, xp: 1000, title: 'Streak Master' },
  { level: 5, xp: 2000, title: 'Habit Legend' },
];

const getLevelFromXP = (xp) => {
  let current = LEVEL_THRESHOLDS[0];
  for (const lvl of LEVEL_THRESHOLDS) {
    if (xp >= lvl.xp) current = lvl;
  }
  return current;
};

const getNextLevel = (xp) => {
  for (const lvl of LEVEL_THRESHOLDS) {
    if (xp < lvl.xp) return lvl;
  }
  return null; // max level
};

const addXP = async (userId, amount, reason) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const oldLevel = user.level;
  user.xp += amount;

  const newLevelData = getLevelFromXP(user.xp);
  user.level = newLevelData.level;

  await user.save();

  await XPLog.create({ userId, amount, reason });

  const leveledUp = newLevelData.level > oldLevel;
  return {
    xp: user.xp,
    level: user.level,
    leveledUp,
    levelTitle: newLevelData.title,
    nextLevel: getNextLevel(user.xp),
  };
};

module.exports = { addXP, getLevelFromXP, getNextLevel, XP_RULES, LEVEL_THRESHOLDS };
