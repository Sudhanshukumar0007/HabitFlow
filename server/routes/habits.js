const express = require('express');
const router = express.Router();
const {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabit,
  archiveHabit,
  reorderHabits,
} = require('../controllers/habitController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getHabits);
router.post('/', createHabit);
router.patch('/reorder', reorderHabits);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.patch('/:id/toggle', toggleHabit);
router.patch('/:id/archive', archiveHabit);

module.exports = router;
