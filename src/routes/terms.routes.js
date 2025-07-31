const express = require('express');
const TermsController = require('../controllers/terms.controller');
const auth = require('../middlewares/auth.middleware');
const adminAuth = require('../middlewares/admin.middleware');

const router = express.Router();

// Public routes
router.get('/', TermsController.getTerms);
router.get('/:id', TermsController.getTermById);

// Admin routes
router.post('/', auth, adminAuth, TermsController.createTerm);
router.put('/:id', auth, adminAuth, TermsController.updateTerm);
router.delete('/:id', auth, adminAuth, TermsController.deleteTerm);

module.exports = router;