const { sequelize } = require('../../../config/database');
const SalonLocation = require('../models/SalonLocation');
const Salon = require('../models/Salon');

/**
 * Получить все локации салонов с фильтрами
 */
const getAllLocations = async ({ city = null, is_verified = null, limit = 100, offset = 0 }) => {
  const where = {};
  
  if (city) where.city = city;
  if (is_verified !== null) where.is_verified = is_verified;
  
  const locations = await SalonLocation.findAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['is_verified', 'DESC'], ['city', 'ASC']],
    include: [{
      model: Salon,
      as: 'salon',
      attributes: ['id', 'name', 'rating', 'image_url']
    }]
  });
  
  return locations.map(loc => ({
    ...loc.toJSON(),
    coordinates: loc.getCoordinates()
  }));
};

/**
 * Получить локации по городу
 */
const getLocationsByCity = async (city) => {
  const locations = await SalonLocation.findAll({
    where: { city },
    order: [['is_verified', 'DESC']],
    include: [{
      model: Salon,
      as: 'salon',
      attributes: ['id', 'name', 'rating', 'image_url', 'address']
    }]
  });
  
  return locations.map(loc => ({
    ...loc.toJSON(),
    coordinates: loc.getCoordinates()
  }));
};

/**
 * Получить локацию конкретного салона
 */
const getLocationBySalonId = async (salonId) => {
  const location = await SalonLocation.findOne({
    where: { salon_id: salonId },
    include: [{
      model: Salon,
      as: 'salon',
      attributes: ['id', 'name', 'rating', 'image_url', 'address', 'description']
    }]
  });
  
  if (!location) return null;
  
  const data = location.toJSON();
  data.coordinates = location.getCoordinates();
  
  return data;
};

/**
 * Найти ближайшие салоны по координатам пользователя
 * Постепенное расширение радиуса: 5 → 10 → 20 → 50 км
 */
const getNearbySalons = async (lat, lng, city = null) => {
  const radii = [5, 10, 20, 50];
  
  for (const radius of radii) {
    const radiusMeters = radius * 1000;
    
    const query = `
      SELECT 
        sl.*,
        ST_Distance(
          sl.coordinates, 
          ST_MakePoint(:lng, :lat)::geography
        ) as distance_meters,
        s.id as salon_id,
        s.name as salon_name,
        s.rating as salon_rating,
        s.image_url as salon_image,
        s.address as salon_address,
        s.description as salon_description
      FROM user_schema.salon_locations sl
      JOIN user_schema.salons s ON sl.salon_id = s.id
      WHERE ST_DWithin(sl.coordinates, ST_MakePoint(:lng, :lat)::geography, :radius)
        ${city ? 'AND sl.city = :city' : ''}
      ORDER BY distance_meters ASC
      LIMIT 20
    `;
    
    const results = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      replacements: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: radiusMeters,
        ...(city && { city })
      }
    });
    
    if (results.length > 0) {
      return {
        salons: results.map(salon => ({
          id: salon.salon_id,
          salon_location_id: salon.id,
          name: salon.salon_name,
          rating: salon.salon_rating,
          image_url: salon.salon_image,
          address: salon.salon_address,
          description: salon.description,
          city: salon.city,
          coordinates: {
            lat: parseFloat(salon.coordinates ? salon.coordinates.replace(/.*POINT\(([^)]+)\).*/, '$1').split(' ')[1] : 0),
            lng: parseFloat(salon.coordinates ? salon.coordinates.replace(/.*POINT\(([^)]+)\).*/, '$1').split(' ')[0] : 0)
          },
          working_hours: salon.working_hours,
          is_verified: salon.is_verified,
          distance_meters: Math.round(salon.distance_meters),
          distance_km: (salon.distance_meters / 1000).toFixed(1)
        })),
        searchRadius: radius,
        message: radius > 5 
          ? `Найдено салонов: ${results.length} в радиусе ${radius} км` 
          : 'Ближайшие салоны'
      };
    }
  }
  
  // Если ничего не найдено, вернуть все салоны города
  if (city) {
    const allSalons = await getLocationsByCity(city);
    return {
      salons: allSalons,
      searchRadius: null,
      message: `Все салоны города ${city}`
    };
  }
  
  return {
    salons: [],
    searchRadius: null,
    message: 'Салоны не найдены'
  };
};

/**
 * Создать локацию салона
 */
const createLocation = async (data) => {
  const { salon_id, city, address, coordinates, working_hours } = data;
  
  // Проверка на существующую локацию
  const existing = await SalonLocation.findOne({ where: { salon_id } });
  if (existing) {
    throw new Error('Локация для этого салона уже существует');
  }
  
  const location = await SalonLocation.create({
    salon_id,
    city,
    address,
    coordinates,
    working_hours: working_hours || SalonLocation.options.defaultScope?.working_hours?.defaultValue
  });
  
  return getLocationBySalonId(salon_id);
};

/**
 * Обновить локацию салона
 */
const updateLocation = async (salonId, data) => {
  const location = await SalonLocation.findOne({ where: { salon_id: salonId } });
  
  if (!location) {
    throw new Error('Локация не найдена');
  }
  
  if (data.city) location.city = data.city;
  if (data.address) location.address = data.address;
  if (data.coordinates) {
    if (typeof data.coordinates === 'object') {
      location.setCoordinates(data.coordinates.lat, data.coordinates.lng);
    } else {
      location.coordinates = data.coordinates;
    }
  }
  if (data.working_hours) location.working_hours = data.working_hours;
  if (data.is_verified !== undefined) location.is_verified = data.is_verified;
  
  await location.save();
  
  return getLocationBySalonId(salonId);
};

/**
 * Удалить локацию салона
 */
const deleteLocation = async (salonId) => {
  const location = await SalonLocation.findOne({ where: { salon_id: salonId } });
  
  if (!location) {
    throw new Error('Локация не найдена');
  }
  
  await location.destroy();
  
  return { success: true, message: 'Локация удалена' };
};

/**
 * Проверить, открыт ли салон сейчас
 */
const isSalonOpenNow = (workingHours) => {
  if (!workingHours) return false;
  
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTime = currentHours * 60 + currentMinutes;
  
  const daySchedule = workingHours[currentDay];
  if (!daySchedule || !daySchedule.is_open) return false;
  
  const [openHours, openMinutes] = daySchedule.open.split(':').map(Number);
  const [closeHours, closeMinutes] = daySchedule.close.split(':').map(Number);
  
  const openTime = openHours * 60 + openMinutes;
  const closeTime = closeHours * 60 + closeMinutes;
  
  return currentTime >= openTime && currentTime <= closeTime;
};

module.exports = {
  getAllLocations,
  getLocationsByCity,
  getLocationBySalonId,
  getNearbySalons,
  createLocation,
  updateLocation,
  deleteLocation,
  isSalonOpenNow
};
