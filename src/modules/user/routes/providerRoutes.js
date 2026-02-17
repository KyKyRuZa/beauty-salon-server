const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');

// Маршруты для получения данных провайдеров (мастеров и салонов)
// Эти маршруты не требуют аутентификации, так как используются для получения публичных данных

// Получить мастера по ID
router.get('/master/:id', providerController.getMasterById);

// Получить салон по ID
router.get('/salon/:id', providerController.getSalonById);

module.exports = router;