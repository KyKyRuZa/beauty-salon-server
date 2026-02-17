const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');
const { authenticateToken } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validation');
const {
  serviceCategoryValidationSchema,
  serviceSubcategoryValidationSchema,
  serviceTemplateValidationSchema,
  masterServiceValidationSchema,
  updateMasterServiceValidationSchema
} = require('../../../validation');

// Public routes for catalog (no authentication required for viewing)
router.get('/', catalogController.getAllCatalogServices); // Получить все услуги
router.get('/categories', catalogController.getAllCatalogCategories); // Получить все категории услуг
router.get('/categories/popular', catalogController.getPopularCategories); // Получить популярные категории
router.get('/categories/:id', catalogController.getCatalogCategoryById); // Получить категорию по ID
router.get('/by-category/:categoryId', catalogController.getServicesByCategory); // Получить услуги по категории
router.get('/variations/:serviceId', catalogController.getServiceVariations); // Получить варианты услуги
router.get('/:id', catalogController.getCatalogServiceById); // Получить услугу по ID

// Protected routes (require authentication for managing catalog)
router.use(authenticateToken);

// Admin/Manager only routes for managing the catalog
router.post('/categories', validate(serviceCategoryValidationSchema, 'body'), catalogController.createCatalogCategory); // Создать категорию
router.put('/categories/:id', validate(serviceCategoryValidationSchema, 'body'), catalogController.updateCatalogCategory); // Обновить категорию
router.delete('/categories/:id', catalogController.deleteCatalogCategory); // Удалить категорию
router.post('/', validate(serviceTemplateValidationSchema, 'body'), catalogController.createCatalogService); // Создать услугу
router.put('/:id', validate(serviceTemplateValidationSchema, 'body'), catalogController.updateCatalogService); // Обновить услугу
router.delete('/:id', catalogController.deleteCatalogService); // Удалить услугу

// Routes for masters to manage their own services
router.post('/master/service', validate(masterServiceValidationSchema, 'body'), catalogController.createMasterService); // Создать услугу для мастера
router.get('/master/services', catalogController.getMasterServices); // Получить услуги мастера
router.put('/master/service/:id', validate(updateMasterServiceValidationSchema, 'body'), catalogController.updateMasterService); // Обновить услугу мастера
router.delete('/master/service/:id', catalogController.deleteMasterService); // Удалить услугу мастера

// Routes for salons to manage their own services
// Note: Currently using masterServiceValidationSchema as salon services likely use similar structure
router.post('/salon/service', validate(masterServiceValidationSchema, 'body'), catalogController.createSalonService); // Создать услугу для салона
router.get('/salon/services', catalogController.getSalonServices); // Получить услуги салона
router.put('/salon/service/:id', validate(updateMasterServiceValidationSchema, 'body'), catalogController.updateSalonService); // Обновить услугу салона
router.delete('/salon/service/:id', catalogController.deleteSalonService); // Удалить услугу салона

module.exports = router;