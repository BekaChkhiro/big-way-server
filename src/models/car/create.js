const pool = require('../../../config/db.config');
const CarValidation = require('./validation');

class CarCreate {
  static async create(carData, sellerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate brand and category
      await CarValidation.validateBrandAndCategory(client, carData.brand_id, carData.category_id);
      
      // Validate specifications
      CarValidation.validateSpecifications(carData);
      
      // Validate and process location
      const validatedLocation = CarValidation.validateLocation(carData);

      // Create specification
      const specResult = await client.query(
        `INSERT INTO specifications 
        (engine_type, transmission, fuel_type, mileage, mileage_unit, 
        engine_size, is_turbo, cylinders, manufacture_month,
        color, body_type, steering_wheel, drive_type, clearance_status,
        has_catalyst, airbags_count, interior_material, interior_color,
        has_hydraulics, has_board_computer, has_air_conditioning,
        has_parking_control, has_rear_view_camera, has_electric_windows,
        has_climate_control, has_cruise_control, has_start_stop,
        has_sunroof, has_seat_heating, has_seat_memory, has_abs,
        has_traction_control, has_central_locking, has_alarm,
        has_fog_lights, has_navigation, has_aux, has_bluetooth,
        has_multifunction_steering_wheel, has_alloy_wheels,
        has_spare_tire, is_disability_adapted)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, 
                $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, 
                $39, $40, $41, $42)
        RETURNING id`,
        [
          carData.engine_type,
          carData.transmission,
          carData.fuel_type,
          carData.mileage,
          carData.mileage_unit || 'km',
          carData.engine_size,
          carData.is_turbo || false,
          carData.cylinders,
          carData.manufacture_month,
          carData.color,
          carData.body_type,
          carData.steering_wheel || 'left',
          carData.drive_type,
          carData.clearance_status || 'not_cleared',
          carData.has_catalyst !== undefined ? carData.has_catalyst : true,
          carData.airbags_count || 0,
          carData.interior_material,
          carData.interior_color,
          carData.has_hydraulics || false,
          carData.has_board_computer || false,
          carData.has_air_conditioning || false,
          carData.has_parking_control || false,
          carData.has_rear_view_camera || false,
          carData.has_electric_windows || false,
          carData.has_climate_control || false,
          carData.has_cruise_control || false,
          carData.has_start_stop || false,
          carData.has_sunroof || false,
          carData.has_seat_heating || false,
          carData.has_seat_memory || false,
          carData.has_abs || false,
          carData.has_traction_control || false,
          carData.has_central_locking || false,
          carData.has_alarm || false,
          carData.has_fog_lights || false,
          carData.has_navigation || false,
          carData.has_aux || false,
          carData.has_bluetooth || false,
          carData.has_multifunction_steering_wheel || false,
          carData.has_alloy_wheels || false,
          carData.has_spare_tire || false,
          carData.is_disability_adapted || false
        ]
      );

      // Create location
      const locationResult = await client.query(
        `INSERT INTO locations (location_type, is_transit, city, state, country)
        VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          validatedLocation.location_type,
          validatedLocation.is_transit,
          validatedLocation.city,
          validatedLocation.state,
          validatedLocation.country
        ]
      );

      // Create car
      const carResult = await client.query(
        `INSERT INTO cars 
        (brand_id, category_id, location_id, specification_id, model, year, price, 
        description_en, description_ka, description_ru, status, featured, seller_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          carData.brand_id,
          carData.category_id,
          locationResult.rows[0].id,
          specResult.rows[0].id,
          carData.model,
          carData.year,
          carData.price,
          carData.description_en,
          carData.description_ka,
          carData.description_ru,
          carData.status || 'available',
          carData.featured || false,
          sellerId
        ]
      );

      // Add images if provided
      if (carData.images && carData.images.length > 0) {
        for (let i = 0; i < carData.images.length; i++) {
          await client.query(
            `INSERT INTO car_images (car_id, image_url, thumbnail_url, medium_url, large_url, is_primary)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              carResult.rows[0].id,
              carData.images[i].url,
              carData.images[i].thumbnail_url,
              carData.images[i].medium_url,
              carData.images[i].large_url,
              i === 0
            ]
          );
        }
      }

      await client.query('COMMIT');
      return carResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async addImages(carId, images) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < images.length; i++) {
        const { original, thumbnail, medium, large } = images[i];
        await client.query(
          `INSERT INTO car_images (car_id, image_url, thumbnail_url, medium_url, large_url, is_primary)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            carId,
            original,
            thumbnail,
            medium,
            large,
            i === 0
          ]
        );
      }

      await client.query('COMMIT');
      const { CarModel } = require('./base');
      return CarModel.findById(carId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = CarCreate;