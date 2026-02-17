const { createLogger } = require('../../../utils/logger');
const {
  getDashboardStats: getStatsService,
  getAllUsers: getAllUsersService,
  getAllAdmins: getAllAdminsService,
  createAdmin: createAdminService,
  getAllCategories: getAllCategoriesService,
  createCategory: createCategoryService,
  updateCategory: updateCategoryService,
  deleteCategory: deleteCategoryService
} = require('../services/adminService');
const { Op } = require('sequelize');
const Admin = require('../models/Admin');

// Create a logger instance for this controller
const logger = createLogger('admin-controller');

// Get admin dashboard statistics
const getDashboardStats = async (req, res) => {
  logger.info('Получение статистики админ-панели', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    // Проверяем, что пользователь является администратором
    let admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
    logger.info('Проверка администратора', { userId: req.user.userId || req.user.id, adminFound: !!admin, userRole: req.user.role });
    
    // Если у пользователя роль admin, но нет записи в таблице администраторов, создаем её
    if (!admin && req.user.role === 'admin') {
      logger.info('Создание записи администратора для пользователя', { userId: req.user.userId || req.user.id });
      try {
        admin = await Admin.create({
          user_id: req.user.userId || req.user.id,
          role: 'admin',
          is_active: true
        });
        logger.info('Запись администратора успешно создана', { adminId: admin.id, userId: req.user.userId || req.user.id });
      } catch (creationError) {
        logger.error('Ошибка создания записи администратора', { error: creationError.message, userId: req.user.userId || req.user.id });
        // Повторная попытка найти администратора (возможно, запись была создана другим запросом)
        admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
      }
    }
    
    if (!admin) {
      logger.warn('Доступ запрещен - пользователь не является администратором', { userId: req.user.userId || req.user.id, userRole: req.user.role });
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Только администраторы могут просматривать статистику.'
      });
    }

    // Получаем статистику через сервис
    const stats = await getStatsService();

    logger.info('Статистика админ-панели успешно получена', { userId: req.user?.userId || req.user?.id, ip: req.ip });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Ошибка получения статистики админ-панели', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all users with pagination
