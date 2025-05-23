const pool = require('../../../config/db.config');
const CarValidation = require('./validation');

class CarUpdate {
  static async update(id, carData, sellerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify ownership
      await CarValidation.validateOwnership(client, id, sellerId);

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
          is_turbo = COALESCE($7, is_turbo),
          cylinders = COALESCE($8, cylinders),
          color = COALESCE($9, color),

          steering_wheel = COALESCE($10, steering_wheel),
          drive_type = COALESCE($11, drive_type),
          clearance_status = COALESCE($12, clearance_status),
          has_catalyst = COALESCE($13, has_catalyst),
          airbags_count = COALESCE($14, airbags_count),
          interior_material = COALESCE($15, interior_material),
          interior_color = COALESCE($16, interior_color),
          has_hydraulics = COALESCE($17, has_hydraulics),
          has_board_computer = COALESCE($18, has_board_computer),
          has_air_conditioning = COALESCE($19, has_air_conditioning),
          has_parking_control = COALESCE($20, has_parking_control),
          has_rear_view_camera = COALESCE($21, has_rear_view_camera),
          has_electric_windows = COALESCE($22, has_electric_windows),
          has_climate_control = COALESCE($23, has_climate_control),
          has_cruise_control = COALESCE($24, has_cruise_control),
          has_start_stop = COALESCE($25, has_start_stop),
          has_sunroof = COALESCE($26, has_sunroof),
          has_seat_heating = COALESCE($27, has_seat_heating),
          has_abs = COALESCE($28, has_abs),
          has_traction_control = COALESCE($29, has_traction_control),
          has_central_locking = COALESCE($30, has_central_locking),
          has_alarm = COALESCE($31, has_alarm),
          has_fog_lights = COALESCE($32, has_fog_lights),
          has_navigation = COALESCE($33, has_navigation),
          has_aux = COALESCE($34, has_aux),
          has_bluetooth = COALESCE($35, has_bluetooth),
          has_technical_inspection = COALESCE($36, has_technical_inspection)
      WHERE id = (SELECT specification_id FROM cars WHERE id = $37)`,
      [
        specs.engine_type,
        specs.transmission,
        specs.fuel_type,
        specs.mileage,
        specs.mileage_unit,
        specs.engine_size,
        specs.is_turbo,
        specs.cylinders,
        specs.color,

        specs.steering_wheel,
        specs.drive_type,
        specs.clearance_status,
        specs.has_catalyst,
        specs.airbags_count,
        specs.interior_material,
        specs.interior_color,
        specs.has_hydraulics,
        specs.has_board_computer,
        specs.has_air_conditioning,
        specs.has_parking_control,
        specs.has_rear_view_camera,
        specs.has_electric_windows,
        specs.has_climate_control,
        specs.has_cruise_control,
        specs.has_start_stop,
        specs.has_sunroof,
        specs.has_seat_heating,
        specs.has_seat_memory,
        specs.has_abs,
        specs.has_traction_control,
        specs.has_central_locking,
        specs.has_alarm,
        specs.has_fog_lights,
        specs.has_navigation,
        specs.has_aux,
        specs.has_bluetooth,
        specs.has_technical_inspection,
        carId
      ]
    );
  }

  static async updateLocation(client, carId, location) {
    await client.query(
      `UPDATE locations
      SET location_type = $1,
          is_transit = $2,
          city = $3,
          state = $4,
          country = $5
      WHERE id = (SELECT location_id FROM cars WHERE id = $6)`,
      [
        location.location_type,
        location.is_transit,
        location.city,
        location.state,
        location.country,
        carId
      ]
    );
  }

  static hasBasicUpdates(carData) {
    const updateableFields = [
      'brand_id', 'category_id', 'model', 'year', 'price',
      'description_en', 'description_ka', 'description_ru', 'status', 'featured'
    ];
    return updateableFields.some(field => field in carData);
  }

  static async updateBasicInfo(client, carId, carData) {
    const updateableFields = [
      'brand_id', 'category_id', 'model', 'year', 'price',
      'description_en', 'description_ka', 'description_ru', 'status', 'featured'
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
}

module.exports = CarUpdate;