const express = require('express');
const { body } = require('express-validator');
const vipPricingController = require('../controllers/vipPricingController');

// Import middleware if they exist, otherwise create placeholders
let isAuthenticated, isAdmin;

try {
  isAuthenticated = require('../middlewares/auth').isAuthenticated;
  isAdmin = require('../middlewares/admin').isAdmin;
} catch (error) {
  console.warn('Auth middleware not found, using placeholder middleware');
  // Placeholder middleware that allows all requests
  isAuthenticated = (req, res, next) => next();
  isAdmin = (req, res, next) => next();
}

const router = express.Router();

// Public route to get VIP pricing
router.get('/pricing', vipPricingController.getAllVipPricing);

// Admin routes for managing VIP pricing
router.get('/admin/vip/pricing', isAuthenticated, isAdmin, vipPricingController.getAllVipPricing);

router.put(
  '/admin/vip/pricing',
  isAuthenticated,
  isAdmin,
  [
    body('prices').isArray().withMessage('Prices must be an array'),
    body('prices.*.vip_status').isIn(['vip', 'vip_plus', 'super_vip']).withMessage('Invalid VIP status'),
    body('prices.*.price').isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),
    body('prices.*.duration_days').isInt({ min: 1 }).withMessage('Duration must be a positive integer')
  ],
  vipPricingController.updateVipPricing
);

module.exports = router;
