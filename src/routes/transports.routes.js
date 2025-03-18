const express = require('express');
const router = express.Router();
const Car = require('../models/car');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload, processAndUpload, setCacheHeaders } = require('../middlewares/upload.middleware');
const pool = require('../../config/db.config');

/**
 * @swagger
 * components:
 *   schemas:
 *     Transport:
 *       type: object
 *       required:
 *         - brand_id
 *         - category_id
 *         - model
 *         - year
 *         - price
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated ID
 *         brand_id:
 *           type: integer
 *         category_id:
 *           type: integer
 *         model:
 *           type: string
 *         year:
 *           type: integer
 *         price:
 *           type: number
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [available, sold, pending]
 *         featured:
 *           type: boolean
 *         specifications:
 *           type: object
 *           properties:
 *             engine_type:
 *               type: string
 *             transmission:
 *               type: string
 *             fuel_type:
 *               type: string
 *             mileage:
 *               type: integer
 *             engine_size:
 *               type: number
 *             horsepower:
 *               type: integer
 *             doors:
 *               type: integer
 *             color:
 *               type: string
 *             body_type:
 *               type: string
 *         location:
 *           type: object
 *           properties:
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 */

/**
 * @swagger
 * /api/transports:
 *   get:
 *     summary: Get all transports with filtering and pagination
 *     tags: [Transports]
 *     parameters:
 *       - in: query
 *         name: transport_type
 *         schema:
 *           type: string
 *           enum: [car, special_equipment, moto]
 *         description: Filter by transport type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: brand_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: price_min
 *         schema:
 *           type: number
 *       - in: query
 *         name: price_max
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of transports with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cars:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transport'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                     total_items:
 *                       type: integer
 *                     items_per_page:
 *                       type: integer
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC',
      transport_type,
      brand_id,
      category_id,
      price_min,
      price_max,
      year_min,
      year_max,
      location
    } = req.query;

    const filters = {
      transport_type,
      brand_id,
      category_id,
      price_min,
      price_max,
      year_min,
      year_max,
      location
    };

    const result = await Car.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order,
      filters
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cars', error: error.message });
  }
});

/**
 * @swagger
 * /api/transports/brands:
 *   get:
 *     summary: Get all transport brands
 *     tags: [Transports]
 *     responses:
 *       200:
 *         description: List of transport brands
 */
router.get('/brands', async (req, res) => {
  try {
    const brands = await Car.getBrands();
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands', error: error.message });
  }
});

/**
 * @swagger
 * /api/transports/categories:
 *   get:
 *     summary: Get all transport categories
 *     tags: [Transports]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [car, special_equipment, moto]
 *         description: Filter categories by transport type
 *     responses:
 *       200:
 *         description: List of transport categories
 */
