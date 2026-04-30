const Habit = require('../models/Habit');
const { computeStreaks } = require('../utils/streakUtils');
const { addXP, XP_RULES } = require('../utils/xpUtils');
const { checkAndAwardBadges } = require('../utils/badgeChecker');
const {
  format,
  startOfMonth,
  endOfMonth,
  parseISO,
  isSameDay,
  isValid,
} = require('date-fns');

// @GET /api/habits?month=2024-04
const getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({
      userId: req.user._id,
      isDeleted: false,
    }).sort({ order: 1, createdAt: 1 });

    res.json(habits);
  } catch (error) {
    next(error);
  }
};

// @POST /api/habits
const createHabit = async (req, res, next) => {
  try {
    const { name, category, color, frequency, weekDays, goal, reminderTime, reminderType } = req.body;

    const count = await Habit.countDocuments({ userId: req.user._id, isDeleted: false });

    const habit = await Habit.create({
      userId: req.user._id,
      name,
      category: category || 'Health',
      color: color || '#6366f1',
      frequency: frequency || 'daily',
      weekDays: weekDays || [],
      goal: goal || 30,
      reminderTime: reminderTime || '',
      reminderType: reminderType || 'none',
      order: count,
    });

    // Check badges
    const habits = await Habit.find({ userId: req.user._id, isDeleted: false });
    const newBadges = await checkAndAwardBadges(req.user._id, habits);

    res.status(201).json({ habit, newBadges });
  } catch (error) {
    next(error);
  }
};

// @PUT /api/habits/:id
const updateHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    const allowed = ['name', 'category', 'color', 'frequency', 'weekDays', 'goal', 'reminderTime', 'reminderType'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) habit[key] = req.body[key];
    });

    await habit.save();
    res.json(habit);
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/habits/:id (soft delete)
const deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    habit.isDeleted = true;
    habit.deletedAt = new Date();
    await habit.save();
    res.json({ message: 'Habit deleted' });
  } catch (error) {
    next(error);
  }
};

// @PATCH /api/habits/:id/toggle — body: { date }
const toggleHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: false });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();

    if (!isValid(targetDate)) {
      return res.status(400).json({ message: 'Invalid date' });
    }

    // Normalize to midnight UTC
    const targetDay = format(targetDate, 'yyyy-MM-dd');

    const alreadyDone = habit.completedDates.some((d) => format(new Date(d), 'yyyy-MM-dd') === targetDay);

    let xpResult = null;
    let newBadges = [];

    if (alreadyDone) {
      // Uncheck
      habit.completedDates = habit.completedDates.filter(
        (d) => format(new Date(d), 'yyyy-MM-dd') !== targetDay
      );
    } else {
      // Check
      habit.completedDates.push(targetDate);

      // Award XP
      xpResult = await addXP(req.user._id, XP_RULES.HABIT_COMPLETE, `Completed habit: ${habit.name}`);

      // Check if all habits done today
      const allHabits = await Habit.find({ userId: req.user._id, isDeleted: false, isArchived: false });
      const today = format(new Date(), 'yyyy-MM-dd');
      const allDoneToday = allHabits.every((h) =>
        h.completedDates.some((d) => format(new Date(d), 'yyyy-MM-dd') === today)
      );
      if (allDoneToday) {
        xpResult = await addXP(req.user._id, XP_RULES.ALL_DONE_BONUS, 'All habits completed today!');
      }
    }

    // Recompute streaks
    const streaks = computeStreaks(habit.completedDates);
    habit.currentStreak = streaks.currentStreak;
    habit.longestStreak = Math.max(habit.longestStreak, streaks.longestStreak);

    // Check 7-day streak bonus
    if (streaks.currentStreak === 7) {
      xpResult = await addXP(req.user._id, XP_RULES.SEVEN_DAY_STREAK, '7-day streak bonus!');
    }

    await habit.save();

    // Check badges
    const habits = await Habit.find({ userId: req.user._id, isDeleted: false });
    newBadges = await checkAndAwardBadges(req.user._id, habits);

    res.json({ habit, xpResult, newBadges, completed: !alreadyDone });
  } catch (error) {
    next(error);
  }
};

// @PATCH /api/habits/:id/archive
const archiveHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    habit.isArchived = !habit.isArchived;
    await habit.save();
    res.json({ habit, archived: habit.isArchived });
  } catch (error) {
    next(error);
  }
};

// @PATCH /api/habits/reorder — body: { orderedIds: [] }
const reorderHabits = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ message: 'orderedIds must be an array' });

    const updateOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, userId: req.user._id },
        update: { $set: { order: index } },
      },
    }));

    await Habit.bulkWrite(updateOps);
    res.json({ message: 'Reordered successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHabits, createHabit, updateHabit, deleteHabit, toggleHabit, archiveHabit, reorderHabits };
