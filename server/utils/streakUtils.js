const { format, startOfDay, endOfDay, subDays, isSameDay, parseISO, isValid } = require('date-fns');

/**
 * Compute currentStreak and longestStreak from an array of completed dates.
 * Dates are normalized to midnight UTC for comparison.
 */
const computeStreaks = (completedDates) => {
  if (!completedDates || completedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Normalize: get unique day strings sorted descending
  const dayStrings = [
    ...new Set(
      completedDates
        .filter((d) => d && isValid(new Date(d)))
        .map((d) => format(new Date(d), 'yyyy-MM-dd'))
    ),
  ].sort().reverse();

  if (dayStrings.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Current streak: starts from today or yesterday
  let currentStreak = 0;
  if (dayStrings[0] === today || dayStrings[0] === yesterday) {
    let checkDate = dayStrings[0];
    for (let i = 0; i < dayStrings.length; i++) {
      if (dayStrings[i] === checkDate) {
        currentStreak++;
        checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
      } else {
        break;
      }
    }
  }

  // Longest streak
  let longestStreak = 1;
  let runStreak = 1;
  for (let i = 1; i < dayStrings.length; i++) {
    const prev = parseISO(dayStrings[i - 1]);
    const curr = parseISO(dayStrings[i]);
    const diff = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      runStreak++;
      longestStreak = Math.max(longestStreak, runStreak);
    } else {
      runStreak = 1;
    }
  }

  return { currentStreak, longestStreak };
};

module.exports = { computeStreaks };
