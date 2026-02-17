// Определение ассоциаций между моделями
const defineAssociations = (models) => {
  const { User, Client, Master, Salon, ServiceCategory, ServiceSubcategory, MasterService, TimeSlot, Admin, Booking, Order, MasterAvailability, Review, Favorite } = models;

  // Связи пользователя
  User.hasOne(Client, {
    foreignKey: {
      name: 'user_id',
      allowNull: false
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'client_profile'
  });
  Client.belongsTo(User, {
    foreignKey: {
      name: 'user_id',
      allowNull: false
    },
    targetKey: 'id',
    as: 'user'
  });

  User.hasOne(Master, {
    foreignKey: {
      name: 'user_id',
      allowNull: false
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'master_profile'
  });
  Master.belongsTo(User, {
    foreignKey: {
      name: 'user_id',
      allowNull: false
    },
    targetKey: 'id',
    as: 'user'
  });

  User.hasOne(Salon, {
    foreignKey: {
      name: 'user_id',
      allowNull: false
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'salon_profile'
  });
  Salon.belongsTo(User, {
    foreignKey: {
      name: 'user_id',
      allowNull: false
    },
    targetKey: 'id',
    as: 'user'
  });

  // Связи администратора - определены в модели Admin

  // Связи мастера
  Master.belongsTo(Salon, {
    foreignKey: {
      name: 'salon_id',
      allowNull: true
    },
    onDelete: 'SET NULL',
    hooks: true,
    targetKey: 'id',
    as: 'salon'
  });
  Salon.hasMany(Master, {
    foreignKey: {
      name: 'salon_id',
      allowNull: true
    },
    sourceKey: 'id',
    as: 'masters'
  });

  // Новые связи для MasterService (связь мастер-услуга)
  MasterService.belongsTo(Master, {
    foreignKey: {
      name: 'master_id',
      allowNull: false  // Изменил на false, чтобы соответствовать модели
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'master_provider'  // Изменил алиас, чтобы избежать конфликта
  });
  Master.hasMany(MasterService, {
    foreignKey: {
      name: 'master_id',
      allowNull: false  // Изменил на false, чтобы соответствовать модели
    },
    sourceKey: 'id',
    as: 'services'
  });

  // Связи MasterService с салоном
  MasterService.belongsTo(Salon, {
    foreignKey: {
      name: 'salon_id',
      allowNull: true  // Может быть null для услуг независимых мастеров
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'master_service_salon'
  });
  Salon.hasMany(MasterService, {
    foreignKey: {
      name: 'salon_id',
      allowNull: true  // Может быть null для услуг независимых мастеров
    },
    sourceKey: 'id',
    as: 'master_services'
  });

  // Связи MasterService с категорией услуг
  MasterService.belongsTo(ServiceCategory, {
    foreignKey: {
      name: 'category_id',
      allowNull: true  // Может быть null для услуг без категории
    },
    onDelete: 'SET NULL',
    hooks: true,
    targetKey: 'id',
    as: 'service_category'
  });
  ServiceCategory.hasMany(MasterService, {
    foreignKey: {
      name: 'category_id',
      allowNull: true  // Может быть null для услуг без категории
    },
    sourceKey: 'id',
    as: 'master_services_by_category'
  });


  // Связи категорий услуг - ассоциации определены в самих моделях

  // Связи временных слотов
  TimeSlot.belongsTo(Master, {
    foreignKey: {
      name: 'master_id',
      allowNull: false
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'time_slot_master'  // Изменил алиас, чтобы избежать конфликта
  });
  Master.hasMany(TimeSlot, {
    foreignKey: {
      name: 'master_id',
      allowNull: false
    },
    sourceKey: 'id',
    as: 'time_slots'
  });

  // Связи бронирования (обновлённые)
  Booking.belongsTo(Client, {
    foreignKey: {
      name: 'client_id',
      allowNull: false
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'client'
  });
  Client.hasMany(Booking, {
    foreignKey: {
      name: 'client_id',
      allowNull: false
    },
    sourceKey: 'id',
    as: 'bookings'
  });

  Booking.belongsTo(Master, {
    foreignKey: {
      name: 'master_id',
      allowNull: false
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'booking_master'
  });
  Master.hasMany(Booking, {
    foreignKey: {
      name: 'master_id',
      allowNull: false
    },
    sourceKey: 'id',
    as: 'bookings'
  });

  Booking.belongsTo(MasterService, {
    foreignKey: {
      name: 'master_service_id',
      allowNull: false
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'service'
  });
  MasterService.hasMany(Booking, {
    foreignKey: {
      name: 'master_service_id',
      allowNull: false
    },
    sourceKey: 'id',
    as: 'bookings'
  });

  Booking.belongsTo(TimeSlot, {
    foreignKey: {
      name: 'time_slot_id',
      allowNull: true
    },
    onDelete: 'SET NULL',
    hooks: true,
    targetKey: 'id',
    as: 'timeSlot'
  });
  TimeSlot.hasMany(Booking, {
    foreignKey: {
      name: 'time_slot_id',
      allowNull: true
    },
    sourceKey: 'id',
    as: 'bookings'
  });
  

  // Связи заказов
  Order.belongsTo(User, {
    foreignKey: {
      name: 'user_id',
      allowNull: false
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'order_user'
  });
  
  
  Order.belongsTo(Booking, {
    foreignKey: {
      name: 'booking_id',
      allowNull: true
    },
    onDelete: 'SET NULL',
    hooks: true,
    targetKey: 'id',
    as: 'order_booking'
  });

  // Связи доступности мастеров
  MasterAvailability.belongsTo(Master, {
    foreignKey: {
      name: 'master_id',
      allowNull: false
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'availability_master'
  });
  

  // Связи администратора
  User.hasOne(Admin, {
    foreignKey: {
      name: 'user_id',
      allowNull: false
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'admin_profile'
  });

  // Связи отзывов
  if (Review) {
    // Связи от Review к другим моделям
    Review.belongsTo(User, {
      foreignKey: {
        name: 'user_id',
        allowNull: false
      },
      targetKey: 'id',
      as: 'user'
    });

    Review.belongsTo(Master, {
      foreignKey: {
        name: 'master_id',
        allowNull: true
      },
      targetKey: 'id',
      as: 'master'
    });

    Review.belongsTo(Salon, {
      foreignKey: {
        name: 'salon_id',
        allowNull: true
      },
      targetKey: 'id',
      as: 'salon'
    });

    Review.belongsTo(Booking, {
      foreignKey: {
        name: 'booking_id',
        allowNull: true
      },
      targetKey: 'id',
      as: 'booking'
    });

    // Обратные связи
    User.hasMany(Review, {
      foreignKey: {
        name: 'user_id',
        allowNull: false
      },
      sourceKey: 'id',
      as: 'user_reviews'
    });

    Master.hasMany(Review, {
      foreignKey: {
        name: 'master_id',
        allowNull: true
      },
      sourceKey: 'id',
      as: 'master_reviews'
    });

    Salon.hasMany(Review, {
      foreignKey: {
        name: 'salon_id',
        allowNull: true
      },
      sourceKey: 'id',
      as: 'salon_reviews'
    });

    Booking.hasOne(Review, {
      foreignKey: {
        name: 'booking_id',
        allowNull: true
      },
      sourceKey: 'id',
      as: 'booking_review'
    });
  }

  // Связи избранных мастеров
  if (Favorite) {
    // Связи от Favorite к другим моделям
    Favorite.belongsTo(User, {
      foreignKey: {
        name: 'user_id',
        allowNull: false
      },
      targetKey: 'id',
      as: 'favorite_user'
    });

    Favorite.belongsTo(Master, {
      foreignKey: {
        name: 'master_id',
        allowNull: false
      },
      targetKey: 'id',
      as: 'favorite_master'
    });

    // Обратные связи
    User.hasMany(Favorite, {
      foreignKey: {
        name: 'user_id',
        allowNull: false
      },
      sourceKey: 'id',
      as: 'user_favorites'
    });

    Master.hasMany(Favorite, {
      foreignKey: {
        name: 'master_id',
        allowNull: false
      },
      sourceKey: 'id',
      as: 'master_favorites'
    });
  }
};

module.exports = { defineAssociations };