const Habit = require('../models/Habit');
const { format } = require('date-fns');

// @GET /api/export/csv
const exportCSV = async (req, res, next) => {
  try {
    const habits = await Habit.find({ userId: req.user._id, isDeleted: false });

    let csv = 'Habit Name,Category,Date Completed\n';
    habits.forEach((h) => {
      h.completedDates.forEach((d) => {
        csv += `"${h.name}","${h.category}","${format(new Date(d), 'yyyy-MM-dd')}"\n`;
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="habitflow-export-${format(new Date(), 'yyyy-MM-dd')}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = { exportCSV };
