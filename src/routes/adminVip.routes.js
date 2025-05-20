const express = require('express');
const router = express.Router();
const adminVipController = require('../controllers/adminVipController');
const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');

// Helper middleware that conditionally applies auth and admin middleware in production
// but bypasses both in development for easier testing
const conditionalAuthMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return authMiddleware(req, res, next);
  }
  // In development, bypass auth check and add a mock admin user
  req.user = { id: 1, role: 'admin' };
  next();
};

const conditionalAdminMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return adminMiddleware(req, res, next);
  }
  // In development, bypass admin check
  next();
};

// For development, we don't apply auth middleware globally
// For production, we'll apply it in each route

// Get VIP listings stats for admin dashboard
router.get('/vip-listings/stats', conditionalAuthMiddleware, conditionalAdminMiddleware, adminVipController.getVipListingsStats);

// Get all VIP listings for admin
router.get('/vip-listings', conditionalAuthMiddleware, conditionalAdminMiddleware, adminVipController.getVipListings);

// Get VIP transactions for admin
router.get('/vip-transactions', conditionalAuthMiddleware, conditionalAdminMiddleware, adminVipController.getVipTransactions);

module.exports = router;