router.get('/categories', async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM categories';
    const params = [];

    if (type) {
      query += ' WHERE transport_type = $1';
      params.push(type);
    }

    query += ' ORDER BY name ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

/**
 * @swagger
 * /api/transports/search:
 *   get:
 *     summary: Advanced search for transports
 *     tags: [Transports]
 *     parameters:
 *       - in: query
 *         name: transport_type
 *         schema:
 *           type: string
 *           enum: [car, special_equipment, moto]
 *         description: Filter by transport type
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: brand_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year_min
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year_max
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results with pagination
 */
router.get('/search', async (req, res) => {
  try {
    const {
      q, // search query
      transport_type,
      brand_id,
      category_id,
      model,
      year_min,
      year_max,
      price_min,
      price_max,
      engine_type,
      transmission,
      fuel_type,
      body_type,
      color,
      doors,
      mileage_max,
      location,
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    const result = await Car.searchCars({
      searchQuery: q,
      transportType: transport_type,
      brandId: brand_id,
      categoryId: category_id,
      model,
      yearMin: year_min,
      yearMax: year_max,
      priceMin: price_min,
      priceMax: price_max,
      specifications: {
        engine_type,
        transmission,
        fuel_type,
        body_type,
        color,
        doors: doors ? parseInt(doors) : undefined,
        mileage_max: mileage_max ? parseInt(mileage_max) : undefined
      },
      location,
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error searching transports', error: error.message });
  }
});

/**
 * @swagger
 * /api/transports/{id}:
 *   get:
 *     summary: Get transport by ID
 *     tags: [Transports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transport details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transport'
 *       404:
 *         description: Transport not found
 */
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Increment views count
    await Car.incrementViews(req.params.id);
    
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching car', error: error.message });
  }
});

/**
 * @swagger
 * /api/transports:
 *   post:
 *     summary: Create new transport listing
 *     tags: [Transports]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Transport'
 *     responses:
 *       201:
 *         description: Transport created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    let carData = { ...req.body };
    
    // If specifications are nested, flatten them into the main object
    if (carData.specifications) {
      carData = {
        ...carData,
        ...carData.specifications
      };
      delete carData.specifications;
    }

    const errors = [];
    
    // Required fields validation with specific error messages
    const requiredFields = {
      brand_id: { label: 'Brand ID', type: 'number' },
      category_id: { label: 'Category ID', type: 'number' },
      model: { label: 'Model', type: 'string' },
      year: { label: 'Year', type: 'number' },
      price: { label: 'Price', type: 'number' },
      city: { label: 'City', type: 'string' },
      state: { label: 'State', type: 'string' },
      country: { label: 'Country', type: 'string' }
    };

    // Check for missing fields and type validation
    for (const [field, config] of Object.entries(requiredFields)) {
      if (!carData[field]) {
        errors.push(`${config.label} is required`);
      } else if (typeof carData[field] !== config.type) {
        errors.push(`${config.label} must be a ${config.type}`);
      }
    }

    // Additional validations for specific fields
    if (carData.year && (carData.year < 1900 || carData.year > new Date().getFullYear() + 1)) {
      errors.push('Year must be between 1900 and ' + (new Date().getFullYear() + 1));
    }

    if (carData.price && carData.price <= 0) {
      errors.push('Price must be a positive number');
    }

    // If there are any validation errors, return them all at once
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors
      });
    }

    const car = await Car.create(carData, req.user.id);
    res.status(201).json(car);
  } catch (error) {
    // Handle specific database errors
    if (error.message.includes('Brand does not exist')) {
      return res.status(400).json({
        message: 'Validation failed',
        error: 'Selected brand does not exist'
      });
    }
    if (error.message.includes('Category does not exist')) {
      return res.status(400).json({
        message: 'Validation failed',
        error: 'Selected category does not exist'
      });
    }
    res.status(500).json({ 
      message: 'Error creating car listing', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/transports/{id}/images:
 *   post:
 *     summary: Upload images for a transport
 *     tags: [Transports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the transport owner
 */
router.post('/:id/images', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    const carId = req.params.id;
    
    // Check if files were provided
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        message: 'No images provided',
        error: 'At least one image file is required'
      });
    }

    // Check car ownership
    const car = await Car.findById(carId);
    if (!car || car.seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to add images to this car' });
    }

    // Process and upload images
    const processedImages = await processAndUpload(req.files);
    
    // Update car with new images
    const updatedCar = await Car.addImages(carId, processedImages);
    res.json(updatedCar);
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      message: 'Error uploading images', 
      error: error.message 
    });
  }
});

// Apply cache headers to image retrievals
router.use('/images', setCacheHeaders);

// Update transport listing (requires authentication)
router.put('/:id', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    let carData = req.body;
    
    // Process images if provided
    if (req.files && req.files.length > 0) {
      const processedImages = await processAndUpload(req.files);
      carData.images = processedImages;
    }

    const car = await Car.update(req.params.id, carData, req.user.id);
    res.json(car);
  } catch (error) {
    if (error.message === 'Unauthorized to update this car') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating car listing', error: error.message });
  }
});

// Delete transport listing (requires authentication)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Car.delete(req.params.id, req.user.id);
    res.json({ message: 'Car listing deleted successfully' });
  } catch (error) {
    if (error.message === 'Unauthorized to delete this car') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting car listing', error: error.message });
  }
});

/**
 * @swagger
 * /api/transports/{id}/similar:
 *   get:
 *     summary: Get similar transports based on brand, category, price range, and year
 *     tags: [Transports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *         description: Number of similar transports to return
 *     responses:
 *       200:
 *         description: List of similar transports
 *       404:
 *         description: Transport not found
 */
router.get('/:id/similar', async (req, res) => {
  try {
    const { limit = 4 } = req.query;
    const similarCars = await Car.findSimilarCars(req.params.id, parseInt(limit));
    res.json(similarCars);
  } catch (error) {
    if (error.message === 'Car not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error fetching similar cars', error: error.message });
  }
});

/**
 * @swagger
 * /api/transports/brands/{brandId}/models:
 *   get:
 *     summary: Get all models for a specific brand
 *     tags: [Transports]
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of models for the brand
 *       404:
 *         description: Brand not found
 */
router.get('/brands/:brandId/models', async (req, res) => {
  try {
    const models = await Car.getModelsByBrand(req.params.brandId);
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching models', error: error.message });
  }
});

// Re-export cars routes
module.exports = router;