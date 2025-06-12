const pool = require('../../../config/db.config');
const PartValidation = require('./validation');

class PartUpdate {
  async update(partId, partData, images, processedImages = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('Updating part with data:', JSON.stringify(partData, null, 2));

      // Validate brand and category
      if (partData.brand_id && partData.category_id) {
        await PartValidation.validateBrandAndCategory(client, partData.brand_id, partData.category_id, partData);
      }
      
      // Validate model if brand is provided
      if (partData.brand_id && partData.model_id) {
        await PartValidation.validateModel(client, partData.brand_id, partData.model_id);
      }
      
      // Validate part condition if provided
      if (partData.condition) {
        PartValidation.validateCondition(partData.condition);
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCounter = 1;

      // Add fields to update
      if (partData.title !== undefined) {
        updates.push(`title = $${paramCounter}`);
        values.push(partData.title);
        paramCounter++;
      }

      if (partData.category_id !== undefined) {
        updates.push(`category_id = $${paramCounter}`);
        values.push(partData.category_id);
        paramCounter++;
      }

      if (partData.brand_id !== undefined) {
        updates.push(`brand_id = $${paramCounter}`);
        values.push(partData.brand_id);
        paramCounter++;
      }

      if (partData.model_id !== undefined) {
        updates.push(`model_id = $${paramCounter}`);
        values.push(partData.model_id);
        paramCounter++;
      }

      if (partData.condition !== undefined) {
        updates.push(`condition = $${paramCounter}`);
        values.push(partData.condition);
        paramCounter++;
      }

      if (partData.price !== undefined) {
        updates.push(`price = $${paramCounter}`);
        values.push(partData.price);
        paramCounter++;
      }

      if (partData.description !== undefined) {
        updates.push(`description = $${paramCounter}`);
        values.push(partData.description);
        paramCounter++;
      }

      if (partData.description_en !== undefined) {
        updates.push(`description_en = $${paramCounter}`);
        values.push(partData.description_en);
        paramCounter++;
      }

      if (partData.description_ka !== undefined) {
        updates.push(`description_ka = $${paramCounter}`);
        values.push(partData.description_ka);
        paramCounter++;
      }

      // Only update if there are fields to update
      if (updates.length > 0) {
        // Add part ID to values array
        values.push(partId);

        const updatePartQuery = `
          UPDATE parts
          SET ${updates.join(', ')}
          WHERE id = $${paramCounter}
          RETURNING *
        `;

        await client.query(updatePartQuery, values);
      }

      // Handle new images if provided
      if ((images && images.length > 0) || (processedImages && processedImages.length > 0)) {
        // Handle the images upload
        await this.handleImagesUpdate(client, partId, images, processedImages);
      }

      await client.query('COMMIT');
      
      // Get the updated part with all details
      return await this.getPartWithDetails(partId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async handleImagesUpdate(client, partId, images, processedImages) {
    // If we have processed images, use them
    if (processedImages && processedImages.length > 0) {
      // Check if we need to remove existing images
      if (processedImages.some(img => img.replace === true)) {
        // Remove all existing images for this part
        await client.query('DELETE FROM part_images WHERE part_id = $1', [partId]);
      }

      const promises = processedImages.map((image, index) => {
        const isPrimary = image.is_primary || index === 0; // First image is primary if not specified
        return this.saveImageToDatabase(client, partId, image, isPrimary);
      });
      
      await Promise.all(promises);
      return;
    }

    // Otherwise, if we have new images to add
    if (images && images.length > 0) {
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
  }

  async saveImageToDatabase(client, partId, image, isPrimary) {
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
    
    return imageResult.rows[0];
  }

  async setImageAsPrimary(partId, imageId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First, set all images as non-primary
      await client.query(
        'UPDATE part_images SET is_primary = false WHERE part_id = $1',
        [partId]
      );

      // Then, set the specified image as primary
      const updateResult = await client.query(
        'UPDATE part_images SET is_primary = true WHERE id = $1 AND part_id = $2 RETURNING *',
        [imageId, partId]
      );

      if (updateResult.rows.length === 0) {
        throw new Error(`No image found with id ${imageId} for part ${partId}`);
      }

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteImage(partId, imageId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete the specified image
      const deleteResult = await client.query(
        'DELETE FROM part_images WHERE id = $1 AND part_id = $2 RETURNING *',
        [imageId, partId]
      );

      if (deleteResult.rows.length === 0) {
        throw new Error(`No image found with id ${imageId} for part ${partId}`);
      }

      // Check if the deleted image was the primary one
      const wasImagePrimary = deleteResult.rows[0].is_primary;

      // If it was the primary image, set another image as primary
      if (wasImagePrimary) {
        // Get the first available image for this part
        const nextImageResult = await client.query(
          'SELECT id FROM part_images WHERE part_id = $1 LIMIT 1',
          [partId]
        );

        // If there's at least one image left, set it as primary
        if (nextImageResult.rows.length > 0) {
          await client.query(
            'UPDATE part_images SET is_primary = true WHERE id = $1',
            [nextImageResult.rows[0].id]
          );
        }
      }

      await client.query('COMMIT');
      return deleteResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getPartWithDetails(partId) {
    const query = `
      SELECT 
        p.*,
        b.name as brand,
        cat.name as category,
        cm.name as model,
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
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN car_models cm ON p.model_id = cm.id
      WHERE p.id = $1
      GROUP BY p.id, b.name, cat.name, cm.name
    `;
    
    const result = await pool.query(query, [partId]);
    return result.rows[0];
  }
}

module.exports = new PartUpdate();
