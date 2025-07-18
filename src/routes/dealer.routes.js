const express = require('express');
const router = express.Router();
const dealerController = require('../controllers/dealerController');
const authenticate = require('../middleware/auth.middleware').authenticateToken;
const { upload } = require('../middlewares/upload.middleware');
const { USER_ROLES } = require('../constants/roles');

// Admin routes for dealers management
router.get('/dealers', authenticate, dealerController.getAllDealersAdmin);

// Public routes
router.get('/dealers/public', dealerController.getAllDealers);
router.get('/dealers/:dealerId', dealerController.getDealerProfile);
router.get('/dealers/:dealerId/cars', dealerController.getDealerCars);

// Protected routes (dealer only)
router.get('/dealer/profile', authenticate, dealerController.getMyDealerProfile);
router.put('/dealers/:dealerId', authenticate, dealerController.updateDealerProfile);

// Admin-only routes (require authentication and admin role)
router.post('/admin/dealers', authenticate, dealerController.createDealer);
router.put('/admin/dealers/:id', authenticate, dealerController.updateDealerAdmin);
router.delete('/admin/dealers/:id', authenticate, dealerController.deleteDealer);
router.post('/admin/dealers/:id/logo', authenticate, upload.single('logo'), dealerController.uploadDealerLogo);

module.exports = router;