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

// Flitt payment routes
router.post('/flitt-redirect', balanceController.handleFlittRedirect); // POST from Flitt, redirects user to frontend
router.post('/flitt-callback', balanceController.handlePaymentCallback); // Webhook for payment confirmation
router.post('/payment-callback', balanceController.handlePaymentCallback); // Legacy route
router.get('/payment-complete', balanceController.paymentComplete);
router.post('/payment-complete', balanceController.paymentComplete);

// Bank of Georgia payment routes
router.get('/bog-payment', balanceController.bogPaymentPage);
router.post('/bog-callback', balanceController.handleBogPaymentCallback);
router.post('/bog-payment-callback', balanceController.handleBogPaymentCallback); // Legacy route

// TBC Bank payment routes
router.get('/tbc-payment', balanceController.tbcPaymentPage);
router.post('/tbc-payment-callback', balanceController.handleTbcPaymentCallback);

// Purchase VIP status with balance
router.post('/purchase-vip', authMiddleware, balanceController.purchaseVipStatus);

// Get transaction history
router.get('/transactions', authMiddleware, balanceController.getTransactionHistory);

// Check payment status by orderId
router.get('/payment-status/:orderId', authMiddleware, balanceController.checkPaymentStatus);

// Get all transactions (admin only)
router.get('/admin/transactions', authMiddleware, balanceController.getAdminTransactions);

module.exports = router;
