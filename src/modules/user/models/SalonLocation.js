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
    allowNull: false,
    field: 'coordinates',
    comment: 'Координаты (PostGIS GEOGRAPHY POINT). Формат: "SRID=4326;POINT(lng lat)"'
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
    }
  ],
  timestamps: false,
  hooks: {
    beforeValidate: (location) => {
      // Преобразование координат в формат PostGIS если переданы как объект
      if (location.coordinates && typeof location.coordinates === 'object') {
        const { lat, lng } = location.coordinates;
        location.coordinates = `SRID=4326;POINT(${lng} ${lat})`;
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
  const match = this.coordinates.match(/POINT\(([^\s]+)\s+([^\)]+)\)/);
  if (match) {
    return {
      lng: parseFloat(match[1]),
      lat: parseFloat(match[2])
    };
  }
  return null;
};

SalonLocation.prototype.setCoordinates = function(lat, lng) {
  this.coordinates = `SRID=4326;POINT(${lng} ${lat})`;
};

// Статические методы
SalonLocation.findNearby = async function(lat, lng, radiusKm = 5, city = null) {
  const radii = [5, 10, 20, 50];
  const radiusMeters = radiusKm * 1000;
  
  for (const radius of radii) {
    const radiusM = radius * 1000;
    const query = `
      SELECT *, 
             ST_Distance(
               coordinates, 
               ST_MakePoint(:lng, :lat)::geography
             ) as distance_meters
      FROM user_schema.salon_locations
      WHERE ST_DWithin(coordinates, ST_MakePoint(:lng, :lat)::geography, :radius)
        ${city ? 'AND city = :city' : ''}
      ORDER BY distance_meters ASC
      LIMIT 20
    `;
    
    const results = await sequelize.query(query, {
      model: this,
      mapToModel: true,
      replacements: {
        lat,
        lng,
        radius: radiusM,
        ...(city && { city })
      }
    });
    
    if (results.length > 0) {
      return {
        locations: results,
        searchRadius: radius,
        message: radius > 5 ? `Найдено в радиусе ${radius} км` : 'Ближайшие салоны'
      };
    }
  }
  
  // Если ничего не найдено, вернуть все салоны города
  const where = city ? { city } : {};
  const locations = await this.findAll({ where });
  
  return {
    locations,
    searchRadius: null,
    message: 'Все салоны города'
  };
};

SalonLocation.findByCity = async function(city) {
  return await this.findAll({
    where: { city },
    order: [['is_verified', 'DESC']]
  });
};

module.exports = SalonLocation;
