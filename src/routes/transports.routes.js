const express = require('express');
const router = express.Router();
const Car = require('../models/car');

// Get all models for a specific brand
router.get('/brands/:brandId/models', async (req, res) => {
  try {
    const brandId = parseInt(req.params.brandId);
    const models = await Car.getModelsByBrand(brandId);
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;