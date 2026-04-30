const express = require('express');
const router = express.Router();
const { exportCSV } = require('../controllers/exportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/csv', protect, exportCSV);

module.exports = router;
