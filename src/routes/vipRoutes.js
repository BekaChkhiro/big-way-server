const express = require('express');
const router = express.Router();
const vipController = require('../controllers/vipController');
const authMiddleware = require('../middlewares/auth.middleware');

// Get all VIP status types
router.get('/types', vipController.getVipStatusTypes);

// Get all cars with a specific VIP status
router.get('/cars/:vipStatus', vipController.getCarsByVipStatus);

// Update a car's VIP status (requires authentication)
router.put('/update/:carId', authMiddleware, vipController.updateVipStatus);

// Purchase VIP status for a car (requires authentication)
router.post('/purchase/:carId', authMiddleware, vipController.purchaseVipStatus);

module.exports = router;
