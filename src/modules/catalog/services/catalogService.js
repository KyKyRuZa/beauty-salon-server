const ServiceCategory = require('../models/ServiceCategory');
const ServiceSubcategory = require('../models/ServiceSubcategory');
const MasterService = require('../models/MasterService');
const Master = require('../../user/models/Master');
const Salon = require('../../user/models/Salon');
const { Op } = require('sequelize');

// Get all active service categories from catalog
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

  // Map the attribute names to match the database field names
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

// Get service category by ID from catalog
const getCatalogCategoryById = async (id) => {
  return await ServiceCategory.findByPk(id);
};

// Get popular service categories
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

// Create a new service category in catalog
const createCatalogCategory = async (categoryData) => {
  const category = await ServiceCategory.create(categoryData);
  return await ServiceCategory.findByPk(category.id);
};

// Update service category in catalog
const updateCatalogCategory = async (id, updateData) => {
  const category = await ServiceCategory.findByPk(id);
  if (!category) {
    return null;
  }

  await category.update(updateData);
  return await ServiceCategory.findByPk(id);
};

// Delete service category from catalog
const deleteCatalogCategory = async (id) => {
  const category = await ServiceCategory.findByPk(id);
  if (!category) {
    return false;
  }

  await category.destroy();
  return true;
};

