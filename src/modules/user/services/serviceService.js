const MasterService = require('../../catalog/models/MasterService');
const Master = require('../models/Master');
const Salon = require('../models/Salon');
const { Op } = require('sequelize');


const getAllActiveServices = async () => {
  return await MasterService.findAll({
    include: [
      {
        model: Master,
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};


const getServiceById = async (id) => {
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


const createService = async (serviceData) => {

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
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};


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
        as: 'master',
        attributes: ['first_name', 'last_name', 'specialization']
      }
    ]
  });
};


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