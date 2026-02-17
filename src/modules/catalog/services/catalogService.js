const ServiceCategory = require('../models/ServiceCategory');
const ServiceSubcategory = require('../models/ServiceSubcategory');
const MasterService = require('../models/MasterService');
const Master = require('../../user/models/Master');
const Salon = require('../../user/models/Salon');
const { Op } = require('sequelize');


const getAllCatalogCategories = async ({ category = null, search = null, sortBy = 'name', order = 'ASC', limit = null, offset = 0 }) => {
  const whereClause = { is_active: true };

  if (category) {
    whereClause.name = { [Op.iLike]: `%${category}%` };
  }

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }


  let sortField = sortBy;
  if (sortBy === 'createdAt') {
    sortField = 'created_at';
  } else if (sortBy === 'updatedAt') {
    sortField = 'updated_at';
  }

  const options = {
    where: whereClause,
    order: [[sortField, order]],
    offset: parseInt(offset)
  };

  if (limit) {
    options.limit = parseInt(limit);
  }

  return await ServiceCategory.findAndCountAll(options);
};


const getCatalogCategoryById = async (id) => {
  return await ServiceCategory.findByPk(id);
};


const getPopularCategories = async (limit = 10) => {
  return await ServiceCategory.findAll({
    where: {
      is_active: true,
      is_popular: true
    },
    limit: parseInt(limit),
    order: [['created_at', 'DESC']]
  });
};


const createCatalogCategory = async (categoryData) => {
  const category = await ServiceCategory.create(categoryData);
  return await ServiceCategory.findByPk(category.id);
};


const updateCatalogCategory = async (id, updateData) => {
  const category = await ServiceCategory.findByPk(id);
  if (!category) {
    return null;
  }

  await category.update(updateData);
  return await ServiceCategory.findByPk(id);
};


const deleteCatalogCategory = async (id) => {
  const category = await ServiceCategory.findByPk(id);
  if (!category) {
    return false;
  }

  await category.destroy();
  return true;
};


const getServiceVariationsByCategory = async (categoryId, { masterId = null, salonId = null, is_active = true, limit = 20 }) => {
  const whereClause = {
    is_active: is_active
  };

  if (masterId) {
    whereClause.master_id = masterId;
  }



  return await MasterService.findAll({
    where: whereClause,
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ],
    limit: parseInt(limit)
  });
};


const getServiceVariations = async (serviceId, { masterId = null, salonId = null, is_active = true, limit = 20 }) => {
  const whereClause = {
    id: serviceId,
    is_active: is_active
  };

  if (masterId) {
    whereClause.master_id = masterId;
  }



  return await MasterService.findAll({
    where: whereClause,
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ],
    limit: parseInt(limit)
  });
};


const getAllCatalogServices = async ({ category = null, search = null, masterId = null, salonId = null, sortBy = 'name', order = 'ASC', limit = null, offset = 0 }) => {

  let sortField = sortBy;
  if (sortBy === 'createdAt') {
    sortField = 'created_at';
  } else if (sortBy === 'updatedAt') {
    sortField = 'updated_at';
  }

  const whereClause = { is_active: true };

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (masterId) {
    whereClause.master_id = masterId;
  }



  const options = {
    where: whereClause,
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ],
    order: [[sortField, order]],
    offset: parseInt(offset)
  };

  if (limit) {
    options.limit = parseInt(limit);
  }

  return await MasterService.findAndCountAll(options);
};


