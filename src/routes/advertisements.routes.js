const express = require('express');
const router = express.Router();
const advertisementController = require('../controllers/advertisement.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

// ---------- STANDARD ADVERTISEMENT ROUTES ----------

// Get all advertisements (admin only)
router.get('/', authMiddleware, advertisementController.getAdvertisements);

// Get active advertisements by placement (public)
router.get('/placement/:placement', advertisementController.getActiveAdvertisementsByPlacement);

// ---------- ANALYTICS ROUTES ----------

// Get all advertisements with analytics data (admin only)
router.get('/analytics/all', authMiddleware, advertisementController.getAllAdvertisementsAnalytics);

// Get single advertisement analytics by ID (admin only)
router.get('/analytics/:id', authMiddleware, advertisementController.getAdvertisementAnalytics);

// Record impression for an advertisement (public)
router.post('/impression/:id', advertisementController.recordImpression);

// Record click for an advertisement (public)
router.post('/click/:id', advertisementController.recordClick);

// ---------- STANDARD ROUTES WITH PARAMS ----------

// Get advertisement by ID
router.get('/:id', authMiddleware, advertisementController.getAdvertisementById);

// Create new advertisement (admin only)
router.post('/', authMiddleware, upload.single('image'), advertisementController.createAdvertisement);

// Update advertisement (admin only)
router.put('/:id', authMiddleware, upload.single('image'), advertisementController.updateAdvertisement);

// Delete advertisement (admin only)
router.delete('/:id', authMiddleware, advertisementController.deleteAdvertisement);

module.exports = router;
