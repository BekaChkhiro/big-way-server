const express = require('express');
const router = express.Router();
const AutosalonController = require('../controllers/autosalonController');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

// Public routes (no authentication required)
router.get('/public', AutosalonController.getAllAutosalons);
router.get('/public/:id', AutosalonController.getAutosalonById);
router.get('/public/:id/cars', AutosalonController.getAutosalonCars);

// Protected routes (require authentication)
router.use(authMiddleware);

// Create new autosalon (Admin only)
router.post('/', AutosalonController.createAutosalon);

// Get all autosalons (Admin only)
router.get('/', AutosalonController.getAllAutosalons);

// Get autosalon by ID
router.get('/:id', AutosalonController.getAutosalonById);

// Update autosalon (Admin only)
router.put('/:id', AutosalonController.updateAutosalon);

// Delete autosalon (Admin only)
router.delete('/:id', AutosalonController.deleteAutosalon);

// Upload autosalon logo (Admin only)
router.post('/:id/logo', upload.single('logo'), AutosalonController.uploadLogo);

module.exports = router;