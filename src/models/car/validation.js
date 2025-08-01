const { GEORGIAN_CITIES, COUNTRIES } = require('../constants/locations');
const { 
  VALID_FUEL_TYPES,
  VALID_COLORS,
  VALID_INTERIOR_MATERIALS,
  VALID_INTERIOR_COLORS,
  VALID_CLEARANCE_STATUSES,
  BRAND_MODELS
} = require('./base');

// VIN validation utility function
function validateVIN(vin) {
  if (!vin) return true; // VIN is optional
  
  // Remove spaces and convert to uppercase
  const cleanVIN = vin.replace(/\s/g, '').toUpperCase();
  
  // Check if VIN is exactly 17 characters
  if (cleanVIN.length !== 17) {
    return false;
  }
  
  // Check if VIN contains only valid characters (no I, O, Q)
  const vinPattern = /^[ABCDEFGHJKLMNPRSTUVWXYZ0-9]{17}$/;
  if (!vinPattern.test(cleanVIN)) {
    return false;
  }
  
  // Simple check digit validation for position 9
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  const values = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  };
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    if (i !== 8) { // Skip check digit position
      sum += (values[cleanVIN[i]] || 0) * weights[i];
    }
  }
  
  const checkDigit = sum % 11;
  const expectedChar = checkDigit === 10 ? 'X' : checkDigit.toString();
  
  return cleanVIN[8] === expectedChar;
}

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

      // Log the model but don't validate against a predefined list
      if (carData && carData.model) {
        console.log(`Model provided: "${carData.model}" for brand ${brandResult.rows[0].name}`);
        // No validation against predefined models - allow any model
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

    // For updates, we don't require all fields to be present
    // Only validate the fields that are provided
    
    // Log the fuel type but don't validate against a predefined list
    if (specs.fuel_type) {
      console.log('Fuel type provided:', specs.fuel_type);
      // No validation against predefined fuel types - allow any value
    }

    // Log the color but don't validate against a predefined list
    if (specs.color) {
      console.log('Color provided:', specs.color);
      // No validation against predefined colors - allow any value
    }

    // Log the interior material but don't validate against a predefined list
    if (specs.interior_material) {
      console.log('Interior material provided:', specs.interior_material);
      // No validation against predefined materials - allow any value
    }

    // Log the interior color but don't validate against a predefined list
    if (specs.interior_color) {
      console.log('Interior color provided:', specs.interior_color);
      // No validation against predefined colors - allow any value
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
        is_in_transit: false,
        city: 'თბილისი',
        country: 'საქართველო'
      };
    }

    // Ensure we have a location_type
    const locationType = location.location_type || 'georgia';
    
    // Handle transit case
    if (location.is_in_transit === true) {
      return {
        location_type: 'transit',
        is_in_transit: true,
        city: location.city || 'თბილისი',
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
        is_in_transit: false,
        city: 'თბილისი',
        country: 'საქართველო'
      };
    }

    // Return the validated location
    return {
      location_type: locationType,
      is_in_transit: Boolean(location.is_in_transit),
      city: city,
      country: country
    };
  }

  static async validateOwnership(client, carId, sellerId) {
    const carCheck = await client.query(
      'SELECT seller_id FROM cars WHERE id = $1',
      [carId]
    );
    
    // Check if car exists
    if (carCheck.rows.length === 0) {
      throw new Error('Car not found');
    }
    
    // Check if user is authorized to modify this car
    if (carCheck.rows[0].seller_id !== sellerId) {
      throw new Error('Unauthorized to modify this car');
    }
  }

  static validateCarData(carData) {
    console.log('Validating car data:', carData);

    // Validate VIN code if provided
    if (carData.vin_code && carData.vin_code.trim()) {
      if (!validateVIN(carData.vin_code)) {
        throw new Error('Invalid VIN code format. VIN must be exactly 17 characters long and follow standard format');
      }
    }

    // Validate other car data
    if (carData.year) {
      const currentYear = new Date().getFullYear();
      const year = Number(carData.year);
      if (isNaN(year) || year < 1900 || year > currentYear + 1) {
        throw new Error(`Invalid year: Must be between 1900 and ${currentYear + 1}`);
      }
    }

    if (carData.price) {
      const price = Number(carData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error('Invalid price: Must be a positive number');
      }
    }

    return true;
  }

  static validateVIN(vin) {
    return validateVIN(vin);
  }
}

module.exports = CarValidation;