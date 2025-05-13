const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');
const authMiddleware = require('../middlewares/auth.middleware');

// Get user balance
router.get('/', authMiddleware, balanceController.getBalance);

// Add funds to balance
router.post('/add', authMiddleware, balanceController.addFunds);

// Get transaction history
router.get('/transactions', authMiddleware, balanceController.getTransactionHistory);

// Get all transactions (admin only)
router.get('/admin/transactions', authMiddleware, balanceController.getAdminTransactions);

// Purchase VIP status with balance
router.post('/purchase-vip/:carId', authMiddleware, balanceController.purchaseVipStatus);

module.exports = router;
