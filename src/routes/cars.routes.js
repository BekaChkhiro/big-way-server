const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const CarCreate = require('../models/car/create');
const CarUpdate = require('../models/car/update');
const pool = require('../../config/db.config');
const { BRAND_MODELS } = require('../models/car/base');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload, processAndUpload, setCacheHeaders } = require('../middlewares/upload.middleware');

// Use the upload middleware configured for AWS S3
const carUpload = upload;

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
        const modelsQuery = 'SELECT name FROM car_models WHERE brand_id = $1 ORDER BY name';
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
        'audi': ['A1', 'A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'e-tron', 'RS6', 'TT'],
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
    const modelsQuery = 'SELECT name FROM car_models WHERE brand_id = $1 ORDER BY name';
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
      'audi': ['A1', 'A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'e-tron', 'RS6', 'TT'],
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
    
    console.log('GET /brands/id/:brandId/models - Request received with params:', req.params);
    console.log('Parsed brandId:', brandId);
    
    // Set CORS headers for debugging
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    
    if (isNaN(brandId)) {
      console.log('Invalid brand ID format:', req.params.brandId);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid brand ID format'
      });
    }
    
    console.log('Requested models for brand ID:', brandId);
    
    // First check if brand exists
    const brandQuery = 'SELECT * FROM brands WHERE id = $1';
    const brandResult = await pool.query(brandQuery, [brandId]);
    console.log('Brand query result:', brandResult.rows);
    
    if (brandResult.rows.length === 0) {
      console.log(`Brand with ID ${brandId} not found in database`);
      
      // Fallback to hardcoded models if brand not in DB
      const fallbackModels = [
        'Model A', 'Model B', 'Model C', 'Model X', 'Model Y', 'Other'
      ];
      console.log('Returning fallback models:', fallbackModels);
      return res.json(fallbackModels);
    }
    
    console.log('Found brand in database:', brandResult.rows[0]);
    
    // Get models from the database
    const modelsQuery = 'SELECT name FROM car_models WHERE brand_id = $1 ORDER BY name';
    const modelsResult = await pool.query(modelsQuery, [brandId]);
    console.log('Models query result:', modelsResult.rows);
    
    if (modelsResult.rows.length > 0) {
      const models = modelsResult.rows.map(row => row.name);
      console.log(`Found ${models.length} models in database for brand:`, brandResult.rows[0].name);
      console.log('Returning models from database:', models);
      return res.json(models);
    }
    
    // No models found in database, return fallback models for this specific brand
    console.log('No models found in database for brand ID:', brandId);
    const brandName = brandResult.rows[0].name.toLowerCase();
    
    // Enhanced fallback with more comprehensive options
    const brandModels = {
      'toyota': ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Prius'],
      'honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V'],
      'ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge'],
      'bmw': ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7'],
      'mercedes': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE']
    };
    
    // Try a fuzzy match to find models
    for (const [brand, models] of Object.entries(brandModels)) {
      if (brandName.includes(brand) || brand.includes(brandName)) {
        console.log(`Found fallback models for brand "${brandName}" using match with "${brand}"`);
        console.log('Returning fallback models:', models);
        return res.json(models);
      }
    }
    
    // Default fallback if no match was found
    const defaultModels = ['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Wagon', 'Other'];
    console.log('No brand match found, returning default models:', defaultModels);
    return res.json(defaultModels);
    
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
    console.log('VIN code in received data:', carData.vin_code);
    
    // Process and upload images to AWS S3
    let processedImages = [];
    if (req.files && req.files.length > 0) {
      try {
        processedImages = await processAndUpload(req.files);
        console.log('Images processed and uploaded to S3:', processedImages);
      } catch (uploadError) {
        console.error('Error uploading images to S3:', uploadError);
        // No fallback to local storage - S3 is required
        return res.status(500).json({
          success: false,
          error: 'Image upload failed. S3 storage is required.',
          details: uploadError.message
        });
      }
    }
    
    // CarCreate is already instantiated when imported (it exports an instance, not a class)
    const result = await CarCreate.create(carData, req.files, req.user.id, processedImages);
    
    console.log('Car created successfully:', result);
    res.status(201).json({
      success: true,
      message: 'Car created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating car:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
    
    // Process and upload images to AWS S3
    let images = [];
    try {
      const processedImages = await processAndUpload(req.files);
      console.log('Images processed and uploaded to S3:', processedImages);
      
      // Format the images for database storage
      images = processedImages.map(img => ({
        url: img.original,
        thumbnail_url: img.thumbnail,
        medium_url: img.medium,
        large_url: img.large
      }));
    } catch (uploadError) {
      console.error('Error uploading images to S3:', uploadError);
      // No fallback to local storage - S3 is required
      return res.status(500).json({
        success: false,
        error: 'Image upload failed. S3 storage is required.'
      });
    }

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
router.put('/:id', authMiddleware, carUpload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    
    // დებაგის ინფორმაცია
    console.log('მანქანის განახლების მოთხოვნა:');
    console.log('მანქანის ID:', id);
    console.log('მომხმარებლის ID:', req.user.id);
    console.log('მოთხოვნის სხეული:', JSON.stringify(req.body, null, 2));
    
    // Parse JSON stringified fields from FormData
    const updateData = { ...req.body };
    
    // Parse specifications if it's a string
    if (typeof updateData.specifications === 'string') {
      try {
        updateData.specifications = JSON.parse(updateData.specifications);
      } catch (e) {
        console.error('Error parsing specifications:', e);
      }
    }
    
    // Parse location if it's a string
    if (typeof updateData.location === 'string') {
      try {
        updateData.location = JSON.parse(updateData.location);
      } catch (e) {
        console.error('Error parsing location:', e);
      }
    }
    
    // Parse features if it's a string
    if (typeof updateData.features === 'string') {
      try {
        updateData.features = JSON.parse(updateData.features);
      } catch (e) {
        console.error('Error parsing features:', e);
      }
    }
    
    console.log('პარსირებული მონაცემები:', JSON.stringify(updateData, null, 2));
    console.log('ავტორის ინფორმაცია:', {
      author_name: updateData.author_name,
      author_phone: updateData.author_phone
    });
    
    const car = await CarUpdate.update(parseInt(id), updateData, req.user.id);
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
    await CarUpdate.delete(parseInt(id), req.user.id);
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

// Get all cars (used by admin section)
router.get('/', async (req, res) => {
  try {
    // Extract filter parameters from request query
    const {
      brand_id,
      model,
      category,
      yearFrom,
      yearTo,
      priceFrom,
      priceTo,
      engineSizeFrom,
      engineSizeTo,
      cylinders,
      mileageFrom,
      mileageTo,
      transmission,
      fuelType,
      driveType,
      steeringWheel,
      color,
      interiorMaterial,
      interiorColor,
      airbags,
      location,
      sortBy = 'created_at',
      order = 'DESC',
      page = 1,
      limit = 12
    } = req.query;

    // Log the filter parameters
    console.log('Fetching cars with filters:', JSON.stringify(req.query));
    
    // Build the query with filters
    let queryParams = [];
    let conditions = [];
    let paramIndex = 1;
    
    // Helper function to add filter condition
    const addFilter = (column, value, operator = '=') => {
      if (value !== undefined && value !== '') {
        conditions.push(`${column} ${operator} $${paramIndex}`);
        queryParams.push(value);
        paramIndex++;
      }
    };
    
    // Add all filter conditions
    if (brand_id) {
      addFilter('c.brand_id', brand_id);
    }
    
    if (model) {
      addFilter('LOWER(c.model)', model.toLowerCase(), 'LIKE');
    }
    
    if (category) {
      addFilter('c.category_id', category);
    }
    
    if (yearFrom) {
      addFilter('c.year', yearFrom, '>=');
    }
    
    if (yearTo) {
      addFilter('c.year', yearTo, '<=');
    }
    
    if (priceFrom) {
      addFilter('c.price', priceFrom, '>=');
    }
    
    if (priceTo) {
      addFilter('c.price', priceTo, '<=');
    }
    
    if (engineSizeFrom) {
      addFilter('spec.engine_size', engineSizeFrom, '>=');
    }
    
    if (engineSizeTo) {
      addFilter('spec.engine_size', engineSizeTo, '<=');
    }
    
    if (cylinders) {
      addFilter('spec.cylinders', cylinders);
    }
    
    if (mileageFrom) {
      addFilter('spec.mileage', mileageFrom, '>=');
    }
    
    if (mileageTo) {
      addFilter('spec.mileage', mileageTo, '<=');
    }
    
    if (transmission) {
      addFilter('LOWER(spec.transmission)', transmission.toLowerCase(), 'LIKE');
    }
    
    if (fuelType) {
      addFilter('LOWER(spec.fuel_type)', fuelType.toLowerCase(), 'LIKE');
    }
    
    if (driveType) {
      addFilter('LOWER(spec.drive_type)', driveType.toLowerCase(), 'LIKE');
    }
    
    if (steeringWheel) {
      addFilter('LOWER(spec.steering_wheel)', steeringWheel.toLowerCase(), 'LIKE');
    }
    
    if (color) {
      addFilter('LOWER(spec.color)', color.toLowerCase(), 'LIKE');
    }
    
    if (interiorMaterial) {
      addFilter('LOWER(spec.interior_material)', interiorMaterial.toLowerCase(), 'LIKE');
    }
    
    if (interiorColor) {
      addFilter('LOWER(spec.interior_color)', interiorColor.toLowerCase(), 'LIKE');
    }
    
    if (airbags) {
      addFilter('spec.airbags_count', airbags);
    }
    
    if (location) {
      addFilter('LOWER(loc.city)', location.toLowerCase(), 'LIKE');
    }
    
    // Always include the status = 'available' condition
    conditions.push(`c.status = 'available'`);
    
    // Build the WHERE clause
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    
    // Validate sortBy to prevent SQL injection
    const validSortColumns = [
      'c.created_at', 'c.price', 'c.year', 'spec.mileage'
    ];
    
    // Map frontend sort keys to database columns
    const sortMap = {
      'created_at': 'c.created_at',
      'price': 'c.price',
      'year': 'c.year',
      'mileage': 'spec.mileage'
    };
    
    // Set default sort if not valid
    const sortColumn = sortMap[sortBy] || 'c.created_at';
    
    // Ensure order is either ASC or DESC
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Create count query to get total number of results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM cars c
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.seller_id = u.id
      LEFT JOIN locations loc ON c.location_id = loc.id
      LEFT JOIN specifications spec ON c.specification_id = spec.id
      ${whereClause}
    `;
    
    // Create main query with sorting and pagination
    const query = `
      SELECT c.*, 
        b.name as brand_name, 
        cat.name as category_name,
        u.id as seller_id,
        loc.city, loc.country,
        c.author_name, c.author_phone,
        spec.engine_type, spec.transmission, spec.fuel_type, spec.mileage, 
        spec.engine_size, spec.steering_wheel, spec.cylinders, spec.airbags_count,
        spec.drive_type, spec.interior_material, spec.interior_color, spec.color
      FROM cars c
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.seller_id = u.id
      LEFT JOIN locations loc ON c.location_id = loc.id
      LEFT JOIN specifications spec ON c.specification_id = spec.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    // Execute count query to get total results
    const countResult = await pool.query(countQuery, queryParams);
    const totalCars = parseInt(countResult.rows[0].total);
    
    // Execute main query to get paginated results
    const result = await pool.query(query, queryParams);
    
    // Get images for each car
    const cars = await Promise.all(result.rows.map(async (car) => {
      const imagesQuery = 'SELECT * FROM car_images WHERE car_id = $1';
      const imagesResult = await pool.query(imagesQuery, [car.id]);
      
      // Properly structure the car object with nested specifications
      return {
        id: car.id,
        brand: car.brand_name,
        model: car.model,
        title: car.title, // დავამატეთ title ველი
        year: car.year,
        price: car.price,
        seller_id: car.seller_id,
        author_name: car.author_name,
        author_phone: car.author_phone,
        description_ka: car.description_ka,
        description_en: car.description_en,
        description_ru: car.description_ru,
        status: car.status,
        featured: car.featured,
        created_at: car.created_at,
        updated_at: car.updated_at,
        category_id: car.category_id, // დავამატეთ category_id ველი
        category_name: car.category_name, // დავამატეთ category_name ველი
        // Create a properly nested specifications object
        specifications: {
          engine_type: car.engine_type,
          transmission: car.transmission,
          fuel_type: car.fuel_type,
          mileage: car.mileage || 0, // Ensure mileage is never undefined
          engine_size: car.engine_size,

          steering_wheel: car.steering_wheel,
          drive_type: car.drive_type,
          interior_material: car.interior_material,
          interior_color: car.interior_color
        },
        // Create a properly nested location object
        location: {
          city: car.city,
          country: car.country
        },
        // Format images to match the expected structure
        images: imagesResult.rows.map(img => ({
          id: img.id,
          url: img.image_url || img.url,
          thumbnail_url: img.thumbnail_url,
          medium_url: img.medium_url,
          large_url: img.large_url
        }))
      };
    }));
    
    console.log(`Found ${cars.length} cars, with total of ${totalCars} matching filter criteria.`);
    
    // Return both cars and pagination metadata
    res.json({
      data: cars,
      meta: {
        total: totalCars,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCars / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all cars:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Get cars for the authenticated user
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching cars for user ID:', userId);
    
    // Query to get all cars belonging to the authenticated user
    const query = `
      SELECT c.*, 
        b.name as brand_name, 
        cat.name as category_name,
        loc.city, loc.country,
        spec.engine_type, spec.transmission, spec.fuel_type, spec.mileage, 
        spec.engine_size, spec.steering_wheel, 
        spec.drive_type, spec.interior_material, spec.interior_color,
        c.vip_status, c.vip_expiration_date
      FROM cars c
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN locations loc ON c.location_id = loc.id
      LEFT JOIN specifications spec ON c.specification_id = spec.id
      WHERE c.seller_id = $1
      ORDER BY c.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    // Get images for each car
    const cars = await Promise.all(result.rows.map(async (car) => {
      const imagesQuery = 'SELECT * FROM car_images WHERE car_id = $1';
      const imagesResult = await pool.query(imagesQuery, [car.id]);
      
      // Properly structure the car object with nested specifications
      return {
        id: car.id,
        brand: car.brand_name,
        model: car.model,
        title: car.title, // დავამატეთ title ველი
        year: car.year,
        price: car.price,
        description_ka: car.description_ka,
        description_en: car.description_en,
        description_ru: car.description_ru,
        status: car.status,
        featured: car.featured,
        vip_status: car.vip_status || 'none',
        vip_expiration_date: car.vip_expiration_date,
        created_at: car.created_at,
        updated_at: car.updated_at,
        category_id: car.category_id, // დავამატეთ category_id ველი
        category_name: car.category_name, // დავამატეთ category_name ველი
        // Create a properly nested specifications object
        specifications: {
          engine_type: car.engine_type,
          transmission: car.transmission,
          fuel_type: car.fuel_type,
          mileage: car.mileage || 0, // Ensure mileage is never undefined
          engine_size: car.engine_size,

          steering_wheel: car.steering_wheel,
          drive_type: car.drive_type,
          interior_material: car.interior_material,
          interior_color: car.interior_color
        },
        // Create a properly nested location object
        location: {
          city: car.city,
          country: car.country
        },
        // Format images to match the expected structure
        images: imagesResult.rows.map(img => ({
          id: img.id,
          url: img.image_url || img.url,
          thumbnail_url: img.thumbnail_url,
          medium_url: img.medium_url,
          large_url: img.large_url
        }))
      };
    }));
    
    console.log(`Found ${cars.length} cars for user ID ${userId}`);
    res.json(cars);
  } catch (error) {
    console.error('Error fetching user cars:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Get user's favorite cars
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching favorites for user ID:', req.user.id);

    // Import WishlistModel if not already imported
    const WishlistModel = require('../models/wishlist.model');
    
    // Get the user's wishlist
    const wishlistItems = await WishlistModel.findUserWishlist(req.user.id);
    console.log(`Found ${wishlistItems.length} wishlist items for user ${req.user.id}`);

    // Return the wishlist items as cars
    res.json(wishlistItems);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Get a single car by ID
router.get('/:id', async (req, res) => {
  try {
    const carId = req.params.id;
    console.log('Fetching car with ID:', carId);
    
    // Query to get a single car with its related data
    const carQuery = `
      SELECT 
        c.*,
        b.name as brand,
        cat.name as category,
        l.city, l.country,
        s.*,
        c.author_name, 
        c.author_phone
      FROM cars c
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN locations l ON c.location_id = l.id
      LEFT JOIN specifications s ON c.specification_id = s.id
      WHERE c.id = $1
    `;
    
    const carResult = await pool.query(carQuery, [carId]);
    
    if (carResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Car with ID ${carId} not found`
      });
    }
    
    const car = carResult.rows[0];
    
    // Get car images
    const imagesQuery = 'SELECT * FROM car_images WHERE car_id = $1';
    const imagesResult = await pool.query(imagesQuery, [carId]);
    
    // დებაგ ლოგები
    console.log('Car details from database:', car);
    console.log('Category ID from database:', car.category_id);
    console.log('Category name from database:', car.category);
    
    // Debug logs for specification values
    console.log('Feature flags from database:');
    console.log('has_board_computer:', car.has_board_computer);
    console.log('has_air_conditioning:', car.has_air_conditioning);
    console.log('has_parking_control:', car.has_parking_control);
    console.log('has_rear_view_camera:', car.has_rear_view_camera);
    console.log('has_electric_windows:', car.has_electric_windows);
    console.log('has_climate_control:', car.has_climate_control);
    console.log('has_cruise_control:', car.has_cruise_control);
    console.log('has_start_stop:', car.has_start_stop);
    console.log('has_sunroof:', car.has_sunroof);
    console.log('has_heated_seats:', car.has_heated_seats);
    console.log('has_abs:', car.has_abs);
    console.log('has_traction_control:', car.has_traction_control);
    console.log('has_central_locking:', car.has_central_locking);
    console.log('has_alarm:', car.has_alarm);
    console.log('has_fog_lights:', car.has_fog_lights);
    console.log('has_navigation:', car.has_navigation);
    console.log('has_bluetooth:', car.has_bluetooth);
    console.log('has_multifunction_steering_wheel:', car.has_multifunction_steering_wheel);
    
    // Format the car data with nested objects
    const formattedCar = {
      id: car.id,
      brand_id: car.brand_id,
      category_id: car.category_id,
      brand: car.brand,
      model: car.model,
      title: car.title, // დავამატეთ title ველი
      year: car.year,
      price: car.price,
      description_ka: car.description_ka,
      description_en: car.description_en,
      description_ru: car.description_ru,
      status: car.status,
      author_name: car.author_name,
      author_phone: car.author_phone,
      featured: car.featured,
      seller_id: car.seller_id,
      created_at: car.created_at,
      updated_at: car.updated_at,
      category_name: car.category, // დავამატეთ category_name ველი, რომელიც იყენებს car.category ღირებულებას
      vin_code: car.vin_code, // Add VIN code to the response
      // Create a properly nested specifications object
      specifications: {
        id: car.id,
        engine_type: car.engine_type,
        transmission: car.transmission,
        fuel_type: car.fuel_type,
        mileage: car.mileage || 0,
        mileage_unit: car.mileage_unit || 'km',
        engine_size: car.engine_size,
        horsepower: car.horsepower,
        is_turbo: Boolean(car.is_turbo),
        cylinders: car.cylinders,
        manufacture_month: car.manufacture_month,
        color: car.color,
        body_type: car.body_type,
        steering_wheel: car.steering_wheel,
        drive_type: car.drive_type,
        has_catalyst: Boolean(car.has_catalyst),
        airbags_count: car.airbags_count,
        interior_material: car.interior_material,
        interior_color: car.interior_color,
        doors: car.doors,
        has_hydraulics: Boolean(car.has_hydraulics),
        has_board_computer: Boolean(car.has_board_computer),
        has_air_conditioning: Boolean(car.has_air_conditioning),
        has_parking_control: Boolean(car.has_parking_control),
        has_rear_view_camera: Boolean(car.has_rear_view_camera),
        has_electric_windows: Boolean(car.has_electric_windows),
        has_climate_control: Boolean(car.has_climate_control),
        has_cruise_control: Boolean(car.has_cruise_control),
        has_start_stop: Boolean(car.has_start_stop),
        has_sunroof: Boolean(car.has_sunroof),
        has_heated_seats: Boolean(car.has_heated_seats),
        has_seat_memory: Boolean(car.has_seat_memory),
        has_abs: Boolean(car.has_abs),
        has_traction_control: Boolean(car.has_traction_control),
        has_central_locking: Boolean(car.has_central_locking),
        has_alarm: Boolean(car.has_alarm),
        has_fog_lights: Boolean(car.has_fog_lights),
        has_navigation: Boolean(car.has_navigation),
        has_aux: Boolean(car.has_aux),
        has_bluetooth: Boolean(car.has_bluetooth),
        has_multifunction_steering_wheel: Boolean(car.has_multifunction_steering_wheel),
        has_alloy_wheels: Boolean(car.has_alloy_wheels),
        has_spare_tire: Boolean(car.has_spare_tire),
        is_disability_adapted: Boolean(car.is_disability_adapted),
        is_cleared: Boolean(car.is_cleared),
        has_technical_inspection: Boolean(car.has_technical_inspection),
        // Include legacy fields for compatibility with frontend
        has_leather_interior: car.interior_material === 'ტყავი' ? true : false,
        clearance_status: car.clearance_status || 'not_cleared'
      },
      // Create a properly nested location object
      location: {
        id: car.location_id,
        city: car.city,
        country: car.country
      },
      // Format images to match the expected structure
      images: imagesResult.rows.map(img => ({
        id: img.id,
        car_id: img.car_id,
        url: img.image_url || img.url,
        thumbnail_url: img.thumbnail_url,
        medium_url: img.medium_url,
        large_url: img.large_url,
        is_primary: img.is_primary
      }))
    };
    
    console.log(`Successfully retrieved car with ID ${carId}`);
    res.json(formattedCar);
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

module.exports = router;