const getCatalogServiceById = async (id) => {
  return await MasterService.findByPk(id, {
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};

const createCatalogService = async (serviceData) => {

  const catalogServiceData = {
    ...serviceData,
    master_id: null
  };

  const service = await MasterService.create(catalogServiceData);
  return await MasterService.findByPk(service.id, {
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};


const updateCatalogService = async (id, updateData) => {
  const service = await MasterService.findByPk(id);
  if (!service) {
    return null;
  }

  await service.update(updateData);
  return await MasterService.findByPk(id, {
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};


const deleteCatalogService = async (id) => {
  const service = await MasterService.findByPk(id);
  if (!service) {
    return false;
  }

  await service.destroy();
  return true;
};


const createMasterService = async (masterId, serviceData) => {

  const master = await Master.findByPk(masterId);
  if (!master) {
    throw new Error('Master not found');
  }


  const serviceWithMaster = {
    ...serviceData,
    master_id: masterId
  };

  const service = await MasterService.create(serviceWithMaster);
  return await MasterService.findByPk(service.id, {
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};





const createSalonService = async (salonId, serviceData) => {

  const salon = await Salon.findByPk(salonId);
  if (!salon) {
    throw new Error('Salon not found');
  }




  throw new Error('Salon services are not supported with the current MasterService model. A separate model for salon services would be needed.');
};


const getMasterServices = async (masterId, { category = null, search = null, is_active = true, limit = 20, offset = 0 }) => {

  const master = await Master.findByPk(masterId);
  if (!master) {
    throw new Error('Master not found');
  }

  const whereClause = {
    master_id: masterId,
    is_active: is_active
  };


  if (category) {
    const catalogCategory = await ServiceCategory.findOne({ where: { name: { [Op.iLike]: `%${category}%` } } });
    if (catalogCategory) {
      whereClause.category_id = catalogCategory.id;
    }
  }


  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const options = {
    where: whereClause,
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ],
    offset: parseInt(offset)
  };

  if (limit) {
    options.limit = parseInt(limit);
  }

  return await MasterService.findAndCountAll(options);
};


const getSalonServices = async (salonId, { category = null, search = null, is_active = true, limit = 20, offset = 0 }) => {

  const salon = await Salon.findByPk(salonId);
  if (!salon) {
    throw new Error('Salon not found');
  }

  const whereClause = {
    salon_id: salonId,
    is_active: is_active
  };

  if (category) {
    const catalogCategory = await ServiceCategory.findOne({ where: { name: { [Op.iLike]: `%${category}%` } } });
    if (catalogCategory) {
      whereClause.category_id = catalogCategory.id;
    }
  }

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const options = {
    where: whereClause,
    include: [
      {
        model: ServiceTemplate,
        as: 'catalog',
        attributes: ['name', 'category', 'subcategory']
      },
      {
        model: Master,
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      },
      {
        model: Salon,
        as: 'salon',
        attributes: ['name']
      }
    ],
    offset: parseInt(offset)
  };

  if (limit) {
    options.limit = parseInt(limit);
  }

  return await ServiceVariation.findAndCountAll(options);
};


const updateMasterService = async (masterId, serviceId, updateData) => {
  const service = await MasterService.findOne({
    where: {
      id: serviceId,
      master_id: masterId
    }
  });

  if (!service) {
    return null;
  }

  await service.update(updateData);
  return await MasterService.findByPk(serviceId, {
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};


const updateSalonService = async (salonId, serviceId, updateData) => {
  const service = await ServiceVariation.findOne({
    where: {
      id: serviceId,
      salon_id: salonId
    }
  });

  if (!service) {
    return null;
  }


  if (updateData.catalog_id) {
    const catalogCategory = await ServiceTemplate.findByPk(updateData.catalog_id);
    if (!catalogCategory) {
      throw new Error('Catalog category not found');
    }
  }


  if (updateData.time_slot_start && updateData.time_slot_end) {
    const start = new Date(`1970-01-01T${updateData.time_slot_start}`);
    const end = new Date(`1970-01-01T${updateData.time_slot_end}`);
    
    if (start >= end) {
      throw new Error('Время окончания должно быть позже времени начала');
    }
    

    const durationMs = end - start;
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    updateData.duration_minutes = durationMinutes;
  }

  await service.update(updateData);
  return await ServiceVariation.findByPk(serviceId, {
    include: [
      {
        model: ServiceTemplate,
        as: 'catalog',
        attributes: ['name', 'category', 'subcategory']
      },
      {
        model: Master,
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      },
      {
        model: Salon,
        as: 'salon',
        attributes: ['name']
      }
    ]
  });
};


const deleteMasterService = async (masterId, serviceId) => {
  const service = await MasterService.findOne({
    where: {
      id: serviceId,
      master_id: masterId
    }
  });

  if (!service) {
    return false;
  }

  await service.destroy();
  return true;
};


const deleteSalonService = async (salonId, serviceId) => {
  const service = await ServiceVariation.findOne({
    where: {
      id: serviceId,
      salon_id: salonId
    }
  });

  if (!service) {
    return false;
  }

  await service.destroy();
  return true;
};

module.exports = {
  getAllCatalogCategories,
  getCatalogCategoryById,
  getPopularCategories,
  createCatalogCategory,
  updateCatalogCategory,
  deleteCatalogCategory,
  getServiceVariationsByCategory,
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
  deleteSalonService
};