// Get master services by catalog category
const getServiceVariationsByCategory = async (categoryId, { masterId = null, salonId = null, is_active = true, limit = 20 }) => {
  const whereClause = {
    is_active: is_active
  };

  if (masterId) {
    whereClause.master_id = masterId;
  }

  // Note: salonId is not applicable for MasterService, as it's specifically for masters

  return await MasterService.findAll({
    where: whereClause,
    include: [
      {
        model: Master,
        as: 'master',  // <-- добавляем алиас
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ],
    limit: parseInt(limit)
  });
};

// Get service variations by service
const getServiceVariations = async (serviceId, { masterId = null, salonId = null, is_active = true, limit = 20 }) => {
  const whereClause = {
    id: serviceId,
    is_active: is_active
  };

  if (masterId) {
    whereClause.master_id = masterId;
  }

  // Note: salonId is not applicable for MasterService, as it's specifically for masters

  return await MasterService.findAll({
    where: whereClause,
    include: [
      {
        model: Master,
        as: 'master',  // <-- добавляем алиас
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ],
    limit: parseInt(limit)
  });
};

// Get all services in catalog with detailed information
const getAllCatalogServices = async ({ category = null, search = null, masterId = null, salonId = null, sortBy = 'name', order = 'ASC', limit = null, offset = 0 }) => {
  // Map the attribute names to match the database field names
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

  // Note: salonId is not applicable for MasterService, as it's specifically for masters

  const options = {
    where: whereClause,
    include: [
      {
        model: Master,
        as: 'master',  // <-- добавляем алиас
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

// Get service variation by ID from catalog
const getCatalogServiceById = async (id) => {
  return await MasterService.findByPk(id, {
    include: [
      {
        model: Master,
        as: 'master',  // <-- добавляем алиас
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};

const createCatalogService = async (serviceData) => {
  // Create a catalog service with master_id = null (representing a base catalog service)
  const catalogServiceData = {
    ...serviceData,
    master_id: null  // null indicates this is a base catalog service, not tied to a specific master
  };

  const service = await MasterService.create(catalogServiceData);
  return await MasterService.findByPk(service.id, {
    include: [
      {
        model: Master,
        as: 'master',  // <-- добавляем алиас
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};

// Update service variation in catalog
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
        as: 'master',  // <-- добавляем алиас
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};

// Delete service variation from catalog
const deleteCatalogService = async (id) => {
  const service = await MasterService.findByPk(id);
  if (!service) {
    return false;
  }

  await service.destroy();
  return true;
};

// Create a master service for a specific master
const createMasterService = async (masterId, serviceData) => {
  // Verify that the master exists
  const master = await Master.findByPk(masterId);
  if (!master) {
    throw new Error('Master not found');
  }

  // Add master_id to the service data
  const serviceWithMaster = {
    ...serviceData,
    master_id: masterId
  };

  const service = await MasterService.create(serviceWithMaster);
  return await MasterService.findByPk(service.id, {
    include: [
      {
        model: Master,
        as: 'master',  // <-- добавляем алиас
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};

// Create a service for a specific salon
// Note: Since MasterService model is specifically for master-service relationships,
// we would typically handle salon services differently or extend the model.
// For now, we'll keep the function but note that it doesn't fit the MasterService model well.
const createSalonService = async (salonId, serviceData) => {
  // Verify that the salon exists
  const salon = await Salon.findByPk(salonId);
  if (!salon) {
    throw new Error('Salon not found');
  }

  // For salon services, we would need a separate model similar to MasterService
  // Since we're using MasterService model which is specific to masters,
  // we'll throw an error indicating this limitation
  throw new Error('Salon services are not supported with the current MasterService model. A separate model for salon services would be needed.');
};

// Get service variations created by a specific master
const getMasterServices = async (masterId, { category = null, search = null, is_active = true, limit = 20, offset = 0 }) => {
  // Verify that the master exists
  const master = await Master.findByPk(masterId);
  if (!master) {
    throw new Error('Master not found');
  }

  const whereClause = {
    master_id: masterId,
    is_active: is_active
  };

  // Add category filtering
  if (category) {
    const catalogCategory = await ServiceCategory.findOne({ where: { name: { [Op.iLike]: `%${category}%` } } });
    if (catalogCategory) {
      whereClause.category_id = catalogCategory.id;
    }
  }

  // Add search functionality for name and description
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
        as: 'master',  // <-- добавляем алиас
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

// Get service variations created by a specific salon
const getSalonServices = async (salonId, { category = null, search = null, is_active = true, limit = 20, offset = 0 }) => {
  // Verify that the salon exists
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
        as: 'catalog',  // <-- добавляем алиас
        attributes: ['name', 'category', 'subcategory']
      },
      {
        model: Master,
        as: 'master',  // <-- добавляем алиас
        attributes: ['first_name', 'last_name', 'specialization']
      },
      {
        model: Salon,
        as: 'salon',  // <-- добавляем алиас
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

// Update a service variation owned by a specific master
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
        as: 'master',  // <-- добавляем алиас
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};

// Update a service variation owned by a specific salon
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

  // If catalog_id is provided, verify that the catalog category exists
  if (updateData.catalog_id) {
    const catalogCategory = await ServiceTemplate.findByPk(updateData.catalog_id);
    if (!catalogCategory) {
      throw new Error('Catalog category not found');
    }
  }

  // Validate time slot
  if (updateData.time_slot_start && updateData.time_slot_end) {
    const start = new Date(`1970-01-01T${updateData.time_slot_start}`);
    const end = new Date(`1970-01-01T${updateData.time_slot_end}`);
    
    if (start >= end) {
      throw new Error('Время окончания должно быть позже времени начала');
    }
    
    // Calculate duration in minutes
    const durationMs = end - start;
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    updateData.duration_minutes = durationMinutes;
  }

  await service.update(updateData);
  return await ServiceVariation.findByPk(serviceId, {
    include: [
      {
        model: ServiceTemplate,
        as: 'catalog',  // <-- добавляем алиас
        attributes: ['name', 'category', 'subcategory']
      },
      {
        model: Master,
        as: 'master',  // <-- добавляем алиас
        attributes: ['first_name', 'last_name', 'specialization']
      },
      {
        model: Salon,
        as: 'salon',  // <-- добавляем алиас
        attributes: ['name']
      }
    ]
  });
};

// Delete a service variation owned by a specific master
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

// Delete a service variation owned by a specific salon
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
  getServiceVariationsByCategory,  // Исправлено: было getServicesByCategory
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