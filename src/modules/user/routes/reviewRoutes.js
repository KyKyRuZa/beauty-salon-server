const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../../../middleware/auth');

router.post('/', authenticateToken, reviewController.createReview);

router.get('/master/:masterId', reviewController.getMasterReviews);

router.get('/salon/:salonId', reviewController.getSalonReviews);

router.get('/stats/master/:masterId', reviewController.getReviewStats);

router.get('/stats/salon/:salonId', reviewController.getReviewStats);

router.get('/:id', reviewController.getReviewById);

router.put('/:id', authenticateToken, reviewController.updateReview);

router.delete('/:id', authenticateToken, reviewController.deleteReview);

module.exports = router;
