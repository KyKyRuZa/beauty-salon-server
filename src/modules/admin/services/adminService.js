const { Op } = require('sequelize');
const Admin = require('../models/Admin');
const User = require('../../user/models/User');
const Master = require('../../user/models/Master');
const Salon = require('../../user/models/Salon');
const Client = require('../../user/models/Client');
const ServiceCategory = require('../../catalog/models/ServiceCategory');
const ServiceSubcategory = require('../../catalog/models/ServiceSubcategory');
const MasterService = require('../../catalog/models/MasterService');
const Booking = require('../../booking/models/Booking');

const getDashboardStats = async () => {
  const stats = {
    totalUsers: await User.count(),
    totalClients: await Client.count(),
    totalMasters: await Master.count(),
    totalSalons: await Salon.count(),
    totalCategories: await ServiceCategory.count(),
    totalSubcategories: await ServiceSubcategory.count(),
    totalServices: await MasterService.count(),
    totalBookings: await Booking.count(),
    todayBookings: await Booking.count({
      where: {
        created_at: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  };

  return stats;
};


const getAllUsers = async ({ page = 1, limit = 10, search, role } = {}) => {
  const offset = (page - 1) * limit;

  const whereClause = {};
  if (search) {
    whereClause[Op.or] = [
      { email: { [Op.iLike]: `%${search}%` } },
      { first_name: { [Op.iLike]: `%${search}%` } },
      { last_name: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (role) {
    whereClause.role = role;
  }

  const result = await User.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });

  return result;
};


const getAllAdmins = async ({ page = 1, limit = 10, search } = {}) => {
  const offset = (page - 1) * limit;

  const whereClause = { is_active: true };
  if (search) {
    whereClause[Op.or] = [
      { '$user.email$': { [Op.iLike]: `%${search}%` } },
      { '$user.first_name$': { [Op.iLike]: `%${search}%` } },
      { '$user.last_name$': { [Op.iLike]: `%${search}%` } }
    ];
  }

  const result = await Admin.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']],
    attributes: ['id', 'user_id', 'role', 'first_name', 'last_name', 'is_active', 'created_at']
  });
  

  const userIds = result.rows.map(admin => admin.user_id);
  if (userIds.length > 0) {
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ['id', 'email', 'role']
    });
    

    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = user;
    });
    

    result.rows.forEach(admin => {
      admin.user = userMap[admin.user_id];
    });
  }
  
  return result;
};


const createAdmin = async (adminData) => {
  const { user_id, role = 'admin', permissions, first_name, last_name } = adminData;


  const user = await User.findByPk(user_id);
  if (!user) {
    throw new Error('Пользователь не найден');
  }


  const existingAdmin = await Admin.findOne({ where: { user_id, is_active: true } });
  if (existingAdmin) {
    throw new Error('Пользователь уже является администратором');
  }

  const newAdmin = await Admin.create({
    user_id,
    role,
    permissions: permissions || {},
    first_name,
    last_name,
    is_active: true
  });

  return newAdmin;
};


const getAllCategories = async ({ page = 1, limit = 10, search } = {}) => {
  const offset = (page - 1) * limit;

  const whereClause = {};
  if (search) {
    whereClause.name = { [Op.iLike]: `%${search}%` };
  }

  const result = await ServiceCategory.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });

  return result;
};


const createCategory = async (categoryData) => {
  if (!categoryData.name) {
    throw new Error('Необходимо указать название категории');
  }

  const category = await ServiceCategory.create(categoryData);
  return category;
};


const updateCategory = async (id, updateData) => {
  const category = await ServiceCategory.findByPk(id);
  if (!category) {
    throw new Error('Категория услуги не найдена');
  }

  await category.update(updateData);
  return category;
};


const deleteCategory = async (id) => {
  const category = await ServiceCategory.findByPk(id);
  if (!category) {
    throw new Error('Категория услуги не найдена');
  }

  await category.destroy();
  return true;
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllAdmins,
  createAdmin,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};