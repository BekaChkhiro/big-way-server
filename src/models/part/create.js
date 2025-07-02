const pool = require('../../../config/db.config');
const PartValidation = require('./validation');
const path = require('path');
const fs = require('fs').promises;

class PartCreate {
  async create(partData, images, sellerId, processedImages = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('Creating part with data:', JSON.stringify(partData, null, 2));

      // Ensure numeric fields are actually numbers
      partData.category_id = parseInt(partData.category_id, 10);
      partData.brand_id = parseInt(partData.brand_id, 10);
      partData.model_id = parseInt(partData.model_id, 10);
      partData.price = parseFloat(partData.price);
      
      console.log('Part data after conversion:', {
        category_id: partData.category_id, 
        brand_id: partData.brand_id, 
        model_id: partData.model_id,
        price: partData.price
      });
      
      // Validate all part data first
      PartValidation.validatePartData(partData);

      // Validate brand and category
      await PartValidation.validateBrandAndCategory(client, partData.brand_id, partData.category_id, partData);
      
      // Validate model
      await PartValidation.validateModel(client, partData.brand_id, partData.model_id);
      
      // Validate part condition
      PartValidation.validateCondition(partData.condition);

      // Insert the part
      const insertPartQuery = `
        INSERT INTO parts(title, category_id, brand_id, model_id, condition, price, description, description_en, description_ka, seller_id)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const partValues = [
        partData.title,
        partData.category_id,
        partData.brand_id,
        partData.model_id,
        partData.condition,
        partData.price,
        partData.description || '',
        partData.description_en || '',
        partData.description_ka || '',
        sellerId
      ];

      const partResult = await client.query(insertPartQuery, partValues);
      const part = partResult.rows[0];

      // Upload and process images
      if (processedImages && processedImages.length > 0) {
        console.log(`Saving ${processedImages.length} processed images to database for part ${part.id}`);
        await this.handleImageUploads(client, [], part.id, processedImages);
      } else {
        console.log('No images to save for part', part.id);
      }

      await client.query('COMMIT');
      return await this.getPartWithDetails(part.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async handleImageUploads(client, images, partId, processedImages) {
    // If we already have processed images, just save them to DB
    if (processedImages.length > 0) {
      const promises = processedImages.map((image) => {
        // Use the is_primary flag that was set in the controller
        return this.saveImageToDatabase(client, partId, image, image.is_primary);
      });
      await Promise.all(promises);
      return;
    }

    // Otherwise, process the uploaded images
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const isPrimary = i === 0; // First image is primary
      
      // Upload image to your storage (this would depend on your storage setup)
      // For now, we'll just save the path
      const imageUrl = `/uploads/parts/${partId}/${image.filename}`;
      const thumbnailUrl = `/uploads/parts/${partId}/thumbnails/${image.filename}`;
      const mediumUrl = `/uploads/parts/${partId}/medium/${image.filename}`;
      const largeUrl = `/uploads/parts/${partId}/large/${image.filename}`;
      
      // Create the processed image object
      const processedImage = {
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        medium_url: mediumUrl,
        large_url: largeUrl
      };
      
      // Save to database
      await this.saveImageToDatabase(client, partId, processedImage, isPrimary);
    }
  }

  async saveImageToDatabase(client, partId, image, isPrimary) {
    console.log(`Saving image for part ${partId}, isPrimary: ${isPrimary}`);
    console.log('Image data:', JSON.stringify(image));
    
    // If this is a primary image, first reset all other images to non-primary
    if (isPrimary) {
      const resetPrimaryQuery = `
        UPDATE part_images 
        SET is_primary = false 
        WHERE part_id = $1
      `;
      await client.query(resetPrimaryQuery, [partId]);
      console.log(`Reset primary status for all images of part ${partId}`);
    }
    
    const insertImageQuery = `
      INSERT INTO part_images(part_id, image_url, thumbnail_url, medium_url, large_url, is_primary)
      VALUES($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const imageResult = await client.query(insertImageQuery, [
      partId,
      image.image_url,
      image.thumbnail_url,
      image.medium_url,
      image.large_url,
      isPrimary
    ]);
    
    console.log(`Image saved successfully for part ${partId}, id: ${imageResult.rows[0].id}`);
    return imageResult.rows[0];
  }

  async getPartWithDetails(partId) {
    const query = `
      SELECT 
        p.*,
        b.name as brand,
        cat.name as category,
        cm.name as model,
        u.first_name,
        u.last_name,
        u.phone,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', pi.id,
              'part_id', pi.part_id,
              'url', pi.image_url,
              'thumbnail_url', pi.thumbnail_url,
              'medium_url', pi.medium_url,
              'large_url', pi.large_url,
              'is_primary', pi.is_primary
            )
          ) FROM part_images pi WHERE pi.part_id = p.id),
          '[]'
        ) as images
      FROM parts p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN part_categories cat ON p.category_id = cat.id
      LEFT JOIN car_models cm ON p.model_id = cm.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.id = $1
      GROUP BY p.id, b.name, cat.name, cm.name, u.first_name, u.last_name, u.phone
    `;
    
    const result = await pool.query(query, [partId]);
    return result.rows[0];
  }
}

module.exports = new PartCreate();
