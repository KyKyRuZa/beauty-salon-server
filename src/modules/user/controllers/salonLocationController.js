const salonLocationService = require('../services/salonLocationService');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('salon-location');

/**
 * Получить все локации салонов
 * GET /api/salon-locations
 */
const getAllLocations = async (req, res) => {
  try {
    const { city, is_verified, limit, offset } = req.query;

    const locations = await salonLocationService.getAllLocations({
      city,
      is_verified: is_verified === 'true',
      limit: limit || 100,
      offset: offset || 0,
    });

    logger.info(`Получены локации салонов`, {
      count: locations.length,
      city,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    logger.error('Ошибка получения локаций салонов:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Ошибка при получении локаций',
    });
  }
};

/**
 * Получить локации по городу
 * GET /api/salon-locations/city/:city
 */
const getLocationsByCity = async (req, res) => {
  try {
    const { city } = req.params;

    const locations = await salonLocationService.getLocationsByCity(city);

    logger.info(`Получены локации салонов города ${city}`, {
      count: locations.length,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    logger.error('Ошибка получения локаций по городу:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Ошибка при получении локаций',
    });
  }
};

/**
 * Получить локацию конкретного салона
 * GET /api/salon-locations/salon/:salonId
 */
const getLocationBySalonId = async (req, res) => {
  try {
    const { salonId } = req.params;

    const location = await salonLocationService.getLocationBySalonId(salonId);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Локация салона не найдена',
      });
    }

    logger.info(`Получена локация салона ${salonId}`, { ip: req.ip });

    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    logger.error('Ошибка получения локации салона:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Ошибка при получении локации',
    });
  }
};

/**
 * Найти ближайшие салоны по координатам
 * GET /api/salon-locations/nearby
 */
const getNearbySalons = async (req, res) => {
  try {
    const { lat, lng, city } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать координаты (lat, lng)',
      });
    }

    const result = await salonLocationService.getNearbySalons(lat, lng, city);

    logger.info(`Найдены ближайшие салоны`, {
      count: result.salons.length,
      searchRadius: result.searchRadius,
      lat,
      lng,
      city,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Ошибка поиска ближайших салонов:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Ошибка при поиске салонов',
    });
  }
};

/**
 * Создать локацию салона
 * POST /api/salon-locations
 * Требуется авторизация: salon
 */
const createLocation = async (req, res) => {
  try {
    const locationData = req.body;

    // Проверка прав доступа (салон может создать только свою локацию)
    if (req.user?.role !== 'salon' && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для создания локации',
      });
    }

    // Если салон создаёт свою локацию, проверяем что salon_id совпадает с пользователем
    if (req.user?.role === 'salon') {
      const salon = await req.user.getSalon();
      if (!salon || salon.id !== parseInt(locationData.salon_id)) {
        return res.status(403).json({
          success: false,
          message: 'Можно создать локацию только для своего салона',
        });
      }
    }

    const location = await salonLocationService.createLocation(locationData);

    logger.info(`Создана локация салона`, {
      salonId: locationData.salon_id,
      city: locationData.city,
      userId: req.user?.id,
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      data: location,
      message: 'Локация успешно создана',
    });
  } catch (error) {
    logger.error('Ошибка создания локации:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Ошибка при создании локации',
    });
  }
};

/**
 * Обновить локацию салона
 * PUT /api/salon-locations/:id
 * Требуется авторизация: salon
 */
const updateLocation = async (req, res) => {
  try {
    const { salonId } = req.params;
    const locationData = req.body;

    // Проверка прав доступа
    if (req.user?.role !== 'salon' && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для обновления локации',
      });
    }

    // Если салон обновляет свою локацию, проверяем что salon_id совпадает
    if (req.user?.role === 'salon') {
      const salon = await req.user.getSalon();
      if (!salon || salon.id !== parseInt(salonId)) {
        return res.status(403).json({
          success: false,
          message: 'Можно обновить локацию только для своего салона',
        });
      }
    }

    const location = await salonLocationService.updateLocation(salonId, locationData);

    logger.info(`Обновлена локация салона ${salonId}`, {
      userId: req.user?.id,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: location,
      message: 'Локация успешно обновлена',
    });
  } catch (error) {
    logger.error('Ошибка обновления локации:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Ошибка при обновлении локации',
    });
  }
};

/**
 * Удалить локацию салона
 * DELETE /api/salon-locations/:id
 * Требуется авторизация: admin
 */
const deleteLocation = async (req, res) => {
  try {
    const { salonId } = req.params;

    // Проверка прав доступа (только админ)
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Только администратор может удалить локацию',
      });
    }

    const result = await salonLocationService.deleteLocation(salonId);

    logger.info(`Удалена локация салона ${salonId}`, {
      userId: req.user?.id,
      ip: req.ip,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Ошибка удаления локации:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Ошибка при удалении локации',
    });
  }
};

module.exports = {
  getAllLocations,
  getLocationsByCity,
  getLocationBySalonId,
  getNearbySalons,
  createLocation,
  updateLocation,
  deleteLocation,
};
