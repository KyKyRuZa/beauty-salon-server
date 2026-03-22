const defineAssociations = (models) => {
  const {
    User,
    Client,
    Master,
    Salon,
    ServiceCategory,
    MasterService,
    TimeSlot,
    Admin,
    Booking,
    MasterAvailability,
    Review,
    Favorite,
    MasterSkill,
    MasterPortfolio,
  } = models;

  User.hasOne(Client, {
    foreignKey: {
      name: 'user_id',
      allowNull: false,
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'client_profile',
  });
  Client.belongsTo(User, {
    foreignKey: {
      name: 'user_id',
      allowNull: false,
    },
    targetKey: 'id',
    as: 'user',
  });

  User.hasOne(Master, {
    foreignKey: {
      name: 'user_id',
      allowNull: false,
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'master_profile',
  });
  Master.belongsTo(User, {
    foreignKey: {
      name: 'user_id',
      allowNull: false,
    },
    targetKey: 'id',
    as: 'user',
  });

  User.hasOne(Salon, {
    foreignKey: {
      name: 'user_id',
      allowNull: false,
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'salon_profile',
  });
  Salon.belongsTo(User, {
    foreignKey: {
      name: 'user_id',
      allowNull: false,
    },
    targetKey: 'id',
    as: 'user',
  });

  Master.belongsTo(Salon, {
    foreignKey: {
      name: 'salon_id',
      allowNull: true,
    },
    onDelete: 'SET NULL',
    hooks: true,
    targetKey: 'id',
    as: 'salon',
  });
  Salon.hasMany(Master, {
    foreignKey: {
      name: 'salon_id',
      allowNull: true,
    },
    sourceKey: 'id',
    as: 'masters',
  });

  // Связи MasterService (перенесены из модели)
  MasterService.belongsTo(Master, {
    foreignKey: 'master_id',
    targetKey: 'id',
    as: 'master_provider',
    onDelete: 'CASCADE',
  });
  Master.hasMany(MasterService, {
    foreignKey: 'master_id',
    sourceKey: 'id',
    as: 'services',
    onDelete: 'CASCADE',
  });

  MasterService.belongsTo(Salon, {
    foreignKey: 'salon_id',
    targetKey: 'id',
    as: 'salon',
    onDelete: 'CASCADE',
  });
  Salon.hasMany(MasterService, {
    foreignKey: 'salon_id',
    sourceKey: 'id',
    as: 'master_services',
    onDelete: 'CASCADE',
  });

  MasterService.belongsTo(ServiceCategory, {
    foreignKey: 'category_id',
    targetKey: 'id',
    as: 'category',
    onDelete: 'SET NULL',
  });

  // Связи TimeSlot (перенесены из модели)
  TimeSlot.belongsTo(MasterService, {
    foreignKey: 'service_id',
    targetKey: 'id',
    as: 'service',
    onDelete: 'SET NULL',
  });

  // Связи MasterAvailability (перенесены из модели)
  MasterAvailability.belongsTo(MasterService, {
    foreignKey: 'service_id',
    targetKey: 'id',
    as: 'service',
    onDelete: 'SET NULL',
  });

  TimeSlot.belongsTo(Master, {
    foreignKey: {
      name: 'master_id',
      allowNull: false,
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'time_slot_master',
  });
  Master.hasMany(TimeSlot, {
    foreignKey: {
      name: 'master_id',
      allowNull: false,
    },
    sourceKey: 'id',
    as: 'time_slots',
  });

  Booking.belongsTo(Client, {
    foreignKey: {
      name: 'client_id',
      allowNull: false,
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'client',
  });
  Client.hasMany(Booking, {
    foreignKey: {
      name: 'client_id',
      allowNull: false,
    },
    sourceKey: 'id',
    as: 'bookings',
  });

  Booking.belongsTo(Master, {
    foreignKey: {
      name: 'master_id',
      allowNull: false,
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'booking_master',
  });
  Master.hasMany(Booking, {
    foreignKey: {
      name: 'master_id',
      allowNull: false,
    },
    sourceKey: 'id',
    as: 'bookings',
  });

  Booking.belongsTo(MasterService, {
    foreignKey: {
      name: 'master_service_id',
      allowNull: false,
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'service',
  });
  MasterService.hasMany(Booking, {
    foreignKey: {
      name: 'master_service_id',
      allowNull: false,
    },
    sourceKey: 'id',
    as: 'bookings',
  });

  Booking.belongsTo(TimeSlot, {
    foreignKey: {
      name: 'time_slot_id',
      allowNull: true,
    },
    onDelete: 'SET NULL',
    hooks: true,
    targetKey: 'id',
    as: 'timeSlot',
  });
  TimeSlot.hasMany(Booking, {
    foreignKey: {
      name: 'time_slot_id',
      allowNull: true,
    },
    sourceKey: 'id',
    as: 'bookings',
  });

  MasterAvailability.belongsTo(Master, {
    foreignKey: {
      name: 'master_id',
      allowNull: false,
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'availability_master',
  });

  // Связь MasterAvailability ↔ TimeSlot
  MasterAvailability.hasMany(TimeSlot, {
    foreignKey: 'master_availability_id',
    sourceKey: 'id',
    as: 'slots',
  });
  TimeSlot.belongsTo(MasterAvailability, {
    foreignKey: 'master_availability_id',
    targetKey: 'id',
    as: 'master_availability',
  });

  User.hasOne(Admin, {
    foreignKey: {
      name: 'user_id',
      allowNull: false,
    },
    onDelete: 'CASCADE',
    hooks: true,
    targetKey: 'id',
    as: 'admin_profile',
  });

  // Связь Admin (перенесена из модели)
  Admin.belongsTo(User, {
    foreignKey: 'user_id',
    targetKey: 'id',
    as: 'user',
    onDelete: 'CASCADE',
  });

  if (Review) {
    Review.belongsTo(User, {
      foreignKey: {
        name: 'user_id',
        allowNull: false,
      },
      targetKey: 'id',
      as: 'user',
    });

    Review.belongsTo(Master, {
      foreignKey: {
        name: 'master_id',
        allowNull: true,
      },
      targetKey: 'id',
      as: 'master',
    });

    Review.belongsTo(Salon, {
      foreignKey: {
        name: 'salon_id',
        allowNull: true,
      },
      targetKey: 'id',
      as: 'salon',
    });

    Review.belongsTo(Booking, {
      foreignKey: {
        name: 'booking_id',
        allowNull: true,
      },
      targetKey: 'id',
      as: 'booking',
    });

    User.hasMany(Review, {
      foreignKey: {
        name: 'user_id',
        allowNull: false,
      },
      sourceKey: 'id',
      as: 'user_reviews',
    });

    Master.hasMany(Review, {
      foreignKey: {
        name: 'master_id',
        allowNull: true,
      },
      sourceKey: 'id',
      as: 'master_reviews',
    });

    Salon.hasMany(Review, {
      foreignKey: {
        name: 'salon_id',
        allowNull: true,
      },
      sourceKey: 'id',
      as: 'salon_reviews',
    });

    Booking.hasOne(Review, {
      foreignKey: {
        name: 'booking_id',
        allowNull: true,
      },
      sourceKey: 'id',
      as: 'booking_review',
    });
  }

  if (Favorite) {
    Favorite.belongsTo(User, {
      foreignKey: {
        name: 'user_id',
        allowNull: false,
      },
      targetKey: 'id',
      as: 'favorite_user',
    });

    Favorite.belongsTo(Master, {
      foreignKey: {
        name: 'master_id',
        allowNull: false,
      },
      targetKey: 'id',
      as: 'favorite_master',
    });

    User.hasMany(Favorite, {
      foreignKey: {
        name: 'user_id',
        allowNull: false,
      },
      sourceKey: 'id',
      as: 'user_favorites',
    });

    Master.hasMany(Favorite, {
      foreignKey: {
        name: 'master_id',
        allowNull: false,
      },
      sourceKey: 'id',
      as: 'master_favorites',
    });
  }

  if (MasterSkill) {
    MasterSkill.belongsTo(Master, {
      foreignKey: {
        name: 'master_id',
        allowNull: false,
      },
      targetKey: 'id',
      as: 'master',
      onDelete: 'CASCADE',
    });

    Master.hasMany(MasterSkill, {
      foreignKey: {
        name: 'master_id',
        allowNull: false,
      },
      sourceKey: 'id',
      as: 'skills',
      onDelete: 'CASCADE',
    });
  }

  if (MasterPortfolio) {
    MasterPortfolio.belongsTo(Master, {
      foreignKey: {
        name: 'master_id',
        allowNull: false,
      },
      targetKey: 'id',
      as: 'master',
      onDelete: 'CASCADE',
    });

    Master.hasMany(MasterPortfolio, {
      foreignKey: {
        name: 'master_id',
        allowNull: false,
      },
      sourceKey: 'id',
      as: 'portfolio',
      onDelete: 'CASCADE',
    });
  }
};

module.exports = { defineAssociations };
