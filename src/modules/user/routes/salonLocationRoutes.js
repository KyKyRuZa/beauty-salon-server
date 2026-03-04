const express = require('express');
const router = express.Router();
const salonLocationController = require('../controllers/salonLocationController');
const { authenticateToken, requireAdminRole } = require('../../../middleware/auth');

/**
 * @route   GET /api/salon-locations
 * @desc    Получить все локации салонов с фильтрами
 * @access  Public
 */
router.get('/', salonLocationController.getAllLocations);

/**
 * @route   GET /api/salon-locations/city/:city
 * @desc    Получить локации салонов по городу
 * @access  Public
 */
router.get('/city/:city', salonLocationController.getLocationsByCity);

/**
 * @route   GET /api/salon-locations/salon/:salonId
 * @desc    Получить локацию конкретного салона
 * @access  Public
 */
router.get('/salon/:salonId', salonLocationController.getLocationBySalonId);

/**
 * @route   GET /api/salon-locations/nearby
 * @desc    Найти ближайшие салоны по координатам пользователя
 * @query   {number} lat - Широта
 * @query   {number} lng - Долгота
 * @query   {string} city - Город (опционально)
 * @access  Public
 */
router.get('/nearby', salonLocationController.getNearbySalons);

/**
 * @route   POST /api/salon-locations
 * @desc    Создать локацию салона
 * @access  Private (salon, admin)
 */
router.post('/', 
  authenticateToken, 
  requireAdminRole, 
  salonLocationController.createLocation
);

/**
 * @route   PUT /api/salon-locations/:salonId
 * @desc    Обновить локацию салона
 * @access  Private (salon, admin)
 */
router.put('/:salonId', 
  authenticateToken, 
  requireAdminRole, 
  salonLocationController.updateLocation
);

/**
 * @route   DELETE /api/salon-locations/:salonId
 * @desc    Удалить локацию салона
 * @access  Private (admin only)
 */
router.delete('/:salonId', 
  authenticateToken, 
  requireAdminRole, 
  salonLocationController.deleteLocation
);

module.exports = router;
