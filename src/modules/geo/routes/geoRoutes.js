const express = require('express');
const router = express.Router();
const geoController = require('../controllers/geoController');

router.post('/detect-city', geoController.detectCity);
router.get('/cache-stats', geoController.getCacheStats);

module.exports = router;
