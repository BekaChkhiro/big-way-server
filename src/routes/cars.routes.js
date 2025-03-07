const router = require('express').Router();
const CarModel = require('../models/car.model');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload, processAndUpload, setCacheHeaders } = require('../middlewares/upload.middleware');
const pool = require('../../config/db.config');

/**
 * @swagger
 * components:
 *   schemas:
 *     Car:
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
 * /api/cars:
 *   get:
 *     summary: Get all cars with filtering and pagination
 *     tags: [Cars]
 *     parameters:
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
 *         description: List of cars with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cars:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Car'
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
      brand_id,
      category_id,
      price_min,
      price_max,
      year_min,
      year_max,
      location
    } = req.query;

    const filters = {
      brand_id,
      category_id,
      price_min,
      price_max,
      year_min,
      year_max,
      location
    };

    const result = await CarModel.findAll({
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
 * /api/cars/brands:
 *   get:
 *     summary: Get all car brands
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: List of car brands
 */
router.get('/brands', async (req, res) => {
  try {
    const brands = await CarModel.getBrands();
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching brands', error: error.message });
  }
});

/**
 * @swagger
 * /api/cars/categories:
 *   get:
 *     summary: Get all car categories
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: List of car categories
 */
router.get('/categories', async (req, res) => {
  try {
    const query = 'SELECT * FROM categories ORDER BY name ASC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

/**
 * @swagger
 * /api/cars/search:
 *   get:
 *     summary: Advanced search for cars
 *     tags: [Cars]
 *     parameters:
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

    const result = await CarModel.searchCars({
      searchQuery: q,
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
    res.status(500).json({ message: 'Error searching cars', error: error.message });
  }
});

/**
 * @swagger
 * /api/cars/{id}:
 *   get:
 *     summary: Get car by ID
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Car details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Car'
 *       404:
 *         description: Car not found
 */
router.get('/:id', async (req, res) => {
  try {
    const car = await CarModel.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    // Increment views count
    await CarModel.incrementViews(req.params.id);
    
    res.json(car);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching car', error: error.message });
  }
});

/**
 * @swagger
 * /api/cars:
 *   post:
 *     summary: Create new car listing
 *     tags: [Cars]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Car'
 *     responses:
 *       201:
 *         description: Car created successfully
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

    const car = await CarModel.create(carData, req.user.id);
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
 * /api/cars/{id}/images:
 *   post:
 *     summary: Upload images for a car
 *     tags: [Cars]
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
 *         description: Forbidden - not the car owner
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
    const car = await CarModel.findById(carId);
    if (!car || car.seller_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to add images to this car' });
    }

    // Process and upload images
    const processedImages = await processAndUpload(req.files);
    
    // Update car with new images
    const updatedCar = await CarModel.addImages(carId, processedImages);
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

// Update car listing (requires authentication)
router.put('/:id', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    let carData = req.body;
    
    // Process images if provided
    if (req.files && req.files.length > 0) {
      const processedImages = await processAndUpload(req.files);
      carData.images = processedImages;
    }

    const car = await CarModel.update(req.params.id, carData, req.user.id);
    res.json(car);
  } catch (error) {
    if (error.message === 'Unauthorized to update this car') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating car listing', error: error.message });
  }
});

// Delete car listing (requires authentication)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await CarModel.delete(req.params.id, req.user.id);
    res.json({ message: 'Car listing deleted successfully' });
  } catch (error) {
    if (error.message === 'Unauthorized to delete this car') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting car listing', error: error.message });
  }
});

module.exports = router;