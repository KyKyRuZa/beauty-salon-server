const MasterService = require('../../catalog/models/MasterService'); // Updated to use MasterService instead of ServiceVariation
const Master = require('../models/Master');
const Salon = require('../models/Salon');
const { Op } = require('sequelize');

// Get all active master services with master info
const getAllActiveServices = async () => {
  return await MasterService.findAll({
    include: [
      {
        model: Master,
        as: 'master', // Using alias defined in associations
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};

// Get master service by ID
const getServiceById = async (id) => {
  return await MasterService.findByPk(id, {
    include: [
      {
        model: Master,
        as: 'master', // Using alias defined in associations
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};

// Create a new master service
const createService = async (serviceData) => {
  // Verify that the master exists
  if (serviceData.master_id) {
    const master = await Master.findByPk(serviceData.master_id);
    if (!master) {
      throw new Error('Master not found');
    }
  }

  const service = await MasterService.create(serviceData);
  return await MasterService.findByPk(service.id, {
    include: [
      {
        model: Master,
        as: 'master', // Using alias defined in associations
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};

// Update master service
const updateService = async (id, updateData) => {
  const service = await MasterService.findByPk(id);
  if (!service) {
    return null;
  }

  await service.update(updateData);
  return await MasterService.findByPk(id, {
    include: [
      {
        model: Master,
        as: 'master', // Using alias defined in associations
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};

// Delete master service
const deleteService = async (id) => {
  const service = await MasterService.findByPk(id);
  if (!service) {
    return false;
  }

  await service.destroy();
  return true;
};

module.exports = {
  getAllActiveServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};