const { GEORGIAN_CITIES, COUNTRIES } = require('../constants/locations');
const { 
  VALID_FUEL_TYPES,
  VALID_COLORS,
  VALID_INTERIOR_MATERIALS,
  VALID_INTERIOR_COLORS,
  VALID_CLEARANCE_STATUSES,
  BRAND_MODELS
} = require('./base');

class CarValidation {
  static async validateBrandAndCategory(client, brandId, categoryId, carData) {
    console.log('Validating brand_id and category_id:', { brandId, categoryId });
    
    try {
      // Convert IDs to numbers and validate
      const brandIdNum = Number(brandId);
      const categoryIdNum = Number(categoryId);

      if (isNaN(brandIdNum) || brandIdNum <= 0) {
        throw new Error(`Invalid brand_id format or value: ${brandId}`);
      }

      if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
        throw new Error(`Invalid category_id format or value: ${categoryId}`);
      }

      // Check if brand exists
      const brandResult = await client.query(
        'SELECT id, name FROM brands WHERE id = $1',
        [brandIdNum]
      );

      if (brandResult.rows.length === 0) {
        // Get all brands for better error message
        const allBrandsResult = await client.query('SELECT id, name FROM brands ORDER BY id');
        const availableBrands = allBrandsResult.rows.map(b => `${b.id}: ${b.name}`).join(', ');
        throw new Error(`Brand with ID ${brandIdNum} not found. Available brands: ${availableBrands}`);
      }

      // Check if category exists
      const categoryResult = await client.query(
        'SELECT id, name FROM categories WHERE id = $1',
        [categoryIdNum]
      );

      if (categoryResult.rows.length === 0) {
        // Get all categories for better error message
        const allCategoriesResult = await client.query('SELECT id, name FROM categories ORDER BY id');
        const availableCategories = allCategoriesResult.rows.map(c => `${c.id}: ${c.name}`).join(', ');
        throw new Error(`Category with ID ${categoryIdNum} not found. Available categories: ${availableCategories}`);
      }

      // Only check model if carData is provided and has a model property
      if (carData && carData.model) {
        // Check if model exists for brand
        const models = BRAND_MODELS[brandIdNum];
        if (models && !models.includes(carData.model)) {
          throw new Error(`Invalid model "${carData.model}" for brand ${brandResult.rows[0].name}. Available models: ${models.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      throw error;
    }
  }

  static validateSpecifications(specs) {
    console.log('Validating specifications:', specs);

    if (!specs) {
      throw new Error('Specifications object is required');
    }

    // Required fields
    const requiredFields = ['transmission', 'fuel_type', 'engine_size', 'mileage'];
    for (const field of requiredFields) {
      if (!specs[field]) {
        throw new Error(`${field} is required in specifications`);
      }
    }

    // Validate fuel type
    if (!VALID_FUEL_TYPES.includes(specs.fuel_type)) {
      console.log('Invalid fuel_type:', specs.fuel_type);
      console.log('Valid fuel types:', VALID_FUEL_TYPES);
      throw new Error(`Invalid fuel_type: "${specs.fuel_type}". Must be one of: ${VALID_FUEL_TYPES.join(', ')}`);
    }

    // Validate color if provided
    if (specs.color && !VALID_COLORS.includes(specs.color)) {
      console.log('Invalid color:', specs.color);
      console.log('Valid colors:', VALID_COLORS);
      throw new Error(`Invalid color: "${specs.color}". Must be one of: ${VALID_COLORS.join(', ')}`);
    }

    // Validate interior material if provided
    if (specs.interior_material && !VALID_INTERIOR_MATERIALS.includes(specs.interior_material)) {
      console.log('Invalid interior_material:', specs.interior_material);
      console.log('Valid interior materials:', VALID_INTERIOR_MATERIALS);
      throw new Error(`Invalid interior_material: "${specs.interior_material}". Must be one of: ${VALID_INTERIOR_MATERIALS.join(', ')}`);
    }

    // Validate interior color if provided
    if (specs.interior_color && !VALID_INTERIOR_COLORS.includes(specs.interior_color)) {
      console.log('Invalid interior_color:', specs.interior_color);
      console.log('Valid interior colors:', VALID_INTERIOR_COLORS);
      throw new Error(`Invalid interior_color: "${specs.interior_color}". Must be one of: ${VALID_INTERIOR_COLORS.join(', ')}`);
    }

    // Validate numeric fields
    const numericFields = {
      engine_size: { min: 0, max: 10000 },
      mileage: { min: 0, max: 1000000 },
      cylinders: { min: 0, max: 16 },
      airbags_count: { min: 0, max: 12 }
    };

    for (const [field, range] of Object.entries(numericFields)) {
      if (specs[field]) {
        const value = Number(specs[field]);
        if (isNaN(value) || value < range.min || value > range.max) {
          throw new Error(`Invalid ${field}: Must be a number between ${range.min} and ${range.max}`);
        }
      }
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (specs.year) {
      const year = Number(specs.year);
      if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        throw new Error(`Invalid year: Must be between 1900 and ${currentYear + 1}`);
      }
    }
  }

  static validateLocation(location) {
    console.log('Validating location:', location);

    // If location is completely missing, create a default one
    if (!location) {
      console.log('Warning: Location object is missing, using default values');
      return {
        location_type: 'georgia',
        is_transit: false,
        city: 'თბილისი',
        state: null,
        country: 'საქართველო'
      };
    }

    // Ensure we have a location_type
    const locationType = location.location_type || 'georgia';
    
    // Handle transit case
    if (location.is_transit === true) {
      return {
        location_type: 'transit',
        is_transit: true,
        city: location.city || 'თბილისი',
        state: location.state || null,
        country: location.country || 'საქართველო'
      };
    }

    // For non-transit locations, default to თბილისი, საქართველო if not specified
    const city = location.city || 'თბილისი';
    const country = location.country || 'საქართველო';
    
    // If location_type is georgia, validate city (but with default fallback)
    if (locationType === 'georgia' && city !== 'თბილისი' && !GEORGIAN_CITIES.includes(city)) {
      console.log(`Warning: Invalid Georgian city: "${city}", falling back to თბილისი`);
      return {
        location_type: locationType,
        is_transit: false,
        city: 'თბილისი',
        state: location.state || null,
        country: 'საქართველო'
      };
    }

    // Return the validated location
    return {
      location_type: locationType,
      is_transit: Boolean(location.is_transit),
      city: city,
      state: location.state || null,
      country: country
    };
  }

  static async validateOwnership(client, carId, sellerId) {
    const carCheck = await client.query(
      'SELECT seller_id FROM cars WHERE id = $1',
      [carId]
    );
    
    // Check if user is authorized to modify this car
    if (carCheck.rows[0].seller_id !== sellerId) {
      throw new Error('Unauthorized to modify this car');
    }
  }
}

module.exports = CarValidation;