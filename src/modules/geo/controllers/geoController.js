const geoService = require('../services/geoService');
const { createLogger } = require('../../../utils/logger');
const logger = createLogger('modular-monolith-geo');

/**
 * POST /api/geo/detect-city
 * Определить город по координатам
 */
const detectCity = async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать координаты (lat, lng)'
      });
    }

    // Проверяем что координаты валидные
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный формат координат'
      });
    }

    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({
        success: false,
        message: 'Координаты вне допустимого диапазона'
      });
    }

    // Находим ближайший город (с кэшированием)
    const result = await geoService.findNearestCity(latNum, lngNum);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Город не найден в радиусе 100 км'
      });
    }

    logger.info(`Город определён: ${result.city} (${result.distance} км)`, {
      coordinates: { lat: latNum, lng: lngNum },
      ip: req.ip
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Ошибка определения города:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при определении города'
    });
  }
};

/**
 * GET /api/geo/cache-stats
 * Получить статистику кэша
 */
const getCacheStats = async (req, res) => {
  try {
    const stats = geoService.getCacheStats();
    
    // Получаем размер кэша из Redis
    const redis = require('../../../config/redis');
    const dbSize = await redis.dbsize();
    
    res.json({
      success: true,
      data: {
        ...stats,
        redisKeys: dbSize
      }
    });
  } catch (error) {
    logger.error('Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  detectCity,
  getCacheStats
};
