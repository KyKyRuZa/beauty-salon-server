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


router.get('/', catalogController.getAllCatalogServices);
router.get('/categories', catalogController.getAllCatalogCategories);
router.get('/categories/popular', catalogController.getPopularCategories);
router.get('/categories/:id', catalogController.getCatalogCategoryById);
router.get('/by-category/:categoryId', catalogController.getServicesByCategory);
router.get('/variations/:serviceId', catalogController.getServiceVariations);
router.get('/:id', catalogController.getCatalogServiceById);


router.get('/search/categories', catalogController.searchCategories);
router.get('/search/services', catalogController.searchMasterServices);
router.get('/search/masters', catalogController.searchMasters);


router.use(authenticateToken);


router.post('/categories', validate(serviceCategoryValidationSchema, 'body'), catalogController.createCatalogCategory);
router.put('/categories/:id', validate(serviceCategoryValidationSchema, 'body'), catalogController.updateCatalogCategory);
router.delete('/categories/:id', catalogController.deleteCatalogCategory);
router.post('/', validate(serviceTemplateValidationSchema, 'body'), catalogController.createCatalogService);
router.put('/:id', validate(serviceTemplateValidationSchema, 'body'), catalogController.updateCatalogService);
router.delete('/:id', catalogController.deleteCatalogService);


router.post('/master/service', validate(masterServiceValidationSchema, 'body'), catalogController.createMasterService);
router.get('/master/services', catalogController.getMasterServices);
router.put('/master/service/:id', validate(updateMasterServiceValidationSchema, 'body'), catalogController.updateMasterService);
router.delete('/master/service/:id', catalogController.deleteMasterService);



router.post('/salon/service', validate(masterServiceValidationSchema, 'body'), catalogController.createSalonService);
router.get('/salon/services', catalogController.getSalonServices);
router.put('/salon/service/:id', validate(updateMasterServiceValidationSchema, 'body'), catalogController.updateSalonService);
router.delete('/salon/service/:id', catalogController.deleteSalonService);

module.exports = router;