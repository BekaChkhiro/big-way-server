const pool = require('../../../config/db.config');
const CarValidation = require('./validation');
const path = require('path');
const fs = require('fs').promises;

class CarCreate {
  // Helper function to normalize interior material to a valid value
  normalizeInteriorMaterial(interiorMaterial) {
    if (!interiorMaterial) {
      return 'ნაჭერი'; // Default if not provided
    }
    
    const normalizedValue = interiorMaterial.trim();
    const validInteriorMaterials = [
      'ნაჭერი', 'ტყავი', 'ხელოვნური ტყავი', 'კომბინირებული', 'ალკანტარა'
    ];
    
    if (validInteriorMaterials.includes(normalizedValue)) {
      return normalizedValue;
    } else {
      // Map English terms to Georgian equivalents
      if (normalizedValue.toLowerCase() === 'leather') {
        return 'ტყავი';
      } else if (normalizedValue.toLowerCase() === 'cloth' || normalizedValue.toLowerCase() === 'fabric') {
        return 'ნაჭერი';
      } else if (normalizedValue.toLowerCase() === 'alcantara') {
        return 'ალკანტარა';
      } else if (normalizedValue.toLowerCase().includes('artificial') || normalizedValue.toLowerCase().includes('synthetic')) {
        return 'ხელოვნური ტყავი';
      } else if (normalizedValue.toLowerCase().includes('combined') || normalizedValue.toLowerCase().includes('mix')) {
        return 'კომბინირებული';
      }
      
      return 'ნაჭერი'; // Default if invalid
    }
  }
  
