const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticateToken } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validation');
const {
  masterServiceValidationSchema
} = require('../../../validation');


router.use(authenticateToken);


router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);
router.post('/', validate(masterServiceValidationSchema, 'body'), serviceController.createService);
router.put('/:id', validate(masterServiceValidationSchema, 'body'), serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

module.exports = router;