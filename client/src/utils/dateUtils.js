import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, isFuture, getDay, parseISO, isValid } from 'date-fns';

export const getDaysInMonth = (date) => {
  return eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) });
};

export const isHabitCompletedOnDate = (habit, date) => {
  return habit.completedDates?.some((d) => isSameDay(new Date(d), date)) || false;
};

export const isScheduledDay = (habit, date) => {
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekly') {
    const dayOfWeek = getDay(date); // 0=Sun
    return habit.weekDays?.includes(dayOfWeek) || false;
  }
  return true;
};

export const getWeekdayLabel = (date) => {
  return format(date, 'EEEEE'); // Single letter
};

export const getMonthCompletions = (habit, date) => {
  const monthKey = format(date, 'yyyy-MM');
  return habit.completedDates?.filter((d) => format(new Date(d), 'yyyy-MM') === monthKey).length || 0;
};

export const formatDateForAPI = (date) => format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

export const getLevelProgress = (xp) => {
  const levels = [
    { level: 1, xp: 0 },
    { level: 2, xp: 200 },
    { level: 3, xp: 500 },
    { level: 4, xp: 1000 },
    { level: 5, xp: 2000 },
  ];

  let current = levels[0];
  let next = levels[1];

  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i].xp) {
      current = levels[i];
      next = levels[i + 1] || null;
    }
  }

  if (!next) return { level: current.level, percent: 100, xpInLevel: 0, xpForNext: 0 };

  const xpInLevel = xp - current.xp;
  const xpForNext = next.xp - current.xp;
  const percent = Math.min((xpInLevel / xpForNext) * 100, 100);

  return { level: current.level, percent, xpInLevel, xpForNext };
};

export const LEVEL_TITLES = {
  1: 'Beginner',
  2: 'Consistent',
  3: 'Dedicated',
  4: 'Streak Master',
  5: 'Habit Legend',
};

export const CATEGORY_COLORS = {
  Health: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: '#10b981' },
  Learning: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', dot: '#3b82f6' },
  Productivity: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', dot: '#f59e0b' },
  Mindfulness: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', dot: '#a855f7' },
  Fitness: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', dot: '#f43f5e' },
  Custom: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', dot: '#6b7280' },
};
