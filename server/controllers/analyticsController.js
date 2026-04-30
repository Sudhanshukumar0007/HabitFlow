const Habit = require('../models/Habit');
const XPLog = require('../models/XPLog');
const { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, subDays, startOfYear } = require('date-fns');

// @GET /api/analytics/summary
const getSummary = async (req, res, next) => {
  try {
    const habits = await Habit.find({ userId: req.user._id, isDeleted: false, isArchived: false });

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const thisMonthXP = await XPLog.aggregate([
      { $match: { userId: req.user._id, createdAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Best current streak
    const bestStreak = Math.max(...habits.map((h) => h.currentStreak), 0);
    const bestStreakHabit = habits.find((h) => h.currentStreak === bestStreak);

    // Best habit this month (most completions in month)
    const monthKey = format(now, 'yyyy-MM');
    let bestHabit = null;
    let bestCount = 0;
    let worstHabit = null;
    let worstCount = Infinity;

    habits.forEach((h) => {
      const monthCompletions = h.completedDates.filter(
        (d) => format(new Date(d), 'yyyy-MM') === monthKey
      ).length;

      if (monthCompletions > bestCount) {
        bestCount = monthCompletions;
        bestHabit = h;
      }
      if (monthCompletions < worstCount) {
        worstCount = monthCompletions;
        worstHabit = h;
      }
    });

    res.json({
      bestStreak,
      bestStreakHabitName: bestStreakHabit?.name || null,
      bestHabitThisMonth: bestHabit?.name || null,
      needsAttention: worstHabit?.name || null,
      totalXPThisMonth: thisMonthXP[0]?.total || 0,
      totalHabits: habits.length,
      userXP: req.user.xp,
      userLevel: req.user.level,
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/analytics/heatmap
const getHeatmap = async (req, res, next) => {
  try {
    const habits = await Habit.find({ userId: req.user._id, isDeleted: false });
    const yearStart = startOfYear(new Date());
    const today = new Date();

    const days = eachDayOfInterval({ start: yearStart, end: today });
    const heatmapData = days.map((day) => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const count = habits.reduce((sum, h) => {
        const done = h.completedDates.some((d) => format(new Date(d), 'yyyy-MM-dd') === dayKey);
        return done ? sum + 1 : sum;
      }, 0);
      return { date: dayKey, count, total: habits.length };
    });

    res.json(heatmapData);
  } catch (error) {
    next(error);
  }
};

// @GET /api/analytics/monthly
const getMonthly = async (req, res, next) => {
  try {
    const habits = await Habit.find({ userId: req.user._id, isDeleted: false });
    const now = new Date();

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const key = format(monthDate, 'yyyy-MM');
      const label = format(monthDate, 'MMM yyyy');

      const totalCompletions = habits.reduce((sum, h) => {
        return sum + h.completedDates.filter((d) => format(new Date(d), 'yyyy-MM') === key).length;
      }, 0);

      months.push({ label, key, totalCompletions });
    }

    // Category breakdown for this month
    const thisMonthKey = format(now, 'yyyy-MM');
    const categoryMap = {};
    habits.forEach((h) => {
      const count = h.completedDates.filter((d) => format(new Date(d), 'yyyy-MM') === thisMonthKey).length;
      categoryMap[h.category] = (categoryMap[h.category] || 0) + count;
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    res.json({ months, categoryBreakdown });
  } catch (error) {
    next(error);
  }
};

// @GET /api/analytics/habits/:id
const getHabitTrend = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const key = format(monthDate, 'yyyy-MM');
      const label = format(monthDate, 'MMM');
      const completions = habit.completedDates.filter((d) => format(new Date(d), 'yyyy-MM') === key).length;
      months.push({ label, completions });
    }

    res.json({
      habitName: habit.name,
      color: habit.color,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      totalCompletions: habit.completedDates.length,
      monthlyTrend: months,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary, getHeatmap, getMonthly, getHabitTrend };
