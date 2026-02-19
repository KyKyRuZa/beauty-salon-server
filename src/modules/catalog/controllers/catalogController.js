const catalogService = require('../services/catalogService');
const ServiceCategory = require('../models/ServiceCategory');
const ServiceSubcategory = require('../models/ServiceSubcategory');
const MasterService = require('../models/MasterService');
const { createLogger } = require('../../../utils/logger');


const logger = createLogger('catalog-controller');


const getAllCatalogCategories = async (req, res) => {
  logger.info('Получение категорий услуг из каталога', { ip: req.ip, params: req.query });

  try {
    const { category, search, sortBy = 'name', order = 'ASC', limit, offset = 0 } = req.query;
    
    const result = await catalogService.getAllCatalogCategories({ 
      category, 
      search, 
      sortBy, 
      order, 
      limit, 
      offset 
    });
    
    logger.info('Категории услуг из каталога успешно получены', { count: result.rows.length, total: result.count, ip: req.ip });

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total: result.count,
        limit: limit ? parseInt(limit) : null,
        offset: parseInt(offset),
        pages: limit ? Math.ceil(result.count / limit) : 1
      }
    });
  } catch (error) {
    logger.error('Ошибка получения категорий услуг из каталога', { error: error.message, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getCatalogCategoryById = async (req, res) => {
  logger.info('Получение категории услуги из каталога по ID', { categoryId: req.params.id, ip: req.ip });

  try {
    const { id } = req.params;
    const category = await catalogService.getCatalogCategoryById(id);

    if (!category) {
      logger.warn('Категория услуги из каталога не найдена', { categoryId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Категория услуги не найдена'
      });
    }

    logger.info('Категория услуги из каталога успешно получена', { categoryId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Ошибка получения категории услуги из каталога по ID', { error: error.message, categoryId: req.params.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getPopularCategories = async (req, res) => {
  logger.info('Получение популярных категорий услуг', { ip: req.ip });

  try {
    const { limit = 10 } = req.query;
    const categories = await catalogService.getPopularCategories(limit);

    logger.info('Популярные категории услуг успешно получены', { count: categories.length, ip: req.ip });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Ошибка получения популярных категорий услуг', { error: error.message, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const createCatalogCategory = async (req, res) => {
  logger.info('Создание новой категории услуги в каталоге', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    const categoryData = req.body;


    if (!categoryData.name) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать название категории услуги'
      });
    }


    if (categoryData.name.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Название категории услуги должно содержать не менее 2 символов'
      });
    }

    const category = await catalogService.createCatalogCategory(categoryData);

    logger.info('Категория услуги в каталоге успешно создана', { categoryId: category.id, ip: req.ip });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Ошибка создания категории услуги в каталоге', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });


    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации данных: ' + error.message
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const updateCatalogCategory = async (req, res) => {
  logger.info('Обновление категории услуги в каталоге', { categoryId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedCategory = await catalogService.updateCatalogCategory(id, updateData);

    if (!updatedCategory) {
      logger.warn('Категория услуги в каталоге не найдена для обновления', { categoryId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Категория услуги не найдена'
      });
    }

    logger.info('Категория услуги в каталоге успешно обновлена', { categoryId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    logger.error('Ошибка обновления категории услуги в каталоге', { error: error.message, categoryId: req.params.id, ip: req.ip });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const deleteCatalogCategory = async (req, res) => {
  logger.info('Удаление категории услуги из каталога', { categoryId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    const { id } = req.params;

    const deleted = await catalogService.deleteCatalogCategory(id);

    if (!deleted) {
      logger.warn('Категория услуги в каталоге не найдена для удаления', { categoryId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Категория услуги не найдена'
      });
    }

    logger.info('Категория услуги в каталоге успешно удалена', { categoryId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      message: 'Категория услуги успешно удалена'
    });
  } catch (error) {
    logger.error('Ошибка удаления категории услуги из каталога', { error: error.message, categoryId: req.params.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getServicesByCategory = async (req, res) => {
  logger.info('Получение услуг по категории каталога', { categoryId: req.params.categoryId, ip: req.ip });

  try {
    const { categoryId } = req.params;
    const { masterId, salonId, isActive = true, limit = 20 } = req.query;

    const services = await catalogService.getServiceVariationsByCategory(categoryId, {
      masterId: masterId ? parseInt(masterId) : null,
      salonId: salonId ? parseInt(salonId) : null,
      is_active: isActive === 'false' ? false : true,
      limit
    });

    logger.info('Услуги по категории каталога успешно получены', { count: services.length, categoryId, ip: req.ip });

    res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    logger.error('Ошибка получения услуг по категории каталога', { error: error.message, categoryId: req.params.categoryId, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getServiceVariations = async (req, res) => {
  logger.info('Получение вариантов услуги', { serviceId: req.params.serviceId, ip: req.ip });

  try {
    const { serviceId } = req.params;
    const { masterId, salonId, isActive = true, limit = 20 } = req.query;
    
    const variations = await catalogService.getServiceVariations(serviceId, {
      masterId: masterId ? parseInt(masterId) : null,
      salonId: salonId ? parseInt(salonId) : null,
      is_active: isActive === 'false' ? false : true,
      limit
    });

    logger.info('Варианты услуги успешно получены', { count: variations.length, serviceId, ip: req.ip });

    res.status(200).json({
      success: true,
      data: variations
    });
  } catch (error) {
    logger.error('Ошибка получения вариантов услуги', { error: error.message, serviceId: req.params.serviceId, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getAllCatalogServices = async (req, res) => {
  logger.info('Получение услуг из каталога', { ip: req.ip, params: req.query });

  try {
    const { category, search, masterId, salonId, sortBy = 'name', order = 'ASC', limit, offset = 0 } = req.query;
    
    const result = await catalogService.getAllCatalogServices({ 
      category, 
      search, 
      masterId: masterId ? parseInt(masterId) : null,
      salonId: salonId ? parseInt(salonId) : null,
      sortBy, 
      order, 
      limit, 
      offset 
    });
    
    logger.info('Услуги из каталога успешно получены', { count: result.rows.length, total: result.count, ip: req.ip });

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total: result.count,
        limit: limit ? parseInt(limit) : null,
        offset: parseInt(offset),
        pages: limit ? Math.ceil(result.count / limit) : 1
      }
    });
  } catch (error) {
    logger.error('Ошибка получения услуг из каталога', { error: error.message, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getCatalogServiceById = async (req, res) => {
  logger.info('Получение услуги из каталога по ID', { serviceId: req.params.id, ip: req.ip });

  try {
    const { id } = req.params;
    const service = await catalogService.getCatalogServiceById(id);

    if (!service) {
      logger.warn('Услуга из каталога не найдена', { serviceId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Услуга не найдена'
      });
    }

    logger.info('Услуга из каталога успешно получена', { serviceId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    logger.error('Ошибка получения услуги из каталога по ID', { error: error.message, serviceId: req.params.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const createCatalogService = async (req, res) => {
  logger.info('Создание новой услуги в каталоге', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    const serviceData = req.body;


    if (!serviceData.name || !serviceData.price) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать название и цену услуги'
      });
    }


    if (serviceData.name.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Название услуги должно содержать не менее 2 символов'
      });
    }


    if (parseFloat(serviceData.price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Цена должна быть положительной'
      });
    }

    const service = await catalogService.createCatalogService(serviceData);

    logger.info('Услуга в каталоге успешно создана', { serviceId: service.id, ip: req.ip });

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    logger.error('Ошибка создания услуги в каталоге', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });


    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации данных: ' + error.message
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const updateCatalogService = async (req, res) => {
  logger.info('Обновление услуги в каталоге', { serviceId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedService = await catalogService.updateCatalogService(id, updateData);

    if (!updatedService) {
      logger.warn('Услуга в каталоге не найдена для обновления', { serviceId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Услуга не найдена'
      });
    }

    logger.info('Услуга в каталоге успешно обновлена', { serviceId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      data: updatedService
    });
  } catch (error) {
    logger.error('Ошибка обновления услуги в каталоге', { error: error.message, serviceId: req.params.id, ip: req.ip });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const deleteCatalogService = async (req, res) => {
  logger.info('Удаление услуги из каталога', { serviceId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {
    const { id } = req.params;

    const deleted = await catalogService.deleteCatalogService(id);

    if (!deleted) {
      logger.warn('Услуга в каталоге не найдена для удаления', { serviceId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Услуга не найдена'
      });
    }

    logger.info('Услуга в каталоге успешно удалена', { serviceId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      message: 'Услуга успешно удалена'
    });
  } catch (error) {
    logger.error('Ошибка удаления услуги из каталога', { error: error.message, serviceId: req.params.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const createMasterService = async (req, res) => {
  logger.info('Создание услуги для мастера', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const Master = require('../../user/models/Master');
    const masterRecord = await Master.findOne({ where: { user_id: userId } });

    if (!masterRecord) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не является мастером'
      });
    }

    const masterId = masterRecord.id;
    const serviceData = req.body;


    if (!serviceData.name || !serviceData.price) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать название услуги и цену'
      });
    }


    if (parseFloat(serviceData.price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Цена должна быть положительной'
      });
    }


    if (serviceData.duration_minutes && parseInt(serviceData.duration_minutes) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Продолжительность должна быть положительной'
      });
    }

    const service = await catalogService.createMasterService(masterId, serviceData);

    logger.info('Услуга для мастера успешно создана', { serviceId: service.id, masterId, ip: req.ip });

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    logger.error('Ошибка создания услуги для мастера', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });


    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации данных: ' + error.message
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const createSalonService = async (req, res) => {
  logger.info('Создание услуги для салона', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const Salon = require('../../user/models/Salon');
    const salonRecord = await Salon.findOne({ where: { user_id: userId } });

    if (!salonRecord) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не является салоном'
      });
    }
    
    const salonId = salonRecord.id;
    const serviceData = req.body;


    if (!serviceData.name || !serviceData.price || !serviceData.duration || !serviceData.catalog_id) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать название, цену, продолжительность и ID категории услуги'
      });
    }


    if (serviceData.name.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Название услуги должно содержать не менее 2 символов'
      });
    }


    if (parseFloat(serviceData.price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Цена должна быть положительной'
      });
    }


    if (parseInt(serviceData.duration) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Продолжительность должна быть положительной'
      });
    }

    const service = await catalogService.createSalonService(salonId, serviceData);

    logger.info('Услуга для салона успешно создана', { serviceId: service.id, salonId, ip: req.ip });

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    logger.error('Ошибка создания услуги для салона', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });


    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации данных: ' + error.message
      });
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const getMasterServices = async (req, res) => {
  logger.info('Получение услуг мастера', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const Master = require('../../user/models/Master');
    const masterRecord = await Master.findOne({ where: { user_id: userId } });

    if (!masterRecord) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не является мастером'
      });
    }

    const masterId = masterRecord.id;
    const { category, search, isActive = true, limit, offset = 0 } = req.query;

    const result = await catalogService.getMasterServices(masterId, {
      category,
      search,
      is_active: isActive === 'false' ? false : true,
      limit: limit || 20,
      offset
    });

    logger.info('Услуги мастера успешно получены', { count: result.rows.length, total: result.count, masterId, ip: req.ip });

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total: result.count,
        limit: limit ? parseInt(limit) : null,
        offset: parseInt(offset),
        pages: limit ? Math.ceil(result.count / limit) : 1
      }
    });
  } catch (error) {
    logger.error('Ошибка получения услуг мастера', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getSalonServices = async (req, res) => {
  logger.info('Получение услуг салона', { userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const Salon = require('../../user/models/Salon');
    const salonRecord = await Salon.findOne({ where: { user_id: userId } });

    if (!salonRecord) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не является салоном'
      });
    }
    
    const salonId = salonRecord.id;
    const { category, search, isActive = true, limit, offset = 0 } = req.query;

    const result = await catalogService.getSalonServices(salonId, {
      category,
      search,
      is_active: isActive === 'false' ? false : true,
      limit: limit || 20,
      offset
    });

    logger.info('Услуги салона успешно получены', { count: result.rows.length, total: result.count, salonId, ip: req.ip });

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total: result.count,
        limit: limit ? parseInt(limit) : null,
        offset: parseInt(offset),
        pages: limit ? Math.ceil(result.count / limit) : 1
      }
    });
  } catch (error) {
    logger.error('Ошибка получения услуг салона', { error: error.message, userId: req.user?.userId || req.user?.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const updateMasterService = async (req, res) => {
  logger.info('Обновление услуги мастера', { serviceId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const Master = require('../../user/models/Master');
    const masterRecord = await Master.findOne({ where: { user_id: userId } });

    if (!masterRecord) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не является мастером'
      });
    }
    
    const masterId = masterRecord.id;
    const { id } = req.params;
    const updateData = req.body;

    const updatedService = await catalogService.updateMasterService(masterId, id, updateData);

    if (!updatedService) {
      logger.warn('Услуга мастера не найдена для обновления', { serviceId: id, masterId, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Услуга не найдена или не принадлежит этому мастеру'
      });
    }

    logger.info('Услуга мастера успешно обновлена', { serviceId: id, masterId, ip: req.ip });

    res.status(200).json({
      success: true,
      data: updatedService
    });
  } catch (error) {
    logger.error('Ошибка обновления услуги мастера', { error: error.message, serviceId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const updateSalonService = async (req, res) => {
  logger.info('Обновление услуги салона', { serviceId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const Salon = require('../../user/models/Salon');
    const salonRecord = await Salon.findOne({ where: { user_id: userId } });

    if (!salonRecord) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не является салоном'
      });
    }
    
    const salonId = salonRecord.id;
    const { id } = req.params;
    const updateData = req.body;

    const updatedService = await catalogService.updateSalonService(salonId, id, updateData);

    if (!updatedService) {
      logger.warn('Услуга салона не найдена для обновления', { serviceId: id, salonId, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Услуга не найдена или не принадлежит этому салону'
      });
    }

    logger.info('Услуга салона успешно обновлена', { serviceId: id, salonId, ip: req.ip });

    res.status(200).json({
      success: true,
      data: updatedService
    });
  } catch (error) {
    logger.error('Ошибка обновления услуги салона', { error: error.message, serviceId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const deleteMasterService = async (req, res) => {
  logger.info('Удаление услуги мастера', { serviceId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const Master = require('../../user/models/Master');
    const masterRecord = await Master.findOne({ where: { user_id: userId } });

    if (!masterRecord) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не является мастером'
      });
    }
    
    const masterId = masterRecord.id;
    const { id } = req.params;

    const deleted = await catalogService.deleteMasterService(masterId, id);

    if (!deleted) {
      logger.warn('Услуга мастера не найдена для удаления', { serviceId: id, masterId, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Услуга не найдена или не принадлежит этому мастеру'
      });
    }

    logger.info('Услуга мастера успешно удалена', { serviceId: id, masterId, ip: req.ip });

    res.status(200).json({
      success: true,
      message: 'Услуга успешно удалена'
    });
  } catch (error) {
    logger.error('Ошибка удаления услуги мастера', { error: error.message, serviceId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const deleteSalonService = async (req, res) => {
  logger.info('Удаление услуги салона', { serviceId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });

  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }


    const Salon = require('../../user/models/Salon');
    const salonRecord = await Salon.findOne({ where: { user_id: userId } });

    if (!salonRecord) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь не является салоном'
      });
    }
    
    const salonId = salonRecord.id;
    const { id } = req.params;

    const deleted = await catalogService.deleteSalonService(salonId, id);

    if (!deleted) {
      logger.warn('Услуга салона не найдена для удаления', { serviceId: id, salonId, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Услуга не найдена или не принадлежит этому салону'
      });
    }

    logger.info('Услуга салона успешно удалена', { serviceId: id, salonId, ip: req.ip });

    res.status(200).json({
      success: true,
      message: 'Услуга успешно удалена'
    });
  } catch (error) {
    logger.error('Ошибка удаления услуги салона', { error: error.message, serviceId: req.params.id, userId: req.user?.userId || req.user?.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Поиск категорий с использованием триграмм (GIN-индекс)
 */
const searchCategories = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: [],
        message: 'Поисковый запрос должен содержать не менее 2 символов'
      });
    }

    logger.info('Поиск категорий с использованием триграмм', { query: q, ip: req.ip });

    const results = await catalogService.searchCategories(q);

    logger.info('Результаты поиска категорий', { count: results.length, query: q });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Ошибка поиска категорий', { error: error.message, query: req.query.q });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Поиск услуг мастеров с использованием триграмм (GIN-индекс)
 */
const searchMasterServices = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: [],
        message: 'Поисковый запрос должен содержать не менее 2 символов'
      });
    }

    logger.info('Поиск услуг мастеров с использованием триграмм', { query: q, ip: req.ip });

    const results = await catalogService.searchMasterServices(q);

    logger.info('Результаты поиска услуг мастеров', { count: results.length, query: q });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Ошибка поиска услуг мастеров', { error: error.message, query: req.query.q });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Поиск мастеров с использованием триграмм (GIN-индекс)
 */
const searchMasters = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: [],
        message: 'Поисковый запрос должен содержать не менее 2 символов'
      });
    }

    logger.info('Поиск мастеров с использованием триграмм', { query: q, ip: req.ip });

    const results = await catalogService.searchMasters(q);

    logger.info('Результаты поиска мастеров', { count: results.length, query: q });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Ошибка поиска мастеров', { error: error.message, query: req.query.q });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllCatalogCategories,
  getCatalogCategoryById,
  getPopularCategories,
  createCatalogCategory,
  updateCatalogCategory,
  deleteCatalogCategory,
  getServicesByCategory,
  getServiceVariations,
  getAllCatalogServices,
  getCatalogServiceById,
  createCatalogService,
  updateCatalogService,
  deleteCatalogService,
  createMasterService,
  createSalonService,
  getMasterServices,
  getSalonServices,
  updateMasterService,
  updateSalonService,
  deleteMasterService,
  deleteSalonService,
  searchCategories,
  searchMasterServices,
  searchMasters
};