const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const CarCreate = require('../models/car/create');
const pool = require('../../config/db.config');
const { BRAND_MODELS } = require('../models/car/base');
const authMiddleware = require('../middlewares/auth.middleware');
const { processAndUpload, setCacheHeaders } = require('../middlewares/upload.middleware');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/cars');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const carUpload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all brands
router.get('/brands', async (req, res) => {
  try {
    const query = 'SELECT * FROM brands ORDER BY name ASC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const query = 'SELECT * FROM categories ORDER BY name ASC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Get models for a specific brand
router.get('/brands/:brandName/models', async (req, res) => {
  try {
    const brandNameRaw = req.params.brandName;
    const brandName = decodeURIComponent(brandNameRaw).toLowerCase();
    console.log('Requested brand name (raw):', brandNameRaw);
    console.log('Requested brand name (decoded):', brandName);
    
    // First check if brand exists (case insensitive)
    const brandQuery = 'SELECT * FROM brands WHERE LOWER(name) = $1';
    const brandResult = await pool.query(brandQuery, [brandName]);
    console.log('Brand from DB:', brandResult.rows[0]);
    
    if (brandResult.rows.length === 0) {
      // Try partial match if exact match fails
      const partialBrandQuery = 'SELECT * FROM brands WHERE LOWER(name) LIKE $1 ORDER BY name LIMIT 1';
      const partialBrandResult = await pool.query(partialBrandQuery, [`%${brandName}%`]);
      
      if (partialBrandResult.rows.length > 0) {
        console.log('Found brand with partial match:', partialBrandResult.rows[0]);
        
        // Fetch models for this brand from the database
        const modelsQuery = 'SELECT name FROM models WHERE brand_id = $1 ORDER BY name';
        const modelsResult = await pool.query(modelsQuery, [partialBrandResult.rows[0].id]);
        
        if (modelsResult.rows.length > 0) {
          const models = modelsResult.rows.map(row => row.name);
          console.log(`Found ${models.length} models in database for brand:`, partialBrandResult.rows[0].name);
          return res.json(models);
        }
      }
      
      console.log('Brand not found in database, checking hardcoded models');
      // If no brand in DB, check if we have hardcoded models for this brand
      let foundModels = null;
      
      // Case-insensitive check for known brands
      Object.entries({
        'toyota': ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Prius', 'Highlander', 'Avalon', '4Runner', 'Tacoma', 'Tundra'],
        'honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Odyssey', 'Ridgeline', 'Passport', 'Insight'],
        'ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Ranger', 'Bronco', 'Expedition', 'Focus'],
        'chevrolet': ['Silverado', 'Equinox', 'Tahoe', 'Traverse', 'Malibu', 'Camaro', 'Suburban', 'Colorado', 'Blazer'],
        'bmw': ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'M3', 'M5', 'i4', 'iX'],
        'mercedes': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'A-Class', 'CLA', 'AMG GT'],
        'audi': ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'e-tron', 'RS6', 'TT'],
        'volkswagen': ['Golf', 'Passat', 'Tiguan', 'Atlas', 'Jetta', 'Arteon', 'ID.4', 'Taos', 'GTI'],
        'hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Venue', 'Ioniq', 'Genesis'],
        'kia': ['Forte', 'K5', 'Sportage', 'Telluride', 'Sorento', 'Soul', 'Seltos', 'Carnival', 'Stinger']
      }).forEach(([brand, models]) => {
        if (brandName.includes(brand.toLowerCase())) {
          foundModels = models;
          console.log(`Found hardcoded models for ${brand}`);
        }
      });
      
      if (foundModels) {
        console.log('Models found for brand (hardcoded):', foundModels);
        return res.json(foundModels);
      }
      
      return res.status(404).json({ 
        success: false,
        error: `Brand "${brandNameRaw}" not found`
      });
    }

    // Found brand in database, now get models from database
    const brandId = brandResult.rows[0].id;
    const modelsQuery = 'SELECT name FROM models WHERE brand_id = $1 ORDER BY name';
    const modelsResult = await pool.query(modelsQuery, [brandId]);
    
    if (modelsResult.rows.length > 0) {
      const models = modelsResult.rows.map(row => row.name);
      console.log(`Found ${models.length} models in database for brand:`, brandResult.rows[0].name);
      return res.json(models);
    }
    
    // Fallback to hardcoded models if no database records
    console.log('No models found in database for brand, using hardcoded fallback');
    
    // Enhanced fallback models with more brands
    const brandModels = {
      'toyota': ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Prius', 'Highlander', 'Avalon', '4Runner', 'Tacoma', 'Tundra'],
      'honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Odyssey', 'Ridgeline', 'Passport', 'Insight'],
      'ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Ranger', 'Bronco', 'Expedition', 'Focus'],
      'chevrolet': ['Silverado', 'Equinox', 'Tahoe', 'Traverse', 'Malibu', 'Camaro', 'Suburban', 'Colorado', 'Blazer'],
      'bmw': ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'M3', 'M5', 'i4', 'iX'],
      'mercedes': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'A-Class', 'CLA', 'AMG GT'],
      'audi': ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'e-tron', 'RS6', 'TT'],
      'volkswagen': ['Golf', 'Passat', 'Tiguan', 'Atlas', 'Jetta', 'Arteon', 'ID.4', 'Taos', 'GTI'],
      'hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Venue', 'Ioniq'],
      'kia': ['Forte', 'K5', 'Sportage', 'Telluride', 'Sorento', 'Soul', 'Seltos', 'Carnival', 'Stinger'],
      'nissan': ['Altima', 'Maxima', 'Sentra', 'Rogue', 'Pathfinder', 'Murano', 'Kicks', 'Armada', 'Titan', '370Z'],
      'subaru': ['Outback', 'Forester', 'Crosstrek', 'Impreza', 'Legacy', 'Ascent', 'WRX', 'BRZ'],
      'mazda': ['Mazda3', 'Mazda6', 'CX-5', 'CX-9', 'CX-30', 'MX-5 Miata', 'CX-3', 'CX-50'],
      'lexus': ['ES', 'LS', 'RX', 'NX', 'UX', 'IS', 'GX', 'LX', 'RC', 'LC'],
      'acura': ['MDX', 'RDX', 'TLX', 'ILX', 'NSX', 'RLX', 'TL', 'TSX'],
      'infiniti': ['Q50', 'Q60', 'QX50', 'QX60', 'QX80', 'QX55', 'QX30'],
      'porsche': ['911', 'Cayenne', 'Panamera', 'Macan', 'Taycan', 'Cayman', 'Boxster'],
      'jaguar': ['F-PACE', 'E-PACE', 'I-PACE', 'XE', 'XF', 'XJ', 'F-TYPE'],
      'land rover': ['Range Rover', 'Range Rover Sport', 'Discovery', 'Defender', 'Evoque', 'Velar'],
      'bentley': ['Continental GT', 'Bentayga', 'Flying Spur', 'Mulsanne', 'Bacalar'],
      'rolls royce': ['Phantom', 'Ghost', 'Wraith', 'Dawn', 'Cullinan'],
      'ferrari': ['Roma', 'Portofino', 'SF90 Stradale', 'F8 Tributo', '812 Superfast'],
      'lamborghini': ['Aventador', 'Huracán', 'Urus'],
      'maserati': ['Ghibli', 'Levante', 'Quattroporte', 'MC20', 'GranTurismo'],
      'bugatti': ['Chiron', 'Veyron', 'Divo', 'Centodieci'],
      'aston martin': ['DB11', 'Vantage', 'DBS Superleggera', 'DBX'],
      'tesla': ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'],
      'volvo': ['XC90', 'XC60', 'XC40', 'S60', 'S90', 'V60', 'V90']
    };
    
    // Return models based on brand name with improved matching
    let models = [];
    const lowerBrandName = brandName.toLowerCase();
    
    // Check for direct match
    if (brandModels[lowerBrandName]) {
      models = brandModels[lowerBrandName];
      console.log(`Found direct match for brand "${lowerBrandName}" in fallback data`);
    } else {
      // Try to find a partial match
      let bestMatch = null;
      let bestMatchScore = 0;
      
      for (const brand in brandModels) {
        // Simple matching algorithm - if brand name contains or is contained by the key
        if (lowerBrandName.includes(brand) || brand.includes(lowerBrandName)) {
          // Calculate a simple score based on string length similarity
          const score = Math.min(brand.length, lowerBrandName.length) / 
                        Math.max(brand.length, lowerBrandName.length);
          
          if (score > bestMatchScore) {
            bestMatch = brand;
            bestMatchScore = score;
          }
        }
      }
      
      if (bestMatch && bestMatchScore > 0.5) {
        models = brandModels[bestMatch];
        console.log(`Found partial match "${bestMatch}" (score: ${bestMatchScore}) for brand "${lowerBrandName}"`);
      } else {
        // Default models if nothing else matches
        models = ['Model 1', 'Model 2', 'Model 3', 'Other'];
        console.log(`No match found for brand "${lowerBrandName}" in fallback data`);
      }
    }

    console.log('Models found for brand (hardcoded fallback):', models);
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Get models for a specific brand by ID
router.get('/brands/id/:brandId/models', async (req, res) => {
  try {
    const brandId = parseInt(req.params.brandId);
    
    if (isNaN(brandId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid brand ID format'
      });
    }
    
    console.log('Requested models for brand ID:', brandId);
    
    // First check if brand exists
    const brandQuery = 'SELECT * FROM brands WHERE id = $1';
    const brandResult = await pool.query(brandQuery, [brandId]);
    
    if (brandResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: `Brand with ID ${brandId} not found`
      });
    }
    
    console.log('Found brand:', brandResult.rows[0]);
    
    // Get models from the database
    const modelsQuery = 'SELECT name FROM models WHERE brand_id = $1 ORDER BY name';
    const modelsResult = await pool.query(modelsQuery, [brandId]);
    
    if (modelsResult.rows.length > 0) {
      const models = modelsResult.rows.map(row => row.name);
      console.log(`Found ${models.length} models in database for brand:`, brandResult.rows[0].name);
      return res.json(models);
    }
    
    // No models found in database, return empty array
    console.log('No models found in database for brand ID:', brandId);
    res.json([]);
    
  } catch (error) {
    console.error('Error fetching models by brand ID:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Create car listing (requires authentication)
router.post('/', authMiddleware, carUpload.array('images', 10), async (req, res) => {
  console.log('Received car creation request');
  console.log('Body:', req.body);
  console.log('Files:', req.files);
  
  try {
    const carData = JSON.parse(req.body.data);
    console.log('Parsed car data:', carData);
    
    const carCreate = new CarCreate();
    const result = await carCreate.create(carData, req.files, req.user.id);
    
    console.log('Car created successfully:', result);
    res.status(201).json({
      success: true,
      message: 'Car created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating car:', error);
    if (error.message.includes('validation')) {
      return res.status(400).json({ 
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      stack: error.stack 
    });
  }
});

// Add images to existing car listing (requires authentication)
router.post('/:id/images', authMiddleware, carUpload.array('images'), async (req, res) => {
  try {
    const { id } = req.params;
    const images = req.files.map(file => ({
      url: `/uploads/cars/${file.filename}`,
      thumbnail_url: `/uploads/cars/${file.filename}`,
      medium_url: `/uploads/cars/${file.filename}`,
      large_url: `/uploads/cars/${file.filename}`
    }));

    // Add images to the car
    await CarCreate.addImages(parseInt(id), images, req.user.id);

    res.status(200).json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('Error adding images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Update car listing (requires authentication)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const car = await CarCreate.update(parseInt(id), req.body, req.user.id);
    res.status(200).json({
      success: true,
      data: car
    });
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Delete car listing (requires authentication)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await CarCreate.delete(parseInt(id), req.user.id);
    res.status(200).json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;