const getAllUsers = async (req, res) => {
  logger.info('Получение списка пользователей', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    // Проверяем, что пользователь является администратором
    let admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
    logger.info('Проверка администратора', { userId: req.user.userId || req.user.id, adminFound: !!admin, userRole: req.user.role });
    
    // Если у пользователя роль admin, но нет записи в таблице администраторов, создаем её
    if (!admin && req.user.role === 'admin') {
      logger.info('Создание записи администратора для пользователя', { userId: req.user.userId || req.user.id });
      try {
        admin = await Admin.create({
          user_id: req.user.userId || req.user.id,
          role: 'admin',
          is_active: true
        });
        logger.info('Запись администратора успешно создана', { adminId: admin.id, userId: req.user.userId || req.user.id });
      } catch (creationError) {
        logger.error('Ошибка создания записи администратора', { error: creationError.message, userId: req.user.userId || req.user.id });
        // Повторная попытка найти администратора (возможно, запись была создана другим запросом)
        admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
      }
    }
    
    if (!admin) {
      logger.warn('Доступ запрещен - пользователь не является администратором', { userId: req.user.userId || req.user.id, userRole: req.user.role });
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Только администраторы могут просматривать пользователей.'
      });
    }

    const { page = 1, limit = 10, search, role } = req.query;
    
    const result = await getAllUsersService({ page, limit, search, role });

    logger.info('Список пользователей успешно получен', { count: result.rows.length, total: result.count, ip: req.ip });

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(result.count / limit)
      }
    });
  } catch (error) {
    logger.error('Ошибка получения списка пользователей', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all service categories with pagination
const getAllCategories = async (req, res) => {
  logger.info('Получение списка категорий услуг', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    // Проверяем, что пользователь является администратором
    let admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
    
    // Если у пользователя роль admin, но нет записи в таблице администраторов, создаем её
    if (!admin && req.user.role === 'admin') {
      admin = await Admin.create({
        user_id: req.user.userId || req.user.id,
        role: 'admin',
        is_active: true
      });
    }
    
    if (!admin) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Только администраторы могут просматривать категории.'
      });
    }

    const { page = 1, limit = 10, search } = req.query;

    const result = await getAllCategoriesService({ page, limit, search });

    logger.info('Список категорий услуг успешно получен', { count: result.rows.length, total: result.count, ip: req.ip });

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total: result.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(result.count / limit)
      }
    });
  } catch (error) {
    logger.error('Ошибка получения списка категорий услуг', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create a new service category
const createCategory = async (req, res) => {
  logger.info('Создание новой категории услуги', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    // Проверяем, что пользователь является администратором
    let admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
    
    // Если у пользователя роль admin, но нет записи в таблице администраторов, создаем её
    if (!admin && req.user.role === 'admin') {
      admin = await Admin.create({
        user_id: req.user.userId || req.user.id,
        role: 'admin',
        is_active: true
      });
    }
    
    if (!admin) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Только администраторы могут создавать категории.'
      });
    }

    const categoryData = req.body;

    const category = await createCategoryService(categoryData);

    logger.info('Категория услуги успешно создана', { categoryId: category.id, ip: req.ip });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Ошибка создания категории услуги', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update a service category
const updateCategory = async (req, res) => {
  logger.info('Обновление категории услуги', { categoryId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    // Проверяем, что пользователь является администратором
    let admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
    
    // Если у пользователя роль admin, но нет записи в таблице администраторов, создаем её
    if (!admin && req.user.role === 'admin') {
      admin = await Admin.create({
        user_id: req.user.userId || req.user.id,
        role: 'admin',
        is_active: true
      });
    }
    
    if (!admin) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Только администраторы могут обновлять категории.'
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const category = await updateCategoryService(id, updateData);

    logger.info('Категория услуги успешно обновлена', { categoryId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Ошибка обновления категории услуги', { error: error.message, categoryId: req.params.id, ip: req.ip });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete a service category
const deleteCategory = async (req, res) => {
  logger.info('Удаление категории услуги', { categoryId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    // Проверяем, что пользователь является администратором
    let admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
    
    // Если у пользователя роль admin, но нет записи в таблице администраторов, создаем её
    if (!admin && req.user.role === 'admin') {
      admin = await Admin.create({
        user_id: req.user.userId || req.user.id,
        role: 'admin',
        is_active: true
      });
    }
    
    if (!admin) {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Только администраторы могут удалять категории.'
      });
    }

    const { id } = req.params;

    const result = await deleteCategoryService(id);

    if (!result) {
      logger.warn('Категория услуги не найдена для удаления', { categoryId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Категория услуги не найдена'
      });
    }

    logger.info('Категория услуги успешно удалена', { categoryId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      message: 'Категория услуги успешно удалена'
    });
  } catch (error) {
    logger.error('Ошибка удаления категории услуги', { error: error.message, categoryId: req.params.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create a new admin
const createAdmin = async (req, res) => {
  logger.info('Создание нового администратора', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    // Проверяем, что текущий пользователь является суперадминистратором
    let currentAdmin = await Admin.findOne({
      where: {
        user_id: req.user.userId || req.user.id,
        is_active: true
      }
    });

    // Если у пользователя роль admin, но нет записи в таблице администраторов, создаем её
    if (!currentAdmin && req.user.role === 'admin') {
      currentAdmin = await Admin.create({
        user_id: req.user.userId || req.user.id,
        role: 'admin',
        is_active: true
      });
    }

    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Только суперадминистраторы могут создавать других администраторов.'
      });
    }

    const adminData = req.body;

    const newAdmin = await createAdminService(adminData);

    logger.info('Новый администратор успешно создан', { adminId: newAdmin.id, userId: adminData.user_id, ip: req.ip });

    // Формируем ответ с явным указанием полей, включая first_name и last_name
    const formattedData = {
      id: newAdmin.id,
      user_id: newAdmin.user_id,
      role: newAdmin.role,
      first_name: newAdmin.first_name,
      last_name: newAdmin.last_name,
      is_active: newAdmin.is_active,
      created_at: newAdmin.created_at
    };

    res.status(201).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    logger.error('Ошибка создания администратора', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all admins
const getAllAdmins = async (req, res) => {
  logger.info('Получение списка администраторов', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    // Проверяем, что пользователь является администратором
    let admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
    logger.info('Проверка администратора', { userId: req.user.userId || req.user.id, adminFound: !!admin, userRole: req.user.role });

    // Если у пользователя роль admin, но нет записи в таблице администраторов, создаем её
    if (!admin && req.user.role === 'admin') {
      logger.info('Создание записи администратора для пользователя', { userId: req.user.userId || req.user.id });
      try {
        admin = await Admin.create({
          user_id: req.user.userId || req.user.id,
          role: 'admin',
          is_active: true
        });
        logger.info('Запись администратора успешно создана', { adminId: admin.id, userId: req.user.userId || req.user.id });
      } catch (creationError) {
        logger.error('Ошибка создания записи администратора', { error: creationError.message, userId: req.user.userId || req.user.id });
        // Повторная попытка найти администратора (возможно, запись была создана другим запросом)
        admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
      }
    }

    if (!admin) {
      logger.warn('Доступ запрещен - пользователь не является администратором', { userId: req.user.userId || req.user.id, userRole: req.user.role });
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Только администраторы могут просматривать список администраторов.'
      });
    }

    const { page = 1, limit = 10, search } = req.query;

    const result = await getAllAdminsService({ page, limit, search });

    logger.info('Список администраторов успешно получен', { count: result.rows.length, total: result.count, ip: req.ip });

    // Формируем ответ с явным указанием полей, включая first_name и last_name
    const formattedData = result.rows.map(admin => ({
      id: admin.id,
      user_id: admin.user_id,
      role: admin.role,
      first_name: admin.first_name,
      last_name: admin.last_name,
      is_active: admin.is_active,
      created_at: admin.created_at
    }));

    res.status(200).json({
      success: true,
      data: formattedData,
      pagination: {
        total: result.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(result.count / limit)
      }
    });
  } catch (error) {
    logger.error('Ошибка получения списка администраторов', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get current admin profile
const getCurrentAdmin = async (req, res) => {
  logger.info('Получение профиля текущего администратора', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    // Проверяем, что пользователь является администратором
    let admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
    logger.info('Проверка администратора', { userId: req.user.userId || req.user.id, adminFound: !!admin, userRole: req.user.role });

    // Если у пользователя роль admin, но нет записи в таблице администраторов, создаем её
    if (!admin && req.user.role === 'admin') {
      logger.info('Создание записи администратора для пользователя', { userId: req.user.userId || req.user.id });
      try {
        admin = await Admin.create({
          user_id: req.user.userId || req.user.id,
          role: 'admin',
          is_active: true
        });
        logger.info('Запись администратора успешно создана', { adminId: admin.id, userId: req.user.userId || req.user.id });
      } catch (creationError) {
        logger.error('Ошибка создания записи администратора', { error: creationError.message, userId: req.user.userId || req.user.id });
        // Повторная попытка найти администратора (возможно, запись была создана другим запросом)
        admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
      }
    }

    if (!admin) {
      logger.warn('Доступ запрещен - пользователь не является администратором', { userId: req.user.userId || req.user.id, userRole: req.user.role });
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Только администраторы могут просматривать свой профиль.'
      });
    }

    logger.info('Профиль администратора успешно получен', { adminId: admin.id, ip: req.ip });

    // Формируем ответ с явным указанием полей, включая first_name и last_name
    const formattedData = {
      id: admin.id,
      user_id: admin.user_id,
      role: admin.role,
      first_name: admin.first_name,
      last_name: admin.last_name,
      permissions: admin.permissions,
      is_active: admin.is_active,
      created_at: admin.created_at
    };

    res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    logger.error('Ошибка получения профиля администратора', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update current admin profile
const updateCurrentAdmin = async (req, res) => {
  logger.info('Обновление профиля текущего администратора', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    // Проверяем, что пользователь является администратором
    let admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
    logger.info('Проверка администратора', { userId: req.user.userId || req.user.id, adminFound: !!admin, userRole: req.user.role });

    // Если у пользователя роль admin, но нет записи в таблице администраторов, создаем её
    if (!admin && req.user.role === 'admin') {
      logger.info('Создание записи администратора для пользователя', { userId: req.user.userId || req.user.id });
      try {
        admin = await Admin.create({
          user_id: req.user.userId || req.user.id,
          role: 'admin',
          is_active: true
        });
        logger.info('Запись администратора успешно создана', { adminId: admin.id, userId: req.user.userId || req.user.id });
      } catch (creationError) {
        logger.error('Ошибка создания записи администратора', { error: creationError.message, userId: req.user.userId || req.user.id });
        // Повторная попытка найти администратора (возможно, запись была создана другим запросом)
        admin = await Admin.findOne({ where: { user_id: req.user.userId || req.user.id, is_active: true } });
      }
    }

    if (!admin) {
      logger.warn('Доступ запрещен - пользователь не является администратором', { userId: req.user.userId || req.user.id, userRole: req.user.role });
      return res.status(403).json({
        success: false,
        message: 'Доступ запрещен. Только администраторы могут обновлять свой профиль.'
      });
    }

    const { first_name, last_name } = req.body;

    // Обновляем администратора
    await admin.update({
      first_name,
      last_name
    });

    logger.info('Профиль администратора успешно обновлен', { adminId: admin.id, ip: req.ip });

    // Формируем ответ с явным указанием полей, включая first_name и last_name
    const formattedData = {
      id: admin.id,
      user_id: admin.user_id,
      role: admin.role,
      first_name: admin.first_name,
      last_name: admin.last_name,
      permissions: admin.permissions,
      is_active: admin.is_active,
      created_at: admin.created_at
    };

    res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    logger.error('Ошибка обновления профиля администратора', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createAdmin,
  getAllAdmins,
  getCurrentAdmin,
  updateCurrentAdmin
};