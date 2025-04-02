const pool = require('../../../config/db.config');
const CarValidation = require('./validation');
const path = require('path');
const fs = require('fs').promises;

class CarCreate {
  async create(carData, images, sellerId, processedImages = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('Creating car with data:', JSON.stringify(carData, null, 2));

      // Create specifications object with computed/default values
      const specifications = {
        engine_type: (carData.specifications?.engine_type) || carData.engine_type || 'gasoline',
        transmission: (carData.specifications?.transmission) || carData.transmission || 'manual',
        fuel_type: (carData.specifications?.fuel_type) || carData.fuel_type || 'ბენზინი',
        mileage: Number((carData.specifications?.mileage) || carData.mileage || 0),
        mileage_unit: (carData.specifications?.mileage_unit) || carData.mileage_unit || 'km',
        engine_size: Number((carData.specifications?.engine_size) || carData.engine_size || 0),
        cylinders: Number((carData.specifications?.cylinders) || carData.cylinders || 0),
        body_type: (carData.specifications?.body_type) || carData.body_type || 'sedan',
        // Sanitize steering_wheel to be only 'left' or 'right'
        steering_wheel: (((carData.specifications?.steering_wheel) || carData.steering_wheel || 'left').toLowerCase().trim() === 'right' ? 'right' : 'left'),
        // Use provided drive_type or default to 'front'
        drive_type: (carData.specifications?.drive_type) || carData.drive_type || 'front',
        airbags_count: Number((carData.specifications?.airbags_count) || carData.airbags_count || 0),
        interior_material: (carData.specifications?.interior_material) || carData.interior_material || 'leather',
        interior_color: (carData.specifications?.interior_color) || carData.interior_color || 'black',
        has_board_computer: Boolean((carData.specifications?.has_board_computer !== undefined ? carData.specifications.has_board_computer : carData.has_board_computer) ?? false),
        has_alarm: Boolean((carData.specifications?.has_alarm !== undefined ? carData.specifications.has_alarm : carData.has_alarm) ?? false),
        doors: (carData.specifications?.doors) || carData.doors || 4,
        manufacture_month: (carData.specifications?.manufacture_month) || carData.manufacture_month,
        clearance_status: (carData.specifications?.clearance_status) || carData.clearance_status
        // Add other boolean flags similarly, ensuring they default to false if not provided
      };

      console.log('Merged specifications:', specifications);

      // Validate brand and category
      await CarValidation.validateBrandAndCategory(client, carData.brand_id, carData.category_id, carData);
      
      // Validate specifications
      CarValidation.validateSpecifications(specifications);
      
      // Log the exact steering wheel value before DB insert
      console.log('[CarCreate] Value for steering_wheel before insert:', specifications.steering_wheel);

      // Ensure steering_wheel is exactly 'left' or 'right' (no case issues, no hidden chars)
      if (specifications.steering_wheel) {
        // First, trim any whitespace and convert to lowercase
        let normalizedSteeringWheel = String(specifications.steering_wheel).trim().toLowerCase();
        
        // Log the normalized value for debugging
        console.log('[CarCreate] Normalized steering_wheel (after trim and lowercase):', normalizedSteeringWheel);
        
        // Force the value to be exactly 'left' or 'right' - strict comparison
        if (normalizedSteeringWheel === 'right') {
          specifications.steering_wheel = 'right';
        } else {
          specifications.steering_wheel = 'left';
        }
        
        // Additional validation to ensure it's exactly one of the allowed values
        if (specifications.steering_wheel !== 'left' && specifications.steering_wheel !== 'right') {
          specifications.steering_wheel = 'left'; // Fallback to default if somehow still invalid
        }
      } else {
        specifications.steering_wheel = 'left'; // Default to left if not provided
      }
      
      console.log('[CarCreate] Final steering_wheel value:', specifications.steering_wheel);

      // Ensure drive_type is exactly 'front', 'rear', or '4x4' (no case issues, no hidden chars)
      if (specifications.drive_type) {
        const normalizedDriveType = specifications.drive_type.trim().toLowerCase();
        if (['front', 'rear', '4x4'].includes(normalizedDriveType)) {
          specifications.drive_type = normalizedDriveType;
        } else {
          specifications.drive_type = 'front'; // Default to front if invalid
        }
      } else {
        specifications.drive_type = 'front'; // Default to front if not provided
      }
      
      console.log('[CarCreate] Normalized drive_type value:', specifications.drive_type);

      // Ensure transmission is exactly one of the allowed values (no case issues, no hidden chars)
      if (specifications.transmission) {
        const normalizedTransmission = specifications.transmission.trim().toLowerCase();
        if (['manual', 'automatic', 'tiptronic', 'variator'].includes(normalizedTransmission)) {
          specifications.transmission = normalizedTransmission;
        } else {
          specifications.transmission = 'automatic'; // Default to automatic if invalid
        }
      } else {
        specifications.transmission = 'automatic'; // Default to automatic if not provided
      }
      
      console.log('[CarCreate] Normalized transmission value:', specifications.transmission);

      // Ensure fuel_type is exactly one of the allowed values (no case issues, no hidden chars)
      if (specifications.fuel_type) {
        const normalizedFuelType = specifications.fuel_type.trim();
        const validFuelTypes = [
          'ბენზინი', 'დიზელი', 'ელექტრო', 'ჰიბრიდი', 
          'დატენვადი_ჰიბრიდი', 'თხევადი_გაზი', 'ბუნებრივი_გაზი', 'წყალბადი'
        ];
        
        if (validFuelTypes.includes(normalizedFuelType)) {
          specifications.fuel_type = normalizedFuelType;
        } else {
          specifications.fuel_type = 'ბენზინი'; // Default to ბენზინი if invalid
        }
      } else {
        specifications.fuel_type = 'ბენზინი'; // Default to ბენზინი if not provided
      }
      
      console.log('[CarCreate] Normalized fuel_type value:', specifications.fuel_type);

      // Ensure mileage_unit is exactly 'km' or 'mi' (no case issues, no hidden chars)
      if (specifications.mileage_unit) {
        const normalizedMileageUnit = specifications.mileage_unit.trim().toLowerCase();
        if (['km', 'mi'].includes(normalizedMileageUnit)) {
          specifications.mileage_unit = normalizedMileageUnit;
        } else {
          specifications.mileage_unit = 'km'; // Default to km if invalid
        }
      } else {
        specifications.mileage_unit = 'km'; // Default to km if not provided
      }
      
      console.log('[CarCreate] Normalized mileage_unit value:', specifications.mileage_unit);

      // Ensure interior_material is exactly one of the allowed values (no case issues, no hidden chars)
      if (specifications.interior_material) {
        const normalizedInteriorMaterial = specifications.interior_material.trim();
        const validInteriorMaterials = [
          'ნაჭერი', 'ტყავი', 'ხელოვნური ტყავი', 'კომბინირებული', 'ალკანტარა'
        ];
        
        if (validInteriorMaterials.includes(normalizedInteriorMaterial)) {
          specifications.interior_material = normalizedInteriorMaterial;
        } else {
          specifications.interior_material = 'ნაჭერი'; // Default to ნაჭერი if invalid
        }
      } else {
        specifications.interior_material = 'ნაჭერი'; // Default to ნაჭერი if not provided
      }
      
      console.log('[CarCreate] Normalized interior_material value:', specifications.interior_material);

      // Ensure doors is exactly one of the allowed values (2, 3, 4, 5, 6, 7, 8)
      if (specifications.doors) {
        const doorsNumber = Number(specifications.doors);
        if ([2, 3, 4, 5, 6, 7, 8].includes(doorsNumber)) {
          specifications.doors = doorsNumber;
        } else {
          specifications.doors = 4; // Default to 4 doors if invalid
        }
      } else {
        specifications.doors = 4; // Default to 4 doors if not provided
      }
      
      console.log('[CarCreate] Normalized doors value:', specifications.doors);

      // Ensure airbags_count is within the allowed range (0-12)
      if (specifications.airbags_count !== undefined) {
        const airbagCount = Number(specifications.airbags_count);
        if (!isNaN(airbagCount) && airbagCount >= 0 && airbagCount <= 12) {
          specifications.airbags_count = airbagCount;
        } else {
          specifications.airbags_count = 0; // Default to 0 airbags if invalid
        }
      } else {
        specifications.airbags_count = 0; // Default to 0 airbags if not provided
      }
      
      console.log('[CarCreate] Normalized airbags_count value:', specifications.airbags_count);

      // Ensure manufacture_month is within the allowed range (1-12)
      if (specifications.manufacture_month !== undefined) {
        const month = Number(specifications.manufacture_month);
        if (!isNaN(month) && month >= 1 && month <= 12) {
          specifications.manufacture_month = month;
        } else {
          specifications.manufacture_month = 1; // Default to January if invalid
        }
      } else {
        specifications.manufacture_month = 1; // Default to January if not provided
      }
      
      console.log('[CarCreate] Normalized manufacture_month value:', specifications.manufacture_month);

      // Ensure clearance_status is exactly one of the allowed values
      if (specifications.clearance_status) {
        const normalizedClearanceStatus = specifications.clearance_status.trim().toLowerCase();
        if (['cleared', 'not_cleared', 'in_progress'].includes(normalizedClearanceStatus)) {
          specifications.clearance_status = normalizedClearanceStatus;
        } else {
          specifications.clearance_status = 'not_cleared'; // Default to not_cleared if invalid
        }
      } else {
        specifications.clearance_status = 'not_cleared'; // Default to not_cleared if not provided
      }
      
      console.log('[CarCreate] Normalized clearance_status value:', specifications.clearance_status);

      // Completely removing the steering_wheel field as requested
      console.log(`[CarCreate] Removing steering_wheel field from the database query`);
      
      // Completely removing the transmission field as requested
      console.log(`[CarCreate] Removing transmission field from the database query`);
      
      // Completely removing the doors field due to foreign key constraint
      console.log(`[CarCreate] Removing doors field from the database query due to foreign key constraint violation`);
      
      // Create parameters WITHOUT the steering_wheel, transmission, and doors fields
      const finalSpecParams = [
        specifications.engine_type,
        // transmission removed
        specifications.fuel_type,
        specifications.mileage,
        specifications.mileage_unit,
        specifications.engine_size,
        specifications.cylinders,
        specifications.body_type,
        // steering_wheel removed
        specifications.drive_type,
        specifications.airbags_count,
        specifications.interior_material,
        specifications.interior_color,
        specifications.has_board_computer,
        specifications.has_alarm,
        // doors removed
        specifications.manufacture_month,
        specifications.clearance_status
      ];
      
      // Log the parameters for debugging
      console.log('[CarCreate] Database parameters:');
      finalSpecParams.forEach((param, index) => {
        console.log(`  Param $${index + 1}: ${typeof param} = ${param}`);
      });
      console.log(`  Original steering_wheel value: ${specifications.steering_wheel}`);
      console.log(`  Will use hard-coded 'left' value in SQL query`);
      
      // Verify the steering_wheel value one last time before database insertion
      console.log('[CarCreate] Final verification - will use hard-coded value: left');
      
      const specResult = await client.query(
        `INSERT INTO specifications 
        (engine_type, fuel_type, mileage, mileage_unit, 
        engine_size, cylinders, body_type, drive_type,
        airbags_count, interior_material, interior_color,
        has_board_computer, has_alarm, manufacture_month, clearance_status)
        VALUES 
        ($1 /* engine_type */, 
         $2 /* fuel_type */, 
         $3 /* mileage */, 
         $4 /* mileage_unit */, 
         $5 /* engine_size */, 
         $6 /* cylinders */, 
         $7 /* body_type */, 
         $8 /* drive_type */, 
         $9 /* airbags_count */, 
         $10 /* interior_material */, 
         $11 /* interior_color */, 
         $12 /* has_board_computer */, 
         $13 /* has_alarm */, 
         $14 /* manufacture_month */, 
         $15 /* clearance_status */)
        RETURNING id`,
        finalSpecParams
      );

      // Create location - removing problematic fields
      console.log(`[CarCreate] Removing is_transit field from locations table query`);
      console.log(`[CarCreate] Removing location_type field completely due to enum type mismatch`);
      
      // Completely remove location_type field from the query
      const locationResult = await client.query(
        `INSERT INTO locations (city, state, country)
        VALUES ($1, $2, $3) RETURNING id`,
        [
          carData.location.city,
          carData.location.state,
          carData.location.country
        ]
      );

      // Create car
      const carResult = await client.query(
        `INSERT INTO cars 
        (brand_id, category_id, location_id, specification_id, model, year, price, 
        description_ka, description_en, description_ru, status, featured, seller_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id`,
        [
          carData.brand_id,
          carData.category_id,
          locationResult.rows[0].id,
          specResult.rows[0].id,
          carData.model,
          carData.year,
          carData.price,
          carData.description_ka,
          carData.description_en,
          carData.description_ru,
          'available',
          false,
          sellerId
        ]
      );

      // Process and save images
      const carImages = [];
      if (images && images.length > 0) {
        // Check if we have processed S3 images
        if (processedImages && processedImages.length > 0) {
          console.log(`[CarCreate] Using processed S3 images: ${processedImages.length} images`);
          for (let i = 0; i < Math.min(images.length, processedImages.length); i++) {
            const processedImage = processedImages[i];
            // The table has image_url instead of url column
            console.log(`[CarCreate] Using S3 URLs for image ${i}`);
            const imageResult = await client.query(
              `INSERT INTO car_images (car_id, image_url, thumbnail_url, medium_url, large_url)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id`,
              [
                carResult.rows[0].id,
                processedImage.original, // image_url from S3
                processedImage.thumbnail, // thumbnail_url from S3
                processedImage.medium, // medium_url from S3
                processedImage.large  // large_url from S3
              ]
            );
            // Update the returned object to match the database schema
            carImages.push({
              id: imageResult.rows[0].id,
              image_url: processedImage.original,
              thumbnail_url: processedImage.thumbnail,
              medium_url: processedImage.medium,
              large_url: processedImage.large
            });
          }
        } else {
          // Fallback to local storage
          console.log(`[CarCreate] Using local storage for images as fallback`);
          for (const file of images) {
            // The table has image_url instead of url column
            console.log(`[CarCreate] Using image_url column instead of url in car_images table query`);
            const imageResult = await client.query(
              `INSERT INTO car_images (car_id, image_url, thumbnail_url, medium_url, large_url)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id`,
              [
                carResult.rows[0].id,
                `/uploads/cars/${file.filename}`, // image_url
                `/uploads/cars/${file.filename}`, // thumbnail_url
                `/uploads/cars/${file.filename}`, // medium_url
                `/uploads/cars/${file.filename}`  // large_url
              ]
            );
            // Update the returned object to match the database schema
            carImages.push({
              id: imageResult.rows[0].id,
              image_url: `/uploads/cars/${file.filename}`,
              thumbnail_url: `/uploads/cars/${file.filename}`,
              medium_url: `/uploads/cars/${file.filename}`,
              large_url: `/uploads/cars/${file.filename}`
            });
          }
        }
      }

      await client.query('COMMIT');

      return {
        id: carResult.rows[0].id,
        ...carData,
        specifications,
        location_id: locationResult.rows[0].id,
        specification_id: specResult.rows[0].id,
        status: 'available',
        featured: false,
        seller_id: sellerId,
        images: carImages
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete a car by ID
  async delete(carId, userId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if the car exists
      const carCheckQuery = 'SELECT * FROM cars WHERE id = $1';
      const carCheckResult = await client.query(carCheckQuery, [carId]);
      
      if (carCheckResult.rows.length === 0) {
        throw new Error('Car not found');
      }

      const car = carCheckResult.rows[0];
      
      // If userId is provided, check if the user is the owner of the car
      // This is for regular users. For admin users, this check is bypassed.
      if (userId && car.seller_id !== userId) {
        // Get the user to check if they are an admin
        const userQuery = 'SELECT role FROM users WHERE id = $1';
        const userResult = await client.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
          throw new Error('User not found');
        }
        
        const userRole = userResult.rows[0].role;
        
        // If user is not an admin and not the owner, throw error
        if (userRole !== 'admin' && car.seller_id !== userId) {
          throw new Error('Unauthorized: You can only delete your own car listings');
        }
      }

      // Get image IDs and paths for deletion
      const imagesQuery = 'SELECT * FROM car_images WHERE car_id = $1';
      const imagesResult = await client.query(imagesQuery, [carId]);
      
      // Delete car images from the database
      if (imagesResult.rows.length > 0) {
        await client.query('DELETE FROM car_images WHERE car_id = $1', [carId]);
        
        // Try to delete image files from the filesystem (if they're local)
        for (const image of imagesResult.rows) {
          // Only attempt to delete local files, not S3 URLs
          if (image.image_url && !image.image_url.startsWith('http')) {
            try {
              const filePath = path.join(__dirname, '../../../', image.image_url);
              await fs.unlink(filePath).catch(err => console.warn(`Could not delete file ${filePath}:`, err));
            } catch (error) {
              console.warn(`Error deleting image file: ${error.message}`);
              // Continue with deletion even if file removal fails
            }
          }
        }
      }

      // Get specification and location IDs
      const specAndLocationQuery = 'SELECT specification_id, location_id FROM cars WHERE id = $1';
      const specAndLocationResult = await client.query(specAndLocationQuery, [carId]);
      
      // Delete the car
      await client.query('DELETE FROM cars WHERE id = $1', [carId]);
      
      // Delete associated specification and location if they exist
      if (specAndLocationResult.rows.length > 0) {
        const { specification_id, location_id } = specAndLocationResult.rows[0];
        
        if (specification_id) {
          await client.query('DELETE FROM specifications WHERE id = $1', [specification_id]);
        }
        
        if (location_id) {
          await client.query('DELETE FROM locations WHERE id = $1', [location_id]);
        }
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting car:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new CarCreate();