  // Helper function to validate engine size
  adjustEngineSize(engineSize) {
    if (engineSize === undefined || engineSize === null || engineSize === '') {
      return null; // Return null instead of default value
    }
    
    // Parse to float if it's a string
    const size = parseFloat(engineSize);
    
    // Check if it's a valid number
    if (isNaN(size) || size <= 0 || size > 13.0) {
      return null; // Return null if invalid
    }
    
    // Return the exact value from the frontend without adjustment
    // The dropdown already provides valid values
    return size;
  }
  async create(carData, images, sellerId, processedImages = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('Creating car with data:', JSON.stringify(carData, null, 2));

      // Create specifications object with computed/default values
      const specifications = {
        engine_type: (carData.specifications?.engine_type) || carData.engine_type || 'gasoline',
        transmission: (carData.specifications?.transmission) || carData.transmission || 'automatic',
        fuel_type: (carData.specifications?.fuel_type) || carData.fuel_type || 'ბენზინი',
        mileage: Number((carData.specifications?.mileage) || carData.mileage || 0),
        mileage_unit: (carData.specifications?.mileage_unit) || carData.mileage_unit || 'km',
        engine_size: parseFloat((carData.specifications?.engine_size) || carData.engine_size || 0),
        cylinders: Number((carData.specifications?.cylinders) || carData.cylinders || 0),

        // Sanitize steering_wheel to be only 'left' or 'right' (will be converted to Georgian later)
        steering_wheel: (((carData.specifications?.steering_wheel) || carData.steering_wheel || 'left').toLowerCase().trim() === 'right' ? 'right' : 'left'),
        // Use provided drive_type or default to 'front'
        drive_type: (carData.specifications?.drive_type) || carData.drive_type || 'front',
        airbags_count: Number((carData.specifications?.airbags_count) || carData.airbags_count || 0),
        interior_material: (carData.specifications?.interior_material) || carData.interior_material || 'leather',
        interior_color: (carData.specifications?.interior_color) || carData.interior_color || 'black',
        color: (carData.specifications?.color) || carData.color || '',
        doors: (carData.specifications?.doors) || carData.doors || 4,
        clearance_status: (carData.specifications?.clearance_status) || carData.clearance_status
      };
      
      // Process feature flags from either specifications object or features array
      console.log('Processing features from client data:', carData.features);
      
      // Handle features that come as an array of strings
      if (Array.isArray(carData.features)) {
        specifications.has_board_computer = carData.features.includes('board_computer') || carData.features.includes('has_board_computer');
        specifications.has_alarm = carData.features.includes('alarm') || carData.features.includes('has_alarm');
        specifications.has_air_conditioning = carData.features.includes('air_conditioning') || carData.features.includes('has_air_conditioning');
        specifications.has_parking_control = carData.features.includes('parking_control') || carData.features.includes('has_parking_control');
        specifications.has_rear_view_camera = carData.features.includes('rear_view_camera') || carData.features.includes('has_rear_view_camera');
        specifications.has_electric_windows = carData.features.includes('electric_windows') || carData.features.includes('has_electric_windows');
        specifications.has_climate_control = carData.features.includes('climate_control') || carData.features.includes('has_climate_control');
        specifications.has_cruise_control = carData.features.includes('cruise_control') || carData.features.includes('has_cruise_control');
        specifications.has_start_stop = carData.features.includes('start_stop') || carData.features.includes('has_start_stop');
        specifications.has_sunroof = carData.features.includes('sunroof') || carData.features.includes('has_sunroof');
        specifications.has_heated_seats = carData.features.includes('seat_heating') || carData.features.includes('heated_seats') || carData.features.includes('has_heated_seats') || carData.features.includes('has_heated_seats');
        specifications.has_seat_memory = carData.features.includes('seat_memory') || carData.features.includes('memory_seats') || carData.features.includes('has_seat_memory') || carData.features.includes(' has_heated_seats');
        specifications.has_abs = carData.features.includes('abs') || carData.features.includes('has_abs');
        specifications.has_traction_control = carData.features.includes('traction_control') || carData.features.includes('has_traction_control');
        specifications.has_central_locking = carData.features.includes('central_locking') || carData.features.includes('has_central_locking');
        specifications.has_fog_lights = carData.features.includes('fog_lights') || carData.features.includes('has_fog_lights');
        specifications.has_navigation = carData.features.includes('navigation') || carData.features.includes('has_navigation');
        specifications.has_aux = carData.features.includes('aux') || carData.features.includes('has_aux');
        specifications.has_bluetooth = carData.features.includes('bluetooth') || carData.features.includes('has_bluetooth');
        specifications.has_multifunction_steering_wheel = carData.features.includes('multifunction_steering_wheel') || carData.features.includes('has_multifunction_steering_wheel');
        specifications.has_hydraulics = carData.features.includes('hydraulics') || carData.features.includes('has_hydraulics');
        specifications.has_alloy_wheels = carData.features.includes('alloy_wheels') || carData.features.includes('has_alloy_wheels');
        specifications.has_spare_tire = carData.features.includes('spare_tire') || carData.features.includes('has_spare_tire');
        specifications.is_disability_adapted = carData.features.includes('disability_adapted') || carData.features.includes('has_disability_adapted') || carData.features.includes('is_disability_adapted');
        specifications.has_technical_inspection = carData.features.includes('technical_inspection') || carData.features.includes('has_technical_inspection');
      }
      // Handle features that come as an object with boolean values
      else if (carData.features && typeof carData.features === 'object') {
        specifications.has_board_computer = Boolean(carData.features.has_board_computer);
        specifications.has_alarm = Boolean(carData.features.has_alarm);
        specifications.has_air_conditioning = Boolean(carData.features.has_air_conditioning);
        specifications.has_parking_control = Boolean(carData.features.has_parking_control);
        specifications.has_rear_view_camera = Boolean(carData.features.has_rear_view_camera);
        specifications.has_electric_windows = Boolean(carData.features.has_electric_windows);
        specifications.has_climate_control = Boolean(carData.features.has_climate_control);
        specifications.has_cruise_control = Boolean(carData.features.has_cruise_control);
        specifications.has_start_stop = Boolean(carData.features.has_start_stop);
        specifications.has_sunroof = Boolean(carData.features.has_sunroof);
        specifications.has_heated_seats = Boolean(carData.features.has_heated_seats || carData.features.has_heated_seats);
        specifications.has_seat_memory = Boolean(carData.features.has_seat_memory || carData.features. has_heated_seats);
        specifications.has_abs = Boolean(carData.features.has_abs);
        specifications.has_traction_control = Boolean(carData.features.has_traction_control);
        specifications.has_central_locking = Boolean(carData.features.has_central_locking);
        specifications.has_fog_lights = Boolean(carData.features.has_fog_lights);
        specifications.has_navigation = Boolean(carData.features.has_navigation);
        specifications.has_aux = Boolean(carData.features.has_aux);
        specifications.has_bluetooth = Boolean(carData.features.has_bluetooth);
        specifications.has_multifunction_steering_wheel = Boolean(carData.features.has_multifunction_steering_wheel);
        specifications.has_hydraulics = Boolean(carData.features.has_hydraulics);
        specifications.has_alloy_wheels = Boolean(carData.features.has_alloy_wheels);
        specifications.has_spare_tire = Boolean(carData.features.has_spare_tire);
        specifications.is_disability_adapted = Boolean(carData.features.is_disability_adapted);
        specifications.has_technical_inspection = Boolean(carData.features.has_technical_inspection);
      }
      // Fall back to specifications object if features array/object isn't provided
      else {
        specifications.has_board_computer = Boolean(carData.specifications?.has_board_computer || carData.has_board_computer);
        specifications.has_alarm = Boolean(carData.specifications?.has_alarm || carData.has_alarm);
        specifications.has_air_conditioning = Boolean(carData.specifications?.has_air_conditioning || carData.has_air_conditioning);
        specifications.has_parking_control = Boolean(carData.specifications?.has_parking_control || carData.has_parking_control);
        specifications.has_rear_view_camera = Boolean(carData.specifications?.has_rear_view_camera || carData.has_rear_view_camera);
        specifications.has_electric_windows = Boolean(carData.specifications?.has_electric_windows || carData.has_electric_windows);
        specifications.has_climate_control = Boolean(carData.specifications?.has_climate_control || carData.has_climate_control);
        specifications.has_cruise_control = Boolean(carData.specifications?.has_cruise_control || carData.has_cruise_control);
        specifications.has_start_stop = Boolean(carData.specifications?.has_start_stop || carData.has_start_stop);
        specifications.has_sunroof = Boolean(carData.specifications?.has_sunroof || carData.has_sunroof);
        specifications.has_heated_seats = Boolean(carData.specifications?.has_heated_seats || carData.has_heated_seats);
        specifications.has_seat_memory = Boolean(carData.specifications?.has_seat_memory || carData.has_seat_memory);
        specifications.has_abs = Boolean(carData.specifications?.has_abs || carData.has_abs);
        specifications.has_traction_control = Boolean(carData.specifications?.has_traction_control || carData.has_traction_control);
        specifications.has_central_locking = Boolean(carData.specifications?.has_central_locking || carData.has_central_locking);
        specifications.has_fog_lights = Boolean(carData.specifications?.has_fog_lights || carData.has_fog_lights);
        specifications.has_navigation = Boolean(carData.specifications?.has_navigation || carData.has_navigation);
        specifications.has_aux = Boolean(carData.specifications?.has_aux || carData.has_aux);
        specifications.has_bluetooth = Boolean(carData.specifications?.has_bluetooth || carData.has_bluetooth);
        specifications.has_multifunction_steering_wheel = Boolean(carData.specifications?.has_multifunction_steering_wheel || carData.has_multifunction_steering_wheel);
        specifications.has_hydraulics = Boolean(carData.specifications?.has_hydraulics || carData.has_hydraulics);
        specifications.has_alloy_wheels = Boolean(carData.specifications?.has_alloy_wheels || carData.has_alloy_wheels);
        specifications.has_spare_tire = Boolean(carData.specifications?.has_spare_tire || carData.has_spare_tire);
        specifications.is_disability_adapted = Boolean(carData.specifications?.is_disability_adapted || carData.is_disability_adapted);
        specifications.has_technical_inspection = Boolean(carData.specifications?.has_technical_inspection || carData.has_technical_inspection);
      }
      
      console.log('Final processed feature flags:', {
        has_board_computer: specifications.has_board_computer,
        has_alarm: specifications.has_alarm,
        has_air_conditioning: specifications.has_air_conditioning,
        has_electric_windows: specifications.has_electric_windows,
        has_multifunction_steering_wheel: specifications.has_multifunction_steering_wheel,
        has_abs: specifications.has_abs,
        // Add more features for debugging as needed
      });

      console.log('Merged specifications:', specifications);

      // Validate brand and category
      await CarValidation.validateBrandAndCategory(client, carData.brand_id, carData.category_id, carData);
      
      // Validate car data including VIN
      CarValidation.validateCarData(carData);
      
      // Validate specifications
      CarValidation.validateSpecifications(specifications);
      
      // Log the exact steering wheel value before DB insert
      console.log('[CarCreate] Value for steering_wheel before insert:', specifications.steering_wheel);

      // Ensure steering_wheel is exactly 'left' or 'right' (English values for specifications_steering_wheel_check)
      if (specifications.steering_wheel) {
        // First, trim any whitespace and convert to lowercase
        let normalizedSteeringWheel = String(specifications.steering_wheel).trim().toLowerCase();
        
        // Log the normalized value for debugging
        console.log('[CarCreate] Normalized steering_wheel (after trim and lowercase):', normalizedSteeringWheel);
        
        // Map Georgian to English values (reverse mapping)
        const steeringWheelMap = {
          'მარცხენა': 'left',
          'მარჯვენა': 'right'
        };
        
        // Check if it's already English
        if (['left', 'right'].includes(normalizedSteeringWheel)) {
          specifications.steering_wheel = normalizedSteeringWheel;
        } else if (steeringWheelMap[normalizedSteeringWheel]) {
          specifications.steering_wheel = steeringWheelMap[normalizedSteeringWheel];
        } else {
          specifications.steering_wheel = 'left'; // Default to English left
        }
      } else {
        specifications.steering_wheel = 'left'; // Default to English left if not provided
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

      // Ensure transmission is exactly one of the allowed values (English for specifications_transmission_check)
      if (specifications.transmission) {
        const normalizedTransmission = specifications.transmission.trim().toLowerCase();
        const validTransmissions = [
          'manual', 'automatic', 'tiptronic', 'variator'
        ];
        
        if (validTransmissions.includes(normalizedTransmission)) {
          specifications.transmission = normalizedTransmission;
        } else {
          // Map Georgian transmission types to English equivalents
          const transmissionMap = {
            'მექანიკა': 'manual',
            'ავტომატიკა': 'automatic',
            'ტიპტრონიკი': 'tiptronic',
            'ვარიატორი': 'variator'
          };
          
          if (transmissionMap[specifications.transmission]) {
            specifications.transmission = transmissionMap[specifications.transmission];
          } else {
            specifications.transmission = 'automatic'; // Default to automatic if invalid
          }
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
          // Map English fuel types to Georgian equivalents
          const fuelTypeMap = {
            'gasoline': 'ბენზინი',
            'petrol': 'ბენზინი',
            'diesel': 'დიზელი',
            'electric': 'ელექტრო',
            'hybrid': 'ჰიბრიდი',
            'plug-in hybrid': 'დატენვადი_ჰიბრიდი',
            'lpg': 'თხევადი_გაზი',
            'natural gas': 'ბუნებრივი_გაზი',
            'hydrogen': 'წყალბადი'
          };
          
          const englishFuelType = normalizedFuelType.toLowerCase();
          if (fuelTypeMap[englishFuelType]) {
            specifications.fuel_type = fuelTypeMap[englishFuelType];
          } else {
            specifications.fuel_type = 'ბენზინი'; // Default to ბენზინი if invalid
          }
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

      // Just log the engine_size value without modifying it
      console.log('[CarCreate] Engine size value:', specifications.engine_size);
      
      console.log('[CarCreate] Final engine_size value:', specifications.engine_size);

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

      // manufacture_month field has been removed as it's no longer needed

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

      // Create parameters INCLUDING color, steering_wheel, and transmission fields
      const finalSpecParams = [
        specifications.engine_type,
        specifications.transmission || 'automatic',  // Add transmission with English default
        specifications.fuel_type,
        specifications.mileage,
        specifications.mileage_unit,
        // Convert engine_size to a format PostgreSQL can handle
        this.adjustEngineSize(specifications.engine_size),
        specifications.cylinders,
        specifications.drive_type,
        specifications.airbags_count,
        this.normalizeInteriorMaterial(specifications.interior_material),
        specifications.interior_color,
        specifications.color || null,  // Add color
        // Use English value 'left' or 'right' as required by specifications_steering_wheel_check constraint
        specifications.steering_wheel || 'left',  // Using English values for steering_wheel
        Boolean(specifications.has_board_computer),
        Boolean(specifications.has_alarm),
        Boolean(specifications.has_air_conditioning),
        Boolean(specifications.has_parking_control),
        Boolean(specifications.has_rear_view_camera),
        Boolean(specifications.has_electric_windows),
        Boolean(specifications.has_climate_control),
        Boolean(specifications.has_cruise_control),
        Boolean(specifications.has_start_stop),
        Boolean(specifications.has_sunroof),
        Boolean(specifications.has_heated_seats),
        Boolean(specifications.has_seat_memory),
        Boolean(specifications.has_abs),
        Boolean(specifications.has_traction_control),
        Boolean(specifications.has_central_locking),
        Boolean(specifications.has_fog_lights),
        Boolean(specifications.has_navigation),
        Boolean(specifications.has_aux),
        Boolean(specifications.has_bluetooth),
        Boolean(specifications.has_multifunction_steering_wheel),
        Boolean(specifications.has_hydraulics),
        Boolean(specifications.has_alloy_wheels),
        Boolean(specifications.has_spare_tire),
        Boolean(specifications.is_disability_adapted),
        Boolean(specifications.has_technical_inspection),
        specifications.clearance_status || 'not_cleared'
      ];
      
      // Log the parameters for debugging
      console.log('[CarCreate] Database parameters:');
      finalSpecParams.forEach((param, index) => {
        console.log(`  Param $${index + 1}: ${typeof param} = ${param}`);
      });
      
      // Extra debugging for transmission specifically
      console.log('[CarCreate] TRANSMISSION DEBUG:');
      console.log('  - Raw transmission from input:', carData.specifications?.transmission || carData.transmission);
      console.log('  - Normalized transmission:', specifications.transmission);
      console.log('  - Final transmission parameter (index 1):', finalSpecParams[1]);
      console.log('  - Parameter $2 (transmission) will be:', finalSpecParams[1]);
      console.log(`  Original transmission value: ${specifications.transmission}`);
      console.log(`  Will use value '${specifications.transmission || 'automatic'}' for transmission`);
      console.log(`  Original steering_wheel value: ${specifications.steering_wheel}`);
      console.log(`  Will use English value '${specifications.steering_wheel || 'left'}' for steering_wheel`);
      
      // since it's not in the database schema yet
      const hasMultifunctionSteeringWheel = Boolean(specifications.has_multifunction_steering_wheel);
      console.log(`Has multifunction steering wheel: ${hasMultifunctionSteeringWheel} (not saved to database)`);
      
      // Verify the transmission and steering_wheel values one last time before database insertion
      console.log(`[CarCreate] Final verification - will use transmission '${specifications.transmission || 'automatic'}' and steering_wheel '${specifications.steering_wheel || 'left'}'`);
      
      // Debug: Check what constraints are actually active on the specifications table
      try {
        const constraintsQuery = await client.query(`
          SELECT conname, pg_get_constraintdef(oid) as definition 
          FROM pg_constraint 
          WHERE conrelid = 'specifications'::regclass::oid 
          AND conname LIKE '%steering_wheel%' OR conname LIKE '%transmission%'
        `);
        console.log('[CarCreate] Active constraints:', constraintsQuery.rows);
      } catch (constraintError) {
        console.log('[CarCreate] Could not check constraints:', constraintError.message);
      }
      
      // Debug: Log the exact values being sent to the database
      console.log('[CarCreate] EXACT VALUES BEING SENT TO DATABASE:');
      console.log('  - steering_wheel:', JSON.stringify(finalSpecParams[12]), 'type:', typeof finalSpecParams[12]);
      console.log('  - transmission:', JSON.stringify(finalSpecParams[1]), 'type:', typeof finalSpecParams[1]);
      
      const specResult = await client.query(
        `INSERT INTO specifications 
        (engine_type, transmission, fuel_type, mileage, mileage_unit, 
        engine_size, cylinders, drive_type,
        airbags_count, interior_material, interior_color, color, steering_wheel,
        has_board_computer, has_alarm, has_air_conditioning,
        has_parking_control, has_rear_view_camera, has_electric_windows,
        has_climate_control, has_cruise_control, has_start_stop,
        has_sunroof, has_heated_seats, has_seat_memory,
        has_abs, has_traction_control, has_central_locking,
        has_fog_lights, has_navigation, has_aux, has_bluetooth,
        has_multifunction_steering_wheel, has_hydraulics, has_alloy_wheels,
        has_spare_tire, is_disability_adapted, has_technical_inspection, clearance_status)
        VALUES 
        ($1 /* engine_type */, 
         $2 /* transmission */, 
         $3 /* fuel_type */, 
         $4 /* mileage */, 
         $5 /* mileage_unit */, 
         $6 /* engine_size */, 
         $7 /* cylinders */, 
         $8 /* drive_type */, 
         $9 /* airbags_count */, 
         $10 /* interior_material */, 
         $11 /* interior_color */, 
         $12 /* color */,
         $13 /* steering_wheel */,
         $14 /* has_board_computer */, 
         $15 /* has_alarm */,
         $16 /* has_air_conditioning */,
         $17 /* has_parking_control */,
         $18 /* has_rear_view_camera */,
         $19 /* has_electric_windows */,
         $20 /* has_climate_control */,
         $21 /* has_cruise_control */,
         $22 /* has_start_stop */,
         $23 /* has_sunroof */,
         $24 /* has_heated_seats */,
         $25 /* has_seat_memory */,
         $26 /* has_abs */,
         $27 /* has_traction_control */,
         $28 /* has_central_locking */,
         $29 /* has_fog_lights */,
         $30 /* has_navigation */,
         $31 /* has_aux */,
         $32 /* has_bluetooth */,
         $33 /* has_multifunction_steering_wheel */,
         $34 /* has_hydraulics */,
         $35 /* has_alloy_wheels */,
         $36 /* has_spare_tire */,
         $37 /* is_disability_adapted */,
         $38 /* has_technical_inspection */,
         $39 /* clearance_status */)
        RETURNING id`,
        finalSpecParams
      );

      // Create location - first check valid enum values for location_type
      console.log(`[CarCreate] Checking valid enum values for location_type before insertion`);
      
      // First, check what are the valid enum values for location_type
      const enumQuery = await client.query(`
        SELECT e.enumlabel
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'location_type'
        ORDER BY e.enumsortorder
      `);
      
      // Get the location data from the request
      const { city, country } = carData.location;
      
      // Default to 'transit' if no valid enum values found
      let validLocationType = 'transit';
      // Always set a default country value to avoid null constraint violation
      let locationCountry = country || 'საქართველო';
      
      // Get all available enum values
      let availableTypes = [];
      if (enumQuery.rows.length > 0) {
        availableTypes = enumQuery.rows.map(row => row.enumlabel);
        console.log(`[CarCreate] Found valid enum values for location_type:`, availableTypes);
      } else {
        // Fallback: check if there's a check constraint that defines valid values
        console.log(`[CarCreate] No enum values found, checking for check constraints`);
        const checkConstraintQuery = await client.query(`
          SELECT pg_get_constraintdef(oid) as constraint_def
          FROM pg_constraint
          WHERE conrelid = 'locations'::regclass::oid
            AND conname LIKE '%location_type%'
        `);
        
        if (checkConstraintQuery.rows.length > 0) {
          const constraintDef = checkConstraintQuery.rows[0].constraint_def;
          console.log(`[CarCreate] Found check constraint:`, constraintDef);
          
          // Try to extract valid values from the constraint definition
          const valueMatch = constraintDef.match(/location_type\s*=\s*'([^']+)'::location_type/g);
          if (valueMatch) {
            availableTypes = valueMatch.map(match => {
              const typeMatch = match.match(/location_type\s*=\s*'([^']+)'::location_type/);
              return typeMatch ? typeMatch[1] : null;
            }).filter(Boolean);
            console.log(`[CarCreate] Extracted valid values from constraint:`, availableTypes);
          }
        }
      }
      
      // Determine the appropriate location_type based on provided country
      if (country && availableTypes.includes('international')) {
        // If country is provided, use international
        validLocationType = 'international';
        locationCountry = country;
        console.log(`[CarCreate] Using 'international' type with country: ${locationCountry}`);
      } else if (availableTypes.includes('georgia')) {
        // If no country or only city is provided, use georgia
        validLocationType = 'georgia';
        locationCountry = 'საქართველო';
        console.log(`[CarCreate] Using 'georgia' type with default country: ${locationCountry}`);
      } else if (availableTypes.includes('transit')) {
        // Fallback to transit
        validLocationType = 'transit';
        locationCountry = 'საქართველო';
        console.log(`[CarCreate] Using 'transit' type with default country: ${locationCountry}`);
      }
      
      console.log(`[CarCreate] Using '${validLocationType}' value for location_type field with country=${locationCountry}`);
      
      // Use the valid location_type value with appropriate country values
      const locationResult = await client.query(
        `INSERT INTO locations (city, country, location_type)
        VALUES ($1, $2, $3) RETURNING id`,
        [
          city,
          locationCountry,
          validLocationType // Using a valid enum value with matching country
        ]
      );

      // Create car with author information
      const carResult = await client.query(
        `INSERT INTO cars 
        (brand_id, category_id, location_id, specification_id, model, title, year, price, 
        description_ka, description_en, description_ru, status, featured, seller_id,
        author_name, author_phone, vin_code)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id`,
        [
          carData.brand_id,
          carData.category_id,
          locationResult.rows[0].id,
          specResult.rows[0].id,
          carData.model,
          carData.title || `${carData.model} ${carData.year}`, // Use provided title or generate one from model and year
          carData.year,
          carData.price,
          carData.description_ka,
          carData.description_en,
          carData.description_ru,
          'available',
          false,
          sellerId,
          carData.author_name || '',   // Include author name
          carData.author_phone || '',   // Include author phone
          carData.vin_code && carData.vin_code.trim() ? carData.vin_code : null // Include VIN code (null if empty)
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
            
            // Validate that all required URLs exist
            if (!processedImage.original || !processedImage.thumbnail || !processedImage.medium || !processedImage.large) {
              console.error(`[CarCreate] Missing required URLs in processedImage:`, processedImage);
              throw new Error('Invalid processed image data');
            }
            
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
        } else if (images && images.length > 0) {
          // No fallback to local storage - S3 is required
          console.log(`[CarCreate] No processed images from S3 and local storage is disabled`);
          throw new Error('Image upload failed. S3 storage is required.');
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
        author_name: carData.author_name || '',
        author_phone: carData.author_phone || '',
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

  // Update a car by ID
  async update(carId, updateData, userId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // DEBUG: დავამუშაოთ ველები, რომლებიც შეიძლება მასივების სახით მოვიდეს
      // მულტიპარტ ფორმის დამუშავების შედეგად
      Object.keys(updateData).forEach(key => {
        if (Array.isArray(updateData[key])) {
          console.log(`[CarCreate.update] Converting array to single value for ${key}:`, updateData[key]);
          // ავიღოთ მასივის პირველი ელემენტი
          updateData[key] = updateData[key][0];
        }
      });

      // Debug cleaned update data
      console.log('[CarCreate.update] Cleaned update data:', JSON.stringify(updateData, null, 2));
      console.log('[CarCreate.update] Author info in update data:', { 
        author_name: updateData.author_name, 
        author_phone: updateData.author_phone 
      });

      // Validate car data including VIN if being updated
      CarValidation.validateCarData(updateData);

      // Check if the car exists
      const carCheckQuery = 'SELECT * FROM cars WHERE id = $1';
      const carCheckResult = await client.query(carCheckQuery, [carId]);
      console.log('[CarCreate.update] Car found:', carCheckResult.rows.length > 0);
      
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
          throw new Error('Unauthorized: You can only update your own car listings');
        }
      }

      // Get existing specification and location data
      const specAndLocationQuery = 'SELECT specification_id, location_id FROM cars WHERE id = $1';
      const specAndLocationResult = await client.query(specAndLocationQuery, [carId]);
      
      if (specAndLocationResult.rows.length === 0) {
        throw new Error('Car data incomplete');
      }
      
      const { specification_id, location_id } = specAndLocationResult.rows[0];
      
      // Update specifications if provided
      if (updateData.specifications) {
        try {
          console.log('[CarCreate.update] Updating specifications...');
          
          // Parse specifications from JSON if it's a string
          let specificationsData = updateData.specifications;
          if (typeof specificationsData === 'string') {
            try {
              specificationsData = JSON.parse(specificationsData);
              console.log('[CarCreate.update] Parsed specifications JSON:', specificationsData);
            } catch (jsonError) {
              console.error('[CarCreate.update] Error parsing specifications JSON:', jsonError);
            }
          }
          
          // Check if specifications exist for this car
          const checkSpecResult = await client.query('SELECT id FROM specifications WHERE car_id = $1', [carId]);
          
          if (checkSpecResult.rows.length > 0) {
            // Get the specifications ID
            const specId = checkSpecResult.rows[0].id;
            console.log(`[CarCreate.update] Found existing specifications with ID: ${specId}`);
            
            // FixedQuery approach for specifications
            const updateSpecQuery = `
              UPDATE specifications SET 
                transmission = $2,
                fuel_type = $3,
                body_type = $4,
                drive_type = $5,
                steering_wheel = $6,
                engine_size = $7,
                mileage = $8,
                mileage_unit = $9,
                color = $10,
                cylinders = $11,
                interior_material = $12,
                interior_color = $13,
                airbags_count = $14,
                engine_type = $15
              WHERE id = $1
            `;
            
            // მომზადებული პარამეტრები
            const specParams = [
              specId,
              specificationsData.transmission || null,
              specificationsData.fuel_type || null,
              specificationsData.body_type || null,
              specificationsData.drive_type || null,
              specificationsData.steering_wheel || null,
              specificationsData.engine_size || null,
              specificationsData.mileage ? parseInt(specificationsData.mileage) : null,
              specificationsData.mileage_unit || null,
              specificationsData.color || null,
              specificationsData.cylinders ? parseInt(specificationsData.cylinders) : null,
              specificationsData.interior_material || null,
              specificationsData.interior_color || null,
              specificationsData.airbags_count ? parseInt(specificationsData.airbags_count) : null,
              specificationsData.engine_type || null
            ];
            
            console.log('[CarCreate.update] Using fixed field update for specifications');
            console.log('[CarCreate.update] SQL Query for updating specifications:', updateSpecQuery.trim());
            console.log('[CarCreate.update] Values for updating specifications:', specParams);
            
            await client.query(updateSpecQuery, specParams);
            console.log('[CarCreate.update] Specifications updated successfully');
          } else {
            console.log('[CarCreate.update] No existing specifications found for this car, creating new ones...');
            // Create new specifications with fixed fields
            const createSpecQuery = `
              INSERT INTO specifications (
                car_id, transmission, fuel_type, body_type, drive_type, 
                steering_wheel, engine_size, mileage, mileage_unit, 
                color, cylinders, interior_material, interior_color, 
                airbags_count, engine_type
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
              RETURNING id
            `;
            
            // მომზადებული პარამეტრები
            const specParams = [
              carId,
              specificationsData.fuel_type || null,
              specificationsData.transmission || null,
              specificationsData.body_type || null,
              specificationsData.drive_type || null,
              specificationsData.steering_wheel || null,
              specificationsData.engine_size || null,
              specificationsData.mileage ? parseInt(specificationsData.mileage) : null,
              specificationsData.mileage_unit || null,
              specificationsData.color || null,
              specificationsData.cylinders ? parseInt(specificationsData.cylinders) : null,
              specificationsData.interior_material || null,
              specificationsData.interior_color || null,
              specificationsData.airbags_count ? parseInt(specificationsData.airbags_count) : null,
              specificationsData.engine_type || null
            ];
            
            await client.query(createSpecQuery, specParams);
            console.log('[CarCreate.update] Created new specifications for the car');
          }
        } catch (error) {
          console.error('[CarCreate.update] Error updating specifications:', error);
          throw error;
        }
      }
      
      // Update location if provided
      if (updateData.location) {
        try {
          console.log('[CarCreate.update] Updating location...');
          
          // Parse location from JSON if it's a string
          let locationData = updateData.location;
          if (typeof locationData === 'string') {
            try {
              locationData = JSON.parse(locationData);
              console.log('[CarCreate.update] Parsed location JSON:', locationData);
            } catch (jsonError) {
              console.error('[CarCreate.update] Error parsing location JSON:', jsonError);
            }
          }
          
          // Check if location exists for this car
          const checkLocResult = await client.query('SELECT id FROM locations WHERE car_id = $1', [carId]);
          
          if (checkLocResult.rows.length > 0) {
            // Get the location ID
            const locId = checkLocResult.rows[0].id;
            console.log(`[CarCreate.update] Found existing location with ID: ${locId}`);
            
            // FixedQuery approach for locations
            const updateLocQuery = `
              UPDATE locations SET 
                city = $2,
                country = $3,
                location_type = $4,
                is_in_transit = $5
              WHERE id = $1
            `;
            
            // მომზადებული პარამეტრები
            const locParams = [
              locId,
              locationData.city || null,
              locationData.country || null,
              locationData.location_type || null,
              locationData.is_in_transit || false
            ];
            
            console.log('[CarCreate.update] Using fixed field update for location');
            console.log('[CarCreate.update] SQL Query for updating location:', updateLocQuery.trim());
            console.log('[CarCreate.update] Values for updating location:', locParams);
            
            await client.query(updateLocQuery, locParams);
            console.log('[CarCreate.update] Location updated successfully');
          } else {
            console.log('[CarCreate.update] No existing location found for this car, creating new one...');
            // Create new location with fixed fields
            const createLocQuery = `
              INSERT INTO locations (
                car_id, city, country, location_type, is_in_transit
              ) VALUES ($1, $2, $3, $4, $5) 
              RETURNING id
            `;
            
            // მომზადებული პარამეტრები
            const locParams = [
              carId,
              locationData.city || null,
              locationData.country || null,
              locationData.location_type || null,
              locationData.is_in_transit || false
            ];
            
            await client.query(createLocQuery, locParams);
            console.log('[CarCreate.update] Created new location for the car');
          }
        } catch (error) {
          console.error('[CarCreate.update] Error updating location:', error);
          throw error;
        }
      }
      
      // Update car data - მივიღოთ უფრო კონტროლირებადი მიდგომა დინამიური ველების ნაცვლად
      console.log('[CarCreate.update] Processing car update with fixed fields approach');

      try {
        // განვსაზღვროთ ველები პირდაპირ, განსაკუთრებით ყურადღება მივაქციოთ ტიპებს
        // შევზღუდოთ განახლებადი ველების რაოდენობა და უზრუნველვყოთ მათი ტიპების სისწორე
        const brand_id = updateData.brand_id ? parseInt(updateData.brand_id) : null;
        const category_id = updateData.category_id ? parseInt(updateData.category_id) : null;
        const year = updateData.year ? parseInt(updateData.year) : null;
        const price = updateData.price ? parseFloat(updateData.price) : null;

        // მოვამზადოთ განახლების მოთხოვნა ფიქსირებული ველებით
        const updateCarQuery = `
          UPDATE cars SET 
            author_name = $1, 
            author_phone = $2, 
            brand_id = $3, 
            model = $4, 
            title = $5,
            category_id = $6,
            year = $7,
            price = $8,
            currency = $9,
            description_ka = $10, 
            description_en = $11, 
            description_ru = $12,
            vin_code = $13
          WHERE id = $14
        `;

        // მოვამზადოთ მნიშვნელობების მასივი სწორი ტიპებით
        const updateParams = [
          updateData.author_name || null,
          updateData.author_phone || null,
          brand_id,
          updateData.model || null,
          updateData.title || null,
          category_id,
          year,
          price,
          updateData.currency || null,
          updateData.description_ka || null,
          updateData.description_en || null,
          updateData.description_ru || null,
          updateData.vin_code && updateData.vin_code.trim() ? updateData.vin_code : null,
          parseInt(carId)
        ];

        // დებაგისთვის დავბეჭდოთ პარამეტრები
        console.log('[CarCreate.update] Fixed SQL query:', updateCarQuery.trim());
        console.log('[CarCreate.update] Parameters with types:');
        updateParams.forEach((param, idx) => {
          console.log(`$${idx + 1}: ${param} (${typeof param}), SQL type: ${param === null ? 'NULL' : typeof param === 'number' ? param % 1 === 0 ? 'INTEGER' : 'FLOAT' : 'TEXT'}`);
        });

        // შევასრულოთ მოთხოვნა
        await client.query(updateCarQuery, updateParams);
        console.log('[CarCreate.update] Car update query executed successfully with fixed fields approach');
      } catch (error) {
        console.error('[CarCreate.update] SQL Error during fixed field update:', error);
        throw error;
      }
      
      await client.query('COMMIT');
      
      // Fetch and return the updated car data
      const updatedCarQuery = `
        SELECT c.*, 
               l.city, l.country, l.location_type,
               s.*
        FROM cars c
        LEFT JOIN locations l ON c.location_id = l.id
        LEFT JOIN specifications s ON c.specification_id = s.id
        WHERE c.id = $1
      `;
      const updatedCarResult = await client.query(updatedCarQuery, [carId]);
      
      if (updatedCarResult.rows.length > 0) {
        const updatedCar = updatedCarResult.rows[0];
        
        // Format the response
        return {
          id: updatedCar.id,
          brand_id: updatedCar.brand_id,
          category_id: updatedCar.category_id,
          model: updatedCar.model,
          title: updatedCar.title,
          year: updatedCar.year,
          price: updatedCar.price,
          currency: updatedCar.currency,
          description_ka: updatedCar.description_ka,
          description_en: updatedCar.description_en,
          description_ru: updatedCar.description_ru,
          status: updatedCar.status,
          author_name: updatedCar.author_name,
          author_phone: updatedCar.author_phone,
          location: {
            city: updatedCar.city,
            country: updatedCar.country,
            location_type: updatedCar.location_type
          },
          specifications: {
            transmission: updatedCar.transmission,
            fuel_type: updatedCar.fuel_type,
            engine_size: updatedCar.engine_size,
            mileage: updatedCar.mileage,
            mileage_unit: updatedCar.mileage_unit,
            steering_wheel: updatedCar.steering_wheel,
            drive_type: updatedCar.drive_type,
            color: updatedCar.color,
            interior_color: updatedCar.interior_color,
            interior_material: updatedCar.interior_material,
            doors: updatedCar.doors
          }
        };
      }
      
      throw new Error('Failed to retrieve updated car data');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating car:', error);
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