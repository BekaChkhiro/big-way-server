const pool = require('../../../config/db.config');

class CarSearch {
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
    
    let filterConditions = [];
    if (filters.type) {
      filterConditions.push(`cat.type = $${paramCounter}`);
      params.push(filters.type);
      paramCounter++;
    }
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
      filterConditions.push(`(l.city ILIKE $${paramCounter} OR l.country ILIKE $${paramCounter})`);
      params.push(`%${filters.location}%`);
      paramCounter++;
    }
    const whereClause = filterConditions.length > 0 
      ? 'WHERE ' + filterConditions.join(' AND ')
      : '';

    const validSortColumns = ['price', 'year', 'created_at', 'views_count'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const query = `
      SELECT 
        c.*,
        (
          SELECT row_to_json(spec)
          FROM (
            SELECT 
              s.id,
              s.mileage,
              s.fuel_type,
              s.transmission,
              s.engine_type,
              s.drive_type,
              s.body_type,
              s.interior_color,
              s.color,
              s.has_navigation,
              s.has_bluetooth,
              s.has_sunroof,
              s.has_air_conditioning,
              s.has_parking_control,
              s.has_rear_view_camera,
              s.has_seat_heating
            FROM specifications s 
            WHERE s.id = c.specification_id
          ) spec
        ) as specifications,
        (
          SELECT row_to_json(loc)
          FROM (
            SELECT 
              l.id,
              l.city,
              l.country,
              l.location_type,
              l.is_transit
            FROM locations l 
            WHERE l.id = c.location_id
          ) loc
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

  static async searchCars({
    searchQuery,
    carType,
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
    
    if (searchQuery) {
      values.push(searchQuery);
      conditions.push(`search_vector @@ plainto_tsquery('english', $${paramCounter})`);
      paramCounter++;
    }

    if (carType) {
      values.push(carType);
      conditions.push(`(SELECT type FROM categories WHERE id = c.category_id) = $${paramCounter}`);
      paramCounter++;
    }

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

    const specFields = [
      'engine_type', 'transmission', 'fuel_type',
      'color', 'doors', 'steering_wheel', 'drive_type',
      'interior_material', 'interior_color'
    ];

    specFields.forEach(field => {
      if (specifications[field]) {
        values.push(specifications[field]);
        conditions.push(`s.${field} = $${paramCounter}`);
        paramCounter++;
      }
    });

    if (specifications.is_turbo !== undefined) {
      values.push(specifications.is_turbo);
      conditions.push(`s.is_turbo = $${paramCounter}`);
      paramCounter++;
    }

    if (specifications.has_catalyst !== undefined) {
      values.push(specifications.has_catalyst);
      conditions.push(`s.has_catalyst = $${paramCounter}`);
      paramCounter++;
    }

    if (specifications.mileage_max) {
      values.push(specifications.mileage_max);
      conditions.push(`s.mileage <= $${paramCounter}`);
      paramCounter++;
    }

    if (specifications.engine_size_min) {
      values.push(specifications.engine_size_min);
      conditions.push(`s.engine_size >= $${paramCounter}`);
      paramCounter++;
    }

    if (specifications.engine_size_max) {
      values.push(specifications.engine_size_max);
      conditions.push(`s.engine_size <= $${paramCounter}`);
      paramCounter++;
    }

    if (location) {
      values.push(`%${location}%`);
      conditions.push(`(
        l.city ILIKE $${paramCounter} OR 
        l.state ILIKE $${paramCounter} OR 
        l.country ILIKE $${paramCounter}
      )`);
      paramCounter++;
    }

    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const query = `
      SELECT 
        c.*,
        (
          SELECT row_to_json(spec)
          FROM (
            SELECT 
              s.id,
              s.engine_type,
              s.transmission,
              s.fuel_type,
              s.mileage,
              s.mileage_unit,
              s.engine_size,
              s.horsepower,
              s.doors,
              s.color,

              s.steering_wheel,
              s.drive_type,
              s.interior_material,
              s.interior_color,
              s.is_turbo,
              s.cylinders,
              s.manufacture_month
            FROM specifications s 
            WHERE s.id = c.specification_id
          ) spec
        ) as specifications,
        (
          SELECT row_to_json(loc)
          FROM (
            SELECT 
              l.id,
              l.city,
              l.state,
              l.country
            FROM locations l
            WHERE l.id = c.location_id
          ) loc
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
      GROUP BY c.id, s.id, l.id, b.name, cat.name
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

  static async findSimilarCars(carId, limit = 4) {
    const { CarModel } = require('./base');
    
    const originalCar = await CarModel.findById(carId);
    if (!originalCar) {
      throw new Error('Car not found');
    }

    const query = `
      SELECT 
        c.*,
        (
          SELECT row_to_json(spec)
          FROM (
            SELECT 
              s.id,
              s.engine_type,
              s.transmission,
              s.fuel_type,
              s.mileage,
              s.engine_size,
              s.horsepower,
              s.doors,
              s.color,

              s.steering_wheel,
              s.drive_type,
              s.interior_material,
              s.interior_color
            FROM specifications s 
            WHERE s.id = c.specification_id
          ) spec
        ) as specifications,
        (
          SELECT row_to_json(loc)
          FROM (
            SELECT 
              l.id,
              l.city,
              l.state,
              l.country
            FROM locations l
            WHERE l.id = c.location_id
          ) loc
        ) as location,
        (
          SELECT json_agg(ci.*)
          FROM car_images ci
          WHERE ci.car_id = c.id
        ) as images,
        b.name as brand_name,
        cat.name as category_name
      FROM cars c
      LEFT JOIN specifications s ON c.specification_id = s.id
      LEFT JOIN locations l ON c.location_id = l.id
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id != $1
        AND c.status = 'available'
        AND (
          c.brand_id = $2
          OR c.category_id = $3
          OR (
            c.price BETWEEN $4 * 0.8 AND $4 * 1.2
            AND c.year BETWEEN $5 - 2 AND $5 + 2
          )
        )
      GROUP BY c.id, s.id, l.id, b.name, cat.name
      ORDER BY
        CASE 
          WHEN c.brand_id = $2 AND c.category_id = $3 THEN 1
          WHEN c.brand_id = $2 THEN 2
          WHEN c.category_id = $3 THEN 3
          ELSE 4
        END,
        ABS(c.price - $4),
        ABS(c.year - $5)
      LIMIT $6
    `;

    const result = await pool.query(query, [
      carId,
      originalCar.brand_id,
      originalCar.category_id,
      originalCar.price,
      originalCar.year,
      limit
    ]);

    return result.rows;
  }
}

module.exports = CarSearch;