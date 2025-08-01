const express = require('express');
const router = express.Router();
const PartsController = require('../controllers/parts/parts.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Public routes
router.get('/', PartsController.search.bind(PartsController));
router.get('/search', PartsController.search.bind(PartsController));
router.get('/brands/all', PartsController.getBrands.bind(PartsController));
router.get('/models/by-brand/:brandId', PartsController.getModelsByBrand.bind(PartsController));
router.get('/categories/all', PartsController.getCategories.bind(PartsController));
router.get('/part-categories/all', PartsController.getPartCategories.bind(PartsController));
router.get('/user/:userId', PartsController.getByUserId.bind(PartsController));
// This needs to be last to avoid conflicts with specific routes
router.get('/:id', PartsController.getById.bind(PartsController));

// Protected routes - require authentication
router.post('/', authMiddleware, PartsController.create.bind(PartsController));
router.put('/:id', authMiddleware, PartsController.update.bind(PartsController));
router.delete('/:id', authMiddleware, PartsController.delete.bind(PartsController));
router.put('/:partId/images/:imageId/primary', authMiddleware, PartsController.setImageAsPrimary.bind(PartsController));
router.delete('/:partId/images/:imageId', authMiddleware, PartsController.deleteImage.bind(PartsController));

// VIP purchase route
router.post('/vip/purchase', authMiddleware, PartsController.purchaseVipStatus.bind(PartsController));

// Increment views count for a part
router.post('/:id/views', async (req, res) => {
  try {
    const partId = req.params.id;
    console.log('Incrementing views for part ID:', partId);
    
    // Use the incrementViews method from the Part model
    const Part = require('../models/part');
    await Part.incrementViews(partId);
    
    res.json({ success: true, message: 'View count incremented' });
  } catch (error) {
    console.error('Error incrementing part views:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to increment view count'
    });
  }
});

module.exports = router;
