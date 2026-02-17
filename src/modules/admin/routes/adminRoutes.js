const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { requireAdminRole } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validation');
const { 
  serviceCategoryValidationSchema,
  adminValidationSchema
} = require('../../../validation');

// Защита всех маршрутов админ-панели
router.use(requireAdminRole);

// Маршруты для админ-панели
router.get('/dashboard/stats', getDashboardStats);

// Маршруты для управления администраторами
router.get('/admins', getAllAdmins);
router.post('/admins', validate(adminValidationSchema, 'body'), createAdmin);
router.get('/profile', getCurrentAdmin);
router.put('/profile', validate(adminValidationSchema, 'body'), updateCurrentAdmin);

// Маршруты для управления пользователями
router.get('/users', getAllUsers);

// Маршруты для управления категориями услуг
router.get('/categories', getAllCategories);
router.post('/categories', validate(serviceCategoryValidationSchema, 'body'), createCategory);
router.put('/categories/:id', validate(serviceCategoryValidationSchema, 'body'), updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;