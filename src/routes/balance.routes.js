const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');
const authMiddleware = require('../middlewares/auth.middleware');

// Get user balance
router.get('/', authMiddleware, balanceController.getBalance);

// Add funds to balance (direct)
router.post('/add', authMiddleware, balanceController.addFunds);

// Online payment routes for balance
router.post('/add-online', authMiddleware, balanceController.initializeOnlinePayment);
router.post('/payment-callback', balanceController.handlePaymentCallback);
router.get('/payment-complete', balanceController.paymentComplete);

// Purchase VIP status with balance
router.post('/purchase-vip', authMiddleware, balanceController.purchaseVipStatus);
წ
// Get transaction history
router.get('/transactions', authMiddleware, balanceController.getTransactionHistory);

// Get all transactions (admin only)
router.get('/admin/transactions', authMiddleware, balanceController.getAdminTransactions);

module.exports = router;
