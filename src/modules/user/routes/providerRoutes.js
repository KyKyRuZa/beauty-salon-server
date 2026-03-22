const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('provider-routes');
const MasterSkill = require('../models/MasterSkill');
const MasterPortfolio = require('../models/MasterPortfolio');
const { authenticateToken } = require('../../../middleware/auth');

// Топ мастеров (публичный endpoint)
router.get('/top', providerController.getTopMastersController);

router.get('/master/:id', providerController.getMasterById);
router.get('/salon/:id', providerController.getSalonById);

// ============================================
// Навыки мастера
// ============================================

// Получить навыки мастера
router.get('/master/:masterId/skills', async (req, res) => {
  try {
    const { masterId } = req.params;
    const skills = await MasterSkill.findAll({
      where: { master_id: masterId, is_active: true },
      order: [['sort_order', 'ASC']],
    });
    res.json({ success: true, data: skills });
  } catch (error) {
    logger.error('Ошибка получения навыков:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// Портфолио мастера
// ============================================

// Получить портфолио мастера
router.get('/master/:masterId/portfolio', async (req, res) => {
  try {
    const { masterId } = req.params;
    const { category, is_featured } = req.query;
    const where = { master_id: masterId, is_visible: true };

    if (category) where.category = category;
    if (is_featured !== undefined) where.is_featured = is_featured === 'true';

    const portfolio = await MasterPortfolio.findAll({
      where,
      order: [
        ['is_featured', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
    res.json({ success: true, data: portfolio });
  } catch (error) {
    logger.error('Ошибка получения портфолио:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
