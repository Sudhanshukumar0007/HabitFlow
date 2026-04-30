const express = require('express');
const router = express.Router();
const { updateSettings, getPublicProfile, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.put('/settings', protect, updateSettings);
router.delete('/', protect, deleteAccount);
router.get('/:username/public', getPublicProfile);

module.exports = router;
