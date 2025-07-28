const express = require('express');
const { body } = require('express-validator');
const vipPricingController = require('../controllers/vipPricingController');

// Import middleware
const authMiddleware = require('../middlewares/auth.middleware');

// Import admin middleware if it exists, otherwise create placeholder
let isAdmin;
try {
  isAdmin = require('../middlewares/admin').isAdmin;
} catch (error) {
  console.warn('Admin middleware not found, using placeholder middleware');
  // Admin check using the user role from auth middleware
  isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  };
}

// Use the auth middleware directly
const isAuthenticated = authMiddleware;

const router = express.Router();

// Public routes to get VIP pricing
router.get('/pricing', vipPricingController.getAllVipPricing);
router.get('/pricing/packages', vipPricingController.getVipPackages);
router.get('/pricing/services', vipPricingController.getAdditionalServices);

// Authenticated route to get pricing for current user's role
router.get('/pricing/user', isAuthenticated, vipPricingController.getUserVipPricing);

// Admin routes for managing VIP pricing
router.get('/admin/vip/pricing', isAuthenticated, isAdmin, vipPricingController.getAllVipPricing);
router.get('/admin/vip/pricing/packages', isAuthenticated, isAdmin, vipPricingController.getVipPackages);
router.get('/admin/vip/pricing/services', isAuthenticated, isAdmin, vipPricingController.getAdditionalServices);

router.put(
  '/admin/vip/pricing',
  isAuthenticated,
  isAdmin,
  [
    body('prices').isArray().withMessage('Prices must be an array'),
    body('prices.*.service_type').optional().isIn(['free', 'vip', 'vip_plus', 'super_vip', 'color_highlighting', 'auto_renewal']).withMessage('Invalid service type'),
    body('prices.*.vip_status').optional().isIn(['vip', 'vip_plus', 'super_vip']).withMessage('Invalid VIP status (deprecated field)'),
    body('prices.*.price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('prices.*.duration_days').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('prices.*.is_daily_price').optional().isBoolean().withMessage('is_daily_price must be a boolean'),
    body('prices.*.user_role').optional().isIn(['user', 'dealer', 'autosalon']).withMessage('Invalid user role')
  ],
  vipPricingController.updateVipPricing
);

module.exports = router;
