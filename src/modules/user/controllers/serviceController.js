const serviceService = require('../services/serviceService');
const { createLogger } = require('../../../utils/logger');


const logger = createLogger('service-controller');


const getAllServices = async (req, res) => {
  logger.info('Получение всех активных услуг', { ip: req.ip });

  try {
    const services = await serviceService.getAllActiveServices();
    logger.info('Услуги успешно получены', { count: services.length, ip: req.ip });

    res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    logger.error('Ошибка получения услуг', { error: error.message, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getServiceById = async (req, res) => {
  logger.info('Получение услуги по ID', { serviceId: req.params.id, ip: req.ip });

  try {
    const { id } = req.params;
    const service = await serviceService.getServiceById(id);

    if (!service) {
      logger.warn('Услуга не найдена', { serviceId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Услуга не найдена'
      });
    }

    logger.info('Услуга успешно получена', { serviceId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    logger.error('Ошибка получения услуги по ID', { error: error.message, serviceId: req.params.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const createService = async (req, res) => {
  logger.info('Создание новой услуги мастера', { userId: req.user.id, ip: req.ip });

  try {
    const serviceData = req.body;
    const masterId = req.user.masterId || req.user.userId || req.user.id;


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

    const service = await serviceService.createService({...serviceData, master_id: masterId});

    logger.info('Услуга мастера успешно создана', { serviceId: service.id, masterId, ip: req.ip });

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    logger.error('Ошибка создания услуги мастера', { error: error.message, userId: req.user.id, ip: req.ip });


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


const updateService = async (req, res) => {
  logger.info('Обновление услуги', { serviceId: req.params.id, userId: req.user.id, ip: req.ip });

  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedService = await serviceService.updateService(id, updateData);

    if (!updatedService) {
      logger.warn('Услуга не найдена для обновления', { serviceId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Услуга не найдена'
      });
    }

    logger.info('Услуга успешно обновлена', { serviceId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      data: updatedService
    });
  } catch (error) {
    logger.error('Ошибка обновления услуги', { error: error.message, serviceId: req.params.id, ip: req.ip });
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


const deleteService = async (req, res) => {
  logger.info('Удаление услуги', { serviceId: req.params.id, userId: req.user.id, ip: req.ip });

  try {
    const { id } = req.params;

    const deleted = await serviceService.deleteService(id);

    if (!deleted) {
      logger.warn('Услуга не найдена для удаления', { serviceId: id, ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Услуга не найдена'
      });
    }

    logger.info('Услуга успешно удалена', { serviceId: id, ip: req.ip });

    res.status(200).json({
      success: true,
      message: 'Услуга успешно удалена'
    });
  } catch (error) {
    logger.error('Ошибка удаления услуги', { error: error.message, serviceId: req.params.id, ip: req.ip });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};