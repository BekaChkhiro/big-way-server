const express = require('express');
const router = express.Router();
const dealerController = require('../controllers/dealerController');
const authenticate = require('../middleware/auth.middleware').authenticateToken;
const { USER_ROLES } = require('../constants/roles');

// Public routes
router.get('/dealers', dealerController.getAllDealers);
router.get('/dealers/:dealerId', dealerController.getDealerProfile);
router.get('/dealers/:dealerId/cars', dealerController.getDealerCars);

// Protected routes (dealer only)
router.get('/dealer/profile', authenticate, dealerController.getMyDealerProfile);
router.put('/dealers/:dealerId', authenticate, dealerController.updateDealerProfile);

module.exports = router;