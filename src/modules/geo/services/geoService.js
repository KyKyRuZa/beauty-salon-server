const { createLogger } = require('../../../utils/logger');
const { circuitBreakers } = require('../../../utils/circuitBreaker');
const logger = createLogger('modular-monolith-geo');
const fs = require('fs');
const path = require('path');
const redis = require('../../../config/redis');

// Загрузка GeoJSON границ городов
let cityBoundaries = null;
try {
  const boundariesPath = path.join(__dirname, '../../../../data/city_boundaries.geojson');
  const boundariesData = JSON.parse(fs.readFileSync(boundariesPath, 'utf8'));
  cityBoundaries = boundariesData.features;
  logger.info(`Загружено границ городов: ${cityBoundaries.length}`);
} catch (error) {
  logger.warn('Не удалось загрузить границы городов, используем расстояния', error.message);
  cityBoundaries = [];
}

// Координаты центров городов
const CITY_COORDINATES = {
  Казань: { lat: 55.7887, lng: 49.1221 },
  Альметьевск: { lat: 55.0167, lng: 52.32 },
  Уфа: { lat: 54.7388, lng: 55.9721 },
  Ижевск: { lat: 56.8527, lng: 53.2115 },
  'Набережные Челны': { lat: 55.7256, lng: 52.4069 },
};

// Кэш статистика
let cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
};

/**
 * Рассчитать расстояние между двумя точками (формула Haversine)
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/**
 * Проверить попадает ли точка в полигон (алгоритм Ray Casting)
 * @param {number} lat - Широта точки
 * @param {number} lng - Долгота точки
 * @param {number[][]} polygon - Массив координат полигона [[lng, lat], ...]
 * @returns {boolean}
 */
const isPointInPolygon = (lat, lng, polygon) => {
  let inside = false;
  const len = polygon.length;

  for (let i = 0, j = len - 1; i < len; j = i++) {
    const [lng1, lat1] = polygon[i];
    const [lng2, lat2] = polygon[j];

    if (lat1 > lat !== lat2 > lat && lng < ((lng2 - lng1) * (lat - lat1)) / (lat2 - lat1) + lng1) {
      inside = !inside;
    }
  }

  return inside;
};

/**
 * Найти город по полигону границ
 * @param {number} lat - Широта пользователя
 * @param {number} lng - Долгота пользователя
 * @returns {string | null}
 */
const findCityByPolygon = (lat, lng) => {
  if (!cityBoundaries || cityBoundaries.length === 0) {
    return null;
  }

  for (const feature of cityBoundaries) {
    const city = feature.properties.name;
    const coordinates = feature.geometry.coordinates[0];

    if (isPointInPolygon(lat, lng, coordinates)) {
      logger.debug(`Точка [${lat}, ${lng}] внутри границ города ${city}`);
      return city;
    }
  }

  logger.debug(`Точка [${lat}, ${lng}] не попала ни в один полигон`);
  return null;
};

/**
 * Найти ближайший город по координатам (с кэшированием в Redis)
 * @param {number} lat - Широта пользователя
 * @param {number} lng - Долгота пользователя
 * @returns {Promise<{city: string, distance: number} | null>}
 */
const findNearestCity = async (lat, lng) => {
  // Округляем координаты до 4 знаков для лучшего кэширования (~11м точность)
  const latRounded = Math.round(lat * 10000) / 10000;
  const lngRounded = Math.round(lng * 10000) / 10000;
  const cacheKey = `geo:${latRounded}:${lngRounded}`;

  try {
    // 1. Проверяем кэш через circuit breaker
    const cached = await circuitBreakers.yandexGeo.call(async () => {
      return await redis.get(cacheKey);
    });
    
    if (cached) {
      cacheStats.hits++;
      logger.debug(`Кэш hit: ${cacheKey}`);
      return JSON.parse(cached);
    }

    cacheStats.misses++;

    // 2. Проверяем попадание в полигон
    const cityByPolygon = findCityByPolygon(lat, lng);
    if (cityByPolygon) {
      const result = { city: cityByPolygon, distance: 0 };
      await redis.setex(cacheKey, 86400, JSON.stringify(result)); // 24 часа
      logger.info(`Город определён по границам: ${cityByPolygon}`);
      return result;
    }

    // 3. Fallback: ищем по расстоянию до центра
    let nearestCity = null;
    let minDistance = Infinity;

    for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
      const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
      logger.debug(`Город ${city}: ${distance.toFixed(1)} км`);

      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    // Если ближайший город дальше 100км, возвращаем null
    if (minDistance > 100) {
      logger.warn(`Ближайший город ${nearestCity} слишком далеко (${minDistance.toFixed(1)} км)`);
      return null;
    }

    const result = {
      city: nearestCity,
      distance: Math.round(minDistance * 10) / 10,
    };

    // Сохраняем в кэш
    await redis.setex(cacheKey, 86400, JSON.stringify(result));
    logger.info(`Определён город: ${nearestCity} (${minDistance.toFixed(1)} км от пользователя)`);

    return result;
  } catch (error) {
    cacheStats.errors++;
    logger.error('Ошибка кэширования:', error.message);

    // Fallback без кэша
    const cityByPolygon = findCityByPolygon(lat, lng);
    if (cityByPolygon) {
      return { city: cityByPolygon, distance: 0 };
    }

    // ... упрощённая логика для fallback
    let nearestCity = null;
    let minDistance = Infinity;
    for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
      const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    if (minDistance > 100) return null;

    return {
      city: nearestCity,
      distance: Math.round(minDistance * 10) / 10,
    };
  }
};

/**
 * Получить статистику кэша
 */
const getCacheStats = () => {
  const total = cacheStats.hits + cacheStats.misses;
  return {
    ...cacheStats,
    total,
    hitRate: total > 0 ? ((cacheStats.hits / total) * 100).toFixed(2) + '%' : '0%',
  };
};

module.exports = {
  calculateDistance,
  findNearestCity,
  findCityByPolygon,
  isPointInPolygon,
  getCacheStats,
  CITY_COORDINATES,
};
