const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');





router.get('/master/:id', providerController.getMasterById);


router.get('/salon/:id', providerController.getSalonById);

module.exports = router;