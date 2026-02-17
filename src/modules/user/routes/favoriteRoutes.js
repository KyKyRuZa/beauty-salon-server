const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken } = require('../../../middleware/auth');


router.use(authenticateToken);

router.get('/', favoriteController.getFavorites);

router.post('/:masterId', favoriteController.addFavorite);

router.delete('/:masterId', favoriteController.removeFavorite);

router.post('/:masterId/toggle', favoriteController.toggleFavorite);

router.get('/:masterId/check', favoriteController.checkFavorite);

module.exports = router;
