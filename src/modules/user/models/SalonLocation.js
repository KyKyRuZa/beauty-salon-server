const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const SalonLocation = sequelize.define('SalonLocation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id'
  },
  salon_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'salon_id',
    references: {
      model: {
        schema: 'user_schema',
        tableName: 'salons'
      },
      key: 'id'
    },
    comment: 'ID салона'
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'city',
    validate: {
      notEmpty: {
        msg: 'Город не может быть пустым'
      },
      len: {
        args: [2, 100],
        msg: 'Название города должно быть от 2 до 100 символов'
      }
    },
    comment: 'Город'
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'address',
    validate: {
      notEmpty: {
        msg: 'Адрес не может быть пустым'
      },
      len: {
        args: [2, 500],
        msg: 'Адрес не должен превышать 500 символов'
      }
    },
    comment: 'Текстовый адрес салона'
  },
  coordinates: {
    type: DataTypes.STRING,
    allowNull: true, // Оставляем для обратной совместимости
    field: 'coordinates',
    comment: 'Координаты в текстовом формате (устаревшее). Формат: "SRID=4326;POINT(lng lat)"'
  },
  coordinatesGeo: {
    type: DataTypes.STRING(255), // Используем STRING т.к. Sequelize не поддерживает GEOGRAPHY напрямую
    allowNull: false,
    field: 'coordinates_geo',
    comment: 'Гео-координаты PostGIS GEOGRAPHY(POINT, 4326) в формате WKT'
  },
  working_hours: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'working_hours',
    comment: 'Расписание работы по дням недели (JSONB)',
    defaultValue: {
      monday: { open: '09:00', close: '20:00', is_open: true },
      tuesday: { open: '09:00', close: '20:00', is_open: true },
      wednesday: { open: '09:00', close: '20:00', is_open: true },
      thursday: { open: '09:00', close: '20:00', is_open: true },
      friday: { open: '09:00', close: '20:00', is_open: true },
      saturday: { open: '10:00', close: '18:00', is_open: true },
      sunday: { open: '10:00', close: '18:00', is_open: false }
    }
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified',
    comment: 'Проверено ли местоположение модерацией'
  }
}, {
  tableName: 'salon_locations',
  schema: 'user_schema',
  indexes: [
    {
      fields: ['city'],
      name: 'salon_locations_city_idx'
    },
    {
      fields: ['salon_id'],
      name: 'salon_locations_salon_id_idx'
    },
    {
      fields: ['is_verified'],
      name: 'salon_locations_is_verified_idx'
    },
    {
      fields: [sequelize.col('coordinates_geo')],
      name: 'salon_locations_coordinates_geo_idx',
      using: 'GIST'
    }
  ],
  timestamps: false,
  hooks: {
    beforeValidate: (location) => {
      // Преобразование координат в формат PostGIS если переданы как объект
      if (location.coordinatesGeo && typeof location.coordinatesGeo === 'object') {
        const { lat, lng } = location.coordinatesGeo;
        location.coordinatesGeo = `SRID=4326;POINT(${lng} ${lat})`;
      }
      // Конвертация из старого формата coordinates в coordinatesGeo
      if (location.coordinates && !location.coordinatesGeo && location.coordinates.startsWith('SRID=')) {
        location.coordinatesGeo = location.coordinates;
      }
    }
  }
});

// Ассоциации
SalonLocation.associate = (models) => {
  if (models.Salon) {
    SalonLocation.belongsTo(models.Salon, {
      foreignKey: 'salon_id',
      as: 'salon',
      targetKey: 'id'
    });
  }
};

// Методы экземпляра
SalonLocation.prototype.getCoordinates = function() {
  // Парсинг координат из формата PostGIS "SRID=4326;POINT(lng lat)"
  const coordString = this.coordinatesGeo || this.coordinates;
  if (!coordString) return null;
  
  const match = coordString.match(/POINT\(([^\s]+)\s+([^\)]+)\)/);
  if (match) {
    return {
      lng: parseFloat(match[1]),
      lat: parseFloat(match[2])
    };
  }
  return null;
};

SalonLocation.prototype.setCoordinates = function(lat, lng) {
  this.coordinatesGeo = `SRID=4326;POINT(${lng} ${lat})`;
};

// Статические методы
SalonLocation.findNearby = async function(lat, lng, radiusKm = 5, city = null) {
  const radiusMeters = radiusKm * 1000;

  const query = `
    SELECT 
      sl.*,
      ST_Distance(sl.coordinates_geo, ST_MakePoint(:lng, :lat)::geography) as distance_meters
    FROM user_schema.salon_locations sl
    WHERE ST_DWithin(sl.coordinates_geo, ST_MakePoint(:lng, :lat)::geography, :radius)
      ${city ? 'AND sl.city = :city' : ''}
    ORDER BY distance_meters ASC
    LIMIT 20
  `;

  const results = await sequelize.query(query, {
    model: this,
    mapToModel: true,
    replacements: {
      lat,
      lng,
      radius: radiusMeters,
      ...(city && { city })
    }
  });

  return {
    locations: results,
    searchRadius: radiusKm,
    message: `Найдено салонов: ${results.length}`
  };
};

SalonLocation.findByCity = async function(city) {
  return await this.findAll({
    where: { city },
    order: [['is_verified', 'DESC']]
  });
};

module.exports = SalonLocation;
