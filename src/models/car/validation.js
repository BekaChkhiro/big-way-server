const { GEORGIAN_CITIES, COUNTRIES } = require('../constants/locations');
const { 
  VALID_FUEL_TYPES,
  VALID_COLORS,
  VALID_INTERIOR_MATERIALS,
  VALID_INTERIOR_COLORS,
  VALID_CLEARANCE_STATUSES
} = require('./base');

class CarValidation {
  static async validateBrandAndCategory(client, brandId, categoryId) {
    const brandResult = await client.query(
      'SELECT id FROM brands WHERE id = $1',
      [brandId]
    );
    if (brandResult.rows.length === 0) {
      throw new Error('Invalid brand_id: Brand does not exist');
    }

    const categoryResult = await client.query(
      'SELECT id FROM categories WHERE id = $1',
      [categoryId]
    );
    if (categoryResult.rows.length === 0) {
      throw new Error('Invalid category_id: Category does not exist');
    }
  }

  static validateSpecifications(specs) {
    if (specs.fuel_type && !VALID_FUEL_TYPES.includes(specs.fuel_type)) {
      throw new Error('Invalid fuel_type: Must be one of: ' + VALID_FUEL_TYPES.join(', '));
    }

    if (specs.color && !VALID_COLORS.includes(specs.color)) {
      throw new Error('Invalid color: Must be one of: ' + VALID_COLORS.join(', '));
    }

    if (specs.interior_material && !VALID_INTERIOR_MATERIALS.includes(specs.interior_material)) {
      throw new Error('Invalid interior_material: Must be one of: ' + VALID_INTERIOR_MATERIALS.join(', '));
    }

    if (specs.interior_color && !VALID_INTERIOR_COLORS.includes(specs.interior_color)) {
      throw new Error('Invalid interior_color: Must be one of: ' + VALID_INTERIOR_COLORS.join(', '));
    }

    if (specs.clearance_status && !VALID_CLEARANCE_STATUSES.includes(specs.clearance_status)) {
      throw new Error('Invalid clearance_status: Must be one of: ' + VALID_CLEARANCE_STATUSES.join(', '));
    }
  }

  static validateLocation(location) {
    if (!location.city) {
      throw new Error('City is required');
    }

    if (location.is_transit) {
      return {
        location_type: 'transit',
        is_transit: true,
        city: location.city,
        state: null,
        country: null
      };
    }

    if (GEORGIAN_CITIES.includes(location.city)) {
      return {
        location_type: 'georgia',
        is_transit: false,
        city: location.city,
        state: null,
        country: null
      };
    }

    if (!location.state || !location.country) {
      throw new Error('State and country are required for international locations');
    }

    if (!COUNTRIES.includes(location.country)) {
      throw new Error('Invalid country: Must be one of: ' + COUNTRIES.join(', '));
    }

    return {
      location_type: 'international',
      is_transit: false,
      city: location.city,
      state: location.state,
      country: location.country
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