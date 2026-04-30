const express = require('express');
const router = express.Router();
const { getSummary, getHeatmap, getMonthly, getHabitTrend } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/summary', getSummary);
router.get('/heatmap', getHeatmap);
router.get('/monthly', getMonthly);
router.get('/habits/:id', getHabitTrend);

module.exports = router;
