const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { upload, processAndUpload, setCacheHeaders } = require('../middlewares/upload.middleware');
const Car = require('../models/car');
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
 *           $ref: '#/components/schemas/Specifications'
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
      ...filters 
    } = req.query;

    const result = await Car.findAll({ 
      page: parseInt(page), 
      limit: parseInt(limit),
      sort,
      order,
      filters 
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ message: 'Internal server error' });
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
    const brands = await Car.getBrands();
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Internal server error' });
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
      searchQuery,
      carType,
      brandId,
      categoryId,
      model,
      yearMin,
      yearMax,
      priceMin,
      priceMax,
      specifications,
      location,
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    const result = await Car.searchCars({
      searchQuery,
      carType,
      brandId: brandId ? parseInt(brandId) : undefined,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      model,
      yearMin: yearMin ? parseInt(yearMin) : undefined,
      yearMax: yearMax ? parseInt(yearMax) : undefined,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      specifications: specifications ? JSON.parse(specifications) : {},
      location,
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order
    });

    res.json(result);
  } catch (error) {
    console.error('Error searching cars:', error);
    res.status(500).json({ message: 'Internal server error' });
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
    const { id } = req.params;
    const car = await Car.findById(parseInt(id));
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Increment views
    await Car.incrementViews(parseInt(id));
    
    res.json(car);
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ message: 'Internal server error' });
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
    const car = await Car.create(req.body, req.user.id);
    res.status(201).json(car);
  } catch (error) {
    console.error('Error creating car:', error);
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
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
router.post('/:id/images', authMiddleware, upload.array('images'), async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.addImages(parseInt(id), req.processedImages);
    res.json(car);
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Apply cache headers to image retrievals
router.use('/images', setCacheHeaders);

// Update car listing (requires authentication)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.update(parseInt(id), req.body, req.user.id);
    res.json(car);
  } catch (error) {
    console.error('Error updating car:', error);
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete car listing (requires authentication)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await Car.delete(parseInt(id), req.user.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting car:', error);
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/cars/{id}/similar:
 *   get:
 *     summary: Get similar cars based on brand, category, price range, and year
 *     tags: [Cars]
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
 *         description: Number of similar cars to return
 *     responses:
 *       200:
 *         description: List of similar cars
 *       404:
 *         description: Car not found
 */
router.get('/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;
    const similarCars = await Car.findSimilarCars(parseInt(id), parseInt(limit));
    res.json(similarCars);
  } catch (error) {
    console.error('Error fetching similar cars:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;