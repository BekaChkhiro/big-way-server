const { VALID_CONDITIONS } = require('./base');

class PartValidation {
  static async validateBrandAndCategory(client, brandId, categoryId, partData) {
    // Check if brand exists
    const brandResult = await client.query('SELECT * FROM brands WHERE id = $1', [brandId]);
    if (brandResult.rows.length === 0) {
      throw new Error(`Brand with ID ${brandId} not found`);
    }

    // Check if category exists
    const categoryResult = await client.query('SELECT * FROM categories WHERE id = $1', [categoryId]);
    if (categoryResult.rows.length === 0) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }
  }

  static async validateModel(client, brandId, modelId) {
    // Check if model exists and belongs to the specified brand
    const modelResult = await client.query(
      'SELECT * FROM car_models WHERE id = $1 AND brand_id = $2',
      [modelId, brandId]
    );

    if (modelResult.rows.length === 0) {
      throw new Error(`Model with ID ${modelId} not found for brand ID ${brandId}`);
    }
  }

  static validateCondition(condition) {
    if (!VALID_CONDITIONS.includes(condition)) {
      throw new Error(`Invalid condition: ${condition}. Valid values are: ${VALID_CONDITIONS.join(', ')}`);
    }
  }

  static validatePartData(partData) {
    console.log('Validating part data:', JSON.stringify(partData, null, 2));
    
    if (!partData) {
      console.error('PartData is undefined or null');
      throw new Error('Part data is required');
    }
    
    // Check required fields
    const requiredFields = ['title', 'category_id', 'brand_id', 'model_id', 'condition', 'price'];
    const missingFields = requiredFields.filter(field => {
      const missing = partData[field] === undefined || partData[field] === null || partData[field] === '';
      if (missing) {
        console.error(`Field ${field} is missing or empty: ${partData[field]}`);
      }
      return missing;
    });

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate price
    console.log(`Price validation: ${partData.price}, type: ${typeof partData.price}`);
    if (isNaN(partData.price) || parseFloat(partData.price) <= 0) {
      throw new Error('Price must be a positive number');
    }

    // Title length validation
    console.log(`Title validation: ${partData.title}, length: ${partData.title.length}`);
    if (partData.title.length < 3 || partData.title.length > 255) {
      throw new Error('Title must be between 3 and 255 characters');
    }
    
    console.log('Part data validation successful');
  }
}

module.exports = PartValidation;
