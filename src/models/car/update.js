const { pg: pool } = require('../../../config/db.config');
const CarValidation = require('./validation');

class CarUpdate {
  static async update(id, carData, sellerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify ownership
      await CarValidation.validateOwnership(client, id, sellerId);

      // Validate car data including VIN
      CarValidation.validateCarData(carData);

      // Update specifications
      if (carData.specifications) {
        CarValidation.validateSpecifications(carData.specifications);
        await this.updateSpecifications(client, id, carData.specifications);
      }

      // Update location
      if (carData.location) {
        const validatedLocation = CarValidation.validateLocation(carData.location);
        await this.updateLocation(client, id, validatedLocation);
      }

      // Update car basic info
      if (this.hasBasicUpdates(carData)) {
        await this.updateBasicInfo(client, id, carData);
      }

      // Update images
      if (carData.images) {
        await this.updateImages(client, id, carData.images);
      }

      await client.query('COMMIT');
      
      const { CarModel } = require('./base');
      return CarModel.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateSpecifications(client, carId, specs) {
    await client.query(
      `UPDATE specifications
      SET engine_type = COALESCE($1, engine_type),
          transmission = COALESCE($2, transmission),
          fuel_type = COALESCE($3, fuel_type),
          mileage = COALESCE($4, mileage),
          mileage_unit = COALESCE($5, mileage_unit),
          engine_size = COALESCE($6, engine_size),
          cylinders = COALESCE($7, cylinders),
          color = COALESCE($8, color),

          steering_wheel = COALESCE($9, steering_wheel),
          drive_type = COALESCE($10, drive_type),
          clearance_status = COALESCE($11, clearance_status),
          airbags_count = COALESCE($12, airbags_count),
          interior_material = COALESCE($13, interior_material),
          interior_color = COALESCE($14, interior_color),
          has_board_computer = COALESCE($15, has_board_computer),
          has_air_conditioning = COALESCE($16, has_air_conditioning),
          has_parking_control = COALESCE($17, has_parking_control),
          has_rear_view_camera = COALESCE($18, has_rear_view_camera),
          has_electric_windows = COALESCE($19, has_electric_windows),
          has_climate_control = COALESCE($20, has_climate_control),
          has_cruise_control = COALESCE($21, has_cruise_control),
          has_start_stop = COALESCE($22, has_start_stop),
          has_sunroof = COALESCE($23, has_sunroof),
          has_heated_seats = COALESCE($24, has_heated_seats),
          has_seat_memory = COALESCE($25, has_seat_memory),
          has_abs = COALESCE($26, has_abs),
          has_traction_control = COALESCE($27, has_traction_control),
          has_central_locking = COALESCE($28, has_central_locking),
          has_alarm = COALESCE($29, has_alarm),
          has_fog_lights = COALESCE($30, has_fog_lights),
          has_navigation = COALESCE($31, has_navigation),
          has_aux = COALESCE($32, has_aux),
          has_bluetooth = COALESCE($33, has_bluetooth),
          has_multifunction_steering_wheel = COALESCE($34, has_multifunction_steering_wheel),
          has_hydraulics = COALESCE($35, has_hydraulics),
          has_alloy_wheels = COALESCE($36, has_alloy_wheels),
          has_spare_tire = COALESCE($37, has_spare_tire),
          is_disability_adapted = COALESCE($38, is_disability_adapted),
          has_technical_inspection = COALESCE($39, has_technical_inspection)
      WHERE id = (SELECT specification_id FROM cars WHERE id = $40)`,
      [
        specs.engine_type,
        specs.transmission,
        specs.fuel_type,
        specs.mileage,
        specs.mileage_unit,
        specs.engine_size,
        specs.cylinders,
        specs.color,

        specs.steering_wheel,
        specs.drive_type,
        specs.clearance_status,
        specs.airbags_count,
        specs.interior_material,
        specs.interior_color,
        specs.has_board_computer,
        specs.has_air_conditioning,
        specs.has_parking_control,
        specs.has_rear_view_camera,
        specs.has_electric_windows,
        specs.has_climate_control,
        specs.has_cruise_control,
        specs.has_start_stop,
        specs.has_sunroof,
        specs.has_heated_seats,
        specs.has_seat_memory,
        specs.has_abs,
        specs.has_traction_control,
        specs.has_central_locking,
        specs.has_alarm,
        specs.has_fog_lights,
        specs.has_navigation,
        specs.has_aux,
        specs.has_bluetooth,
        specs.has_multifunction_steering_wheel,
        specs.has_hydraulics,
        specs.has_alloy_wheels,
        specs.has_spare_tire,
        specs.is_disability_adapted,
        specs.has_technical_inspection,
        carId
      ]
    );
  }

  static async updateLocation(client, carId, location) {
    await client.query(
      `UPDATE locations
      SET location_type = $1,
          is_in_transit = $2,
          city = $3,
          country = $4
      WHERE id = (SELECT location_id FROM cars WHERE id = $5)`,
      [
        location.location_type,
        location.is_in_transit,
        location.city,
        location.country,
        carId
      ]
    );
  }

  static hasBasicUpdates(carData) {
    const updateableFields = [
      'brand_id', 'category_id', 'model', 'year', 'price', 'currency',
      'description_en', 'description_ka', 'description_ru', 'status', 'featured',
      'vin_code',
      // Allow updating per-listing contact fields
      'author_name', 'author_phone',
      'color_highlighting_enabled', 'color_highlighting_expiration_date', 
      'color_highlighting_total_days', 'color_highlighting_remaining_days',
      'auto_renewal_enabled', 'auto_renewal_expiration_date',
      'auto_renewal_total_days', 'auto_renewal_remaining_days',
      'vip_status', 'vip_expiration_date', 'vip_total_days', 'vip_remaining_days'
    ];
    return updateableFields.some(field => field in carData);
  }

  static async updateBasicInfo(client, carId, carData) {
    const updateableFields = [
      'brand_id', 'category_id', 'model', 'year', 'price', 'currency',
      'description_en', 'description_ka', 'description_ru', 'status', 'featured',
      'vin_code',
      // Include author fields for contact info updates
      'author_name', 'author_phone',
      'color_highlighting_enabled', 'color_highlighting_expiration_date', 
      'color_highlighting_total_days', 'color_highlighting_remaining_days',
      'auto_renewal_enabled', 'auto_renewal_expiration_date',
      'auto_renewal_total_days', 'auto_renewal_remaining_days',
      'vip_status', 'vip_expiration_date', 'vip_total_days', 'vip_remaining_days'
    ];

    const updates = [];
    const values = [];
    let paramCounter = 1;

    updateableFields.forEach(field => {
      if (field in carData) {
        updates.push(`${field} = $${paramCounter}`);
        values.push(carData[field]);
        paramCounter++;
      }
    });

    if (updates.length > 0) {
      values.push(carId);
      await client.query(
        `UPDATE cars
        SET ${updates.join(', ')}
        WHERE id = $${paramCounter}`,
        values
      );
    }
  }

  static async updateImages(client, carId, images) {
    // Delete existing images
    await client.query('DELETE FROM car_images WHERE car_id = $1', [carId]);
    
    // Insert new images
    for (let i = 0; i < images.length; i++) {
      await client.query(
        `INSERT INTO car_images (car_id, image_url, thumbnail_url, medium_url, large_url, is_primary)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          carId,
          images[i].url,
          images[i].thumbnail_url,
          images[i].medium_url,
          images[i].large_url,
          i === 0
        ]
      );
    }
  }

  static async delete(id, sellerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await CarValidation.validateOwnership(client, id, sellerId);

      // Get all image URLs before deletion
      const imageResult = await client.query(
        'SELECT image_url, thumbnail_url, medium_url, large_url FROM car_images WHERE car_id = $1',
        [id]
      );

      // Delete from database
      await client.query('DELETE FROM cars WHERE id = $1', [id]);

      await client.query('COMMIT');

      // After successful DB deletion, delete images from S3
      const { s3, bucket } = require('../../../config/storage.config');
      const imagesToDelete = [];
      imageResult.rows.forEach(row => {
        ['image_url', 'thumbnail_url', 'medium_url', 'large_url'].forEach(urlType => {
          if (row[urlType]) {
            const key = row[urlType].replace(`https://${bucket}.s3.amazonaws.com/`, '');
            imagesToDelete.push({ Key: key });
          }
        });
      });

      if (imagesToDelete.length > 0) {
        await s3.deleteObjects({
          Bucket: bucket,
          Delete: { Objects: imagesToDelete }
        }).promise();
      }

      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async deleteImage(imageId, sellerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get the image details and verify ownership
      const imageResult = await client.query(
        `SELECT ci.*, c.seller_id
         FROM car_images ci
         JOIN cars c ON ci.car_id = c.id
         WHERE ci.id = $1`,
        [imageId]
      );

      if (imageResult.rows.length === 0) {
        throw new Error('Image not found');
      }

      const image = imageResult.rows[0];

      // Check ownership
      if (image.seller_id !== sellerId) {
        throw new Error('You do not have permission to delete this image');
      }

      // Check if it's the only image
      const imageCountResult = await client.query(
        'SELECT COUNT(*) FROM car_images WHERE car_id = $1',
        [image.car_id]
      );

      if (parseInt(imageCountResult.rows[0].count) === 1) {
        throw new Error('Cannot delete the last image. A car must have at least one image.');
      }

      // If this is the primary image, set another one as primary
      if (image.is_primary) {
        await client.query(
          `UPDATE car_images
           SET is_primary = true
           WHERE car_id = $1 AND id != $2
           LIMIT 1`,
          [image.car_id, imageId]
        );
      }

      // Delete from database
      await client.query('DELETE FROM car_images WHERE id = $1', [imageId]);

      await client.query('COMMIT');

      // After successful DB deletion, delete from S3
      const { s3, bucket } = require('../../../config/storage.config');
      const imagesToDelete = [];

      ['image_url', 'thumbnail_url', 'medium_url', 'large_url'].forEach(urlType => {
        if (image[urlType]) {
          const key = image[urlType].replace(`https://${bucket}.s3.amazonaws.com/`, '');
          imagesToDelete.push({ Key: key });
        }
      });

      if (imagesToDelete.length > 0) {
        await s3.deleteObjects({
          Bucket: bucket,
          Delete: { Objects: imagesToDelete }
        }).promise();
      }

      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async setPrimaryImage(carId, imageId, sellerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify ownership
      await CarValidation.validateOwnership(client, carId, sellerId);

      // Verify the image belongs to this car
      const imageResult = await client.query(
        'SELECT id FROM car_images WHERE id = $1 AND car_id = $2',
        [imageId, carId]
      );

      if (imageResult.rows.length === 0) {
        throw new Error('Image not found for this car');
      }

      // Update all images to not be primary
      await client.query(
        'UPDATE car_images SET is_primary = false WHERE car_id = $1',
        [carId]
      );

      // Set the new primary image
      await client.query(
        'UPDATE car_images SET is_primary = true WHERE id = $1',
        [imageId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Admin version that skips ownership validation
  static async updateAsAdmin(id, carData, adminId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Skip ownership validation for admin
      // Admin can update any car

      // Validate car data including VIN
      CarValidation.validateCarData(carData);

      // Update specifications
      if (carData.specifications) {
        CarValidation.validateSpecifications(carData.specifications);
        await this.updateSpecifications(client, id, carData.specifications);
      }

      // Update location
      if (carData.location) {
        const validatedLocation = CarValidation.validateLocation(carData.location);
        await this.updateLocation(client, id, validatedLocation);
      }

      // Update car basic info
      if (this.hasBasicUpdates(carData)) {
        await this.updateBasicInfo(client, id, carData);
      }

      // Commit the transaction
      await client.query('COMMIT');

      // Return updated car data
      const result = await client.query(`
        SELECT c.*, 
               s.*, 
               l.*,
               u.first_name as seller_first_name,
               u.last_name as seller_last_name,
               u.phone as seller_phone,
               b.name as brand,
               cat.name as category
        FROM cars c
        JOIN specifications s ON c.specification_id = s.id
        JOIN locations l ON c.location_id = l.id
        JOIN users u ON c.seller_id = u.id
        JOIN brands b ON c.brand_id = b.id
        JOIN categories cat ON c.category_id = cat.id
        WHERE c.id = $1
      `, [id]);

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = CarUpdate;
