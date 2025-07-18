const express = require('express');
const router = express.Router();
const AutosalonModel = require('../models/autosalon/autosalon.model');

// Public route to get all autosalons with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      established_year_min,
      established_year_max,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      established_year_min: established_year_min ? parseInt(established_year_min) : undefined,
      established_year_max: established_year_max ? parseInt(established_year_max) : undefined,
      sortBy,
      sortOrder
    };

    const result = await AutosalonModel.getAll(filters);

    res.json({
      success: true,
      data: result.data,
      meta: result.meta
    });

  } catch (error) {
    console.error('Error fetching public autosalons:', error);
    res.status(500).json({
      success: false,
      message: 'ავტოსალონების ჩამოტვირთვისას მოხდა შეცდომა'
    });
  }
});

// Public route to get single autosalon by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const autosalon = await AutosalonModel.getById(id);

    if (!autosalon) {
      return res.status(404).json({
        success: false,
        message: 'ავტოსალონი ვერ მოიძებნა'
      });
    }

    res.json({
      success: true,
      data: autosalon
    });

  } catch (error) {
    console.error('Error fetching public autosalon:', error);
    res.status(500).json({
      success: false,
      message: 'ავტოსალონის ჩამოტვირთვისას მოხდა შეცდომა'
    });
  }
});

module.exports = router;