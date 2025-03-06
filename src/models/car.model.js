const pool = require('../../config/db.config');

class CarModel {
  static async create(carData, sellerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create specification first
      const specResult = await client.query(
        `INSERT INTO specifications 
        (engine_type, transmission, fuel_type, mileage, engine_size, horsepower, doors, color, body_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          carData.engine_type,
          carData.transmission,
          carData.fuel_type,
          carData.mileage,
          carData.engine_size,
          carData.horsepower,
          carData.doors,
          carData.color,
          carData.body_type
        ]
      );

      // Create location
      const locationResult = await client.query(
        `INSERT INTO locations (city, state, country)
        VALUES ($1, $2, $3) RETURNING id`,
        [carData.city, carData.state, carData.country]
      );

      // Create car
      const carResult = await client.query(
        `INSERT INTO cars 
        (brand_id, category_id, location_id, specification_id, model, year, price, 
        description, status, featured, seller_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          carData.brand_id,
          carData.category_id,
          locationResult.rows[0].id,
          specResult.rows[0].id,
          carData.model,
          carData.year,
          carData.price,
          carData.description,
          carData.status || 'available',
          carData.featured || false,
          sellerId
        ]
      );

      // Add images if provided
      if (carData.images && carData.images.length > 0) {
        for (let i = 0; i < carData.images.length; i++) {
          await client.query(
            `INSERT INTO car_images (car_id, image_url, is_primary)
            VALUES ($1, $2, $3)`,
            [carResult.rows[0].id, carData.images[i], i === 0]
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

  static async findById(id) {
    const query = `
      SELECT c.*, 
        json_build_object(
          'id', s.id,
          'engine_type', s.engine_type,
          'transmission', s.transmission,
          'fuel_type', s.fuel_type,
          'mileage', s.mileage,
          'engine_size', s.engine_size,
          'horsepower', s.horsepower,
          'doors', s.doors,
          'color', s.color,
          'body_type', s.body_type
        ) as specifications,
        json_build_object(
          'id', l.id,
          'city', l.city,
          'state', l.state,
          'country', l.country
        ) as location,
        json_agg(DISTINCT ci.*) as images,
        b.name as brand_name,
        cat.name as category_name
      FROM cars c
      LEFT JOIN specifications s ON c.specification_id = s.id
      LEFT JOIN locations l ON c.location_id = l.id
      LEFT JOIN car_images ci ON c.id = ci.car_id
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = $1
      GROUP BY c.id, s.id, l.id, b.name, cat.name
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll({ 
    page = 1, 
    limit = 10, 
    sort = 'created_at', 
    order = 'DESC',
    filters = {} 
  }) {
    const offset = (page - 1) * limit;
    let params = [limit, offset];
    let paramCounter = 3;
    
    // Build filter conditions
    let filterConditions = [];
    if (filters.brand_id) {
      filterConditions.push(`c.brand_id = $${paramCounter}`);
      params.push(filters.brand_id);
      paramCounter++;
    }
    if (filters.category_id) {
      filterConditions.push(`c.category_id = $${paramCounter}`);
      params.push(filters.category_id);
      paramCounter++;
    }
    if (filters.price_min) {
      filterConditions.push(`c.price >= $${paramCounter}`);
      params.push(filters.price_min);
      paramCounter++;
    }
    if (filters.price_max) {
      filterConditions.push(`c.price <= $${paramCounter}`);
      params.push(filters.price_max);
      paramCounter++;
    }
    if (filters.year_min) {
      filterConditions.push(`c.year >= $${paramCounter}`);
      params.push(filters.year_min);
      paramCounter++;
    }
    if (filters.year_max) {
      filterConditions.push(`c.year <= $${paramCounter}`);
      params.push(filters.year_max);
      paramCounter++;
    }
    if (filters.location) {
      filterConditions.push(`(l.city ILIKE $${paramCounter} OR l.state ILIKE $${paramCounter} OR l.country ILIKE $${paramCounter})`);
      params.push(`%${filters.location}%`);
      paramCounter++;
    }

    const whereClause = filterConditions.length > 0 
      ? 'WHERE ' + filterConditions.join(' AND ')
      : '';

    // Validate and sanitize sort column
    const validSortColumns = ['price', 'year', 'created_at', 'views_count'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const query = `
      SELECT 
        c.*,
        json_build_object(
          'id', s.id,
          'engine_type', s.engine_type,
          'transmission', s.transmission,
          'fuel_type', s.fuel_type,
          'mileage', s.mileage,
          'engine_size', s.engine_size,
          'horsepower', s.horsepower,
          'doors', s.doors,
          'color', s.color,
          'body_type', s.body_type
        ) as specifications,
        json_build_object(
          'id', l.id,
          'city', l.city,
          'state', l.state,
          'country', l.country
        ) as location,
        (
          SELECT json_agg(ci.*)
          FROM car_images ci
          WHERE ci.car_id = c.id
        ) as images,
        b.name as brand_name,
        cat.name as category_name,
        COUNT(*) OVER() as total_count
      FROM cars c
      LEFT JOIN specifications s ON c.specification_id = s.id
      LEFT JOIN locations l ON c.location_id = l.id
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      ${whereClause}
      GROUP BY c.id, s.id, l.id, b.name, cat.name
      ORDER BY c.${sortColumn} ${sortOrder}
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, params);
    const cars = result.rows;
    const totalCount = cars.length > 0 ? parseInt(cars[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      cars,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalCount,
        items_per_page: limit
      }
    };
  }

  static async update(id, carData, sellerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify car ownership
      const carCheck = await client.query(
        'SELECT seller_id FROM cars WHERE id = $1',
        [id]
      );
      
      if (!carCheck.rows[0] || carCheck.rows[0].seller_id !== sellerId) {
        throw new Error('Unauthorized to update this car');
      }

      // Update specifications
      if (carData.specifications) {
        await client.query(
          `UPDATE specifications
          SET engine_type = COALESCE($1, engine_type),
              transmission = COALESCE($2, transmission),
              fuel_type = COALESCE($3, fuel_type),
              mileage = COALESCE($4, mileage),
              engine_size = COALESCE($5, engine_size),
              horsepower = COALESCE($6, horsepower),
              doors = COALESCE($7, doors),
              color = COALESCE($8, color),
              body_type = COALESCE($9, body_type)
          WHERE id = (SELECT specification_id FROM cars WHERE id = $10)`,
          [
            carData.specifications.engine_type,
            carData.specifications.transmission,
            carData.specifications.fuel_type,
            carData.specifications.mileage,
            carData.specifications.engine_size,
            carData.specifications.horsepower,
            carData.specifications.doors,
            carData.specifications.color,
            carData.specifications.body_type,
            id
          ]
        );
      }

      // Update location
      if (carData.location) {
        await client.query(
          `UPDATE locations
          SET city = COALESCE($1, city),
              state = COALESCE($2, state),
              country = COALESCE($3, country)
          WHERE id = (SELECT location_id FROM cars WHERE id = $4)`,
          [
            carData.location.city,
            carData.location.state,
            carData.location.country,
            id
          ]
        );
      }

      // Update car
      const updateFields = [];
      const values = [];
      let paramCounter = 1;

      const updateableFields = [
        'brand_id', 'category_id', 'model', 'year', 'price',
        'description', 'status', 'featured'
      ];

      updateableFields.forEach(field => {
        if (field in carData) {
          updateFields.push(`${field} = $${paramCounter}`);
          values.push(carData[field]);
          paramCounter++;
        }
      });

      if (updateFields.length > 0) {
        values.push(id);
        const carResult = await client.query(
          `UPDATE cars
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCounter}
          RETURNING *`,
          values
        );
      }

      // Update images if provided
      if (carData.images) {
        // Delete existing images
        await client.query('DELETE FROM car_images WHERE car_id = $1', [id]);
        
        // Insert new images
        for (let i = 0; i < carData.images.length; i++) {
          await client.query(
            `INSERT INTO car_images (car_id, image_url, is_primary)
            VALUES ($1, $2, $3)`,
            [id, carData.images[i], i === 0]
          );
        }
      }

      await client.query('COMMIT');
      return this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id, sellerId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify car ownership
      const carCheck = await client.query(
        'SELECT seller_id FROM cars WHERE id = $1',
        [id]
      );
      
      if (!carCheck.rows[0] || carCheck.rows[0].seller_id !== sellerId) {
        throw new Error('Unauthorized to delete this car');
      }

      // Get all image URLs before deletion
      const imageResult = await client.query(
        'SELECT image_url, thumbnail_url, medium_url, large_url FROM car_images WHERE car_id = $1',
        [id]
      );

      // Delete from database
      await client.query('DELETE FROM cars WHERE id = $1', [id]);

      await client.query('COMMIT');

      // After successful DB deletion, delete images from S3
      const { s3, bucket } = require('../../config/storage.config');
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

  static async incrementViews(id) {
    const query = 'UPDATE cars SET views_count = views_count + 1 WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async addImages(carId, images) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert new images
      for (let i = 0; i < images.length; i++) {
        await client.query(
          `INSERT INTO car_images (car_id, image_url, thumbnail_url, medium_url, large_url, is_primary)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            carId,
            images[i].original,
            images[i].thumbnail,
            images[i].medium,
            images[i].large,
            i === 0
          ]
        );
      }

      await client.query('COMMIT');
      return this.findById(carId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getBrands() {
    const query = 'SELECT * FROM brands ORDER BY name ASC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async getModelsByBrand(brandId) {
    const query = `
      SELECT DISTINCT model 
      FROM cars 
      WHERE brand_id = $1 
      ORDER BY model ASC
    `;
    const result = await pool.query(query, [brandId]);
    return result.rows;
  }

  static async searchCars({
    searchQuery,
    brandId,
    categoryId,
    model,
    yearMin,
    yearMax,
    priceMin,
    priceMax,
    specifications = {},
    location,
    page = 1,
    limit = 10,
    sort = 'created_at',
    order = 'DESC'
  }) {
    const values = [];
    let paramCounter = 1;
    let conditions = ['status = \'available\''];
    
    // Full-text search
    if (searchQuery) {
      values.push(searchQuery);
      conditions.push(`search_vector @@ plainto_tsquery('english', $${paramCounter})`);
      paramCounter++;
    }

    // Basic filters
    if (brandId) {
      values.push(brandId);
      conditions.push(`brand_id = $${paramCounter}`);
      paramCounter++;
    }

    if (categoryId) {
      values.push(categoryId);
      conditions.push(`category_id = $${paramCounter}`);
      paramCounter++;
    }

    if (model) {
      values.push(`%${model}%`);
      conditions.push(`model ILIKE $${paramCounter}`);
      paramCounter++;
    }

    // Range filters
    if (yearMin) {
      values.push(yearMin);
      conditions.push(`year >= $${paramCounter}`);
      paramCounter++;
    }

    if (yearMax) {
      values.push(yearMax);
      conditions.push(`year <= $${paramCounter}`);
      paramCounter++;
    }

    if (priceMin) {
      values.push(priceMin);
      conditions.push(`price >= $${paramCounter}`);
      paramCounter++;
    }

    if (priceMax) {
      values.push(priceMax);
      conditions.push(`price <= $${paramCounter}`);
      paramCounter++;
    }

    // Specification filters
    const specFields = [
      'engine_type', 'transmission', 'fuel_type', 'body_type',
      'color', 'doors'
    ];

    specFields.forEach(field => {
      if (specifications[field]) {
        values.push(specifications[field]);
        conditions.push(`s.${field} = $${paramCounter}`);
        paramCounter++;
      }
    });

    if (specifications.mileage_max) {
      values.push(specifications.mileage_max);
      conditions.push(`s.mileage <= $${paramCounter}`);
      paramCounter++;
    }

    // Location filter
    if (location) {
      values.push(`%${location}%`);
      conditions.push(`(
        l.city ILIKE $${paramCounter} OR 
        l.state ILIKE $${paramCounter} OR 
        l.country ILIKE $${paramCounter}
      )`);
      paramCounter++;
    }

    // Add pagination parameters
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    // Construct the final query
    const query = `
      WITH filtered_cars AS (
        SELECT 
          c.*,
          json_build_object(
            'id', s.id,
            'engine_type', s.engine_type,
            'transmission', s.transmission,
            'fuel_type', s.fuel_type,
            'mileage', s.mileage,
            'engine_size', s.engine_size,
            'horsepower', s.horsepower,
            'doors', s.doors,
            'color', s.color,
            'body_type', s.body_type
          ) as specifications,
          json_build_object(
            'id', l.id,
            'city', l.city,
            'state', l.state,
            'country', l.country
          ) as location,
          b.name as brand_name,
          cat.name as category_name,
          (
            SELECT json_agg(ci.*)
            FROM car_images ci
            WHERE ci.car_id = c.id
          ) as images,
          COUNT(*) OVER() as total_count
        FROM cars c
        LEFT JOIN specifications s ON c.specification_id = s.id
        LEFT JOIN locations l ON c.location_id = l.id
        LEFT JOIN brands b ON c.brand_id = b.id
        LEFT JOIN categories cat ON c.category_id = cat.id
        WHERE ${conditions.join(' AND ')}
      )
      SELECT *
      FROM filtered_cars
      ORDER BY 
        CASE WHEN $${paramCounter + 2} = 'DESC' THEN
          CASE $${paramCounter + 1}
            WHEN 'price' THEN price
            WHEN 'year' THEN year::text
            WHEN 'views_count' THEN views_count::text
            ELSE created_at::text
          END
        END DESC,
        CASE WHEN $${paramCounter + 2} = 'ASC' THEN
          CASE $${paramCounter + 1}
            WHEN 'price' THEN price
            WHEN 'year' THEN year::text
            WHEN 'views_count' THEN views_count::text
            ELSE created_at::text
          END
        END ASC
      LIMIT $${paramCounter - 1}
      OFFSET $${paramCounter}
    `;

    values.push(sort, order);
    const result = await pool.query(query, values);
    
    const cars = result.rows;
    const totalCount = cars.length > 0 ? parseInt(cars[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      cars,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalCount,
        items_per_page: limit
      }
    };
  }

  static async deleteAll() {
    const query = 'DELETE FROM cars';
    await pool.query(query);
  }
}

module.exports = CarModel;