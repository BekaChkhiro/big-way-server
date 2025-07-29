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

module.exports = router;
