const { pg: pool } = require('../../config/db.config');
const { USER_ROLES } = require('../constants/roles');
const bcrypt = require('bcrypt');
const { processAndUpload } = require('../middlewares/upload.middleware');

class DealerService {
  // Create new dealer with user account (Admin only)
  static async createDealer(userData, dealerData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if email already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('ამ ელ-ფოსტით მომხმარებელი უკვე არსებობს');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user account
      const userResult = await client.query(
        `INSERT INTO users (username, email, password, first_name, last_name, phone, role, age, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, username, email, first_name, last_name, phone, role, created_at`,
        [
          userData.username,
          userData.email,
          hashedPassword,
          userData.first_name,
          userData.last_name,
          userData.phone || null,
          USER_ROLES.DEALER,
          30, // Default age for dealer users
          userData.gender || 'other'
        ]
      );

      const user = userResult.rows[0];

      // Create dealer profile
      const dealerResult = await client.query(
        `INSERT INTO dealer_profiles 
         (user_id, company_name, logo_url, established_year, website_url, social_media_url, address, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [
          user.id,
          dealerData.company_name,
          dealerData.logo_url || null,
          dealerData.established_year || null,
          dealerData.website_url || null,
          dealerData.social_media_url || null,
          dealerData.address || null
        ]
      );

      const dealer = dealerResult.rows[0];

      await client.query('COMMIT');

      return {
        id: dealer.id,
        user_id: user.id,
        company_name: dealer.company_name,
        logo_url: dealer.logo_url,
        established_year: dealer.established_year,
        website_url: dealer.website_url,
        social_media_url: dealer.social_media_url,
        address: dealer.address,
        created_at: dealer.created_at,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          role: user.role,
          created_at: user.created_at
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get dealer by ID
  static async getDealerById(id) {
    const query = `
      SELECT 
        dp.*,
        u.id as user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.created_at as user_created_at,
        COUNT(c.id) as car_count
      FROM dealer_profiles dp
      LEFT JOIN users u ON dp.user_id = u.id
      LEFT JOIN cars c ON c.seller_id = u.id
      WHERE dp.id = $1
      GROUP BY dp.id, u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at
    `;
    
    const result = await pool.query(query, [id]);
    const row = result.rows[0];
    
    if (!row) return null;
    
    // Structure the data properly with user nested object
    return {
      id: row.id,
      user_id: row.user_id,
      company_name: row.company_name,
      logo_url: row.logo_url,
      established_year: row.established_year,
      website_url: row.website_url,
      social_media_url: row.social_media_url,
      address: row.address,
      created_at: row.created_at,
      updated_at: row.updated_at,
      car_count: row.car_count,
      user: {
        id: row.user_id,
        username: row.username,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone,
        role: row.role,
        created_at: row.user_created_at
      }
    };
  }

  // Get all dealers with pagination and search
  static async getAllDealers({ page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' }) {
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereClause = `WHERE (dp.company_name ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM dealer_profiles dp
      LEFT JOIN users u ON dp.user_id = u.id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Main query
    const query = `
      SELECT 
        dp.*,
        u.id as user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.created_at as user_created_at,
        COUNT(c.id) as car_count
      FROM dealer_profiles dp
      LEFT JOIN users u ON dp.user_id = u.id
      LEFT JOIN cars c ON c.seller_id = u.id
      ${whereClause}
      GROUP BY dp.id, u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const result = await pool.query(query, queryParams);
    
    // Structure the data properly with user nested object
    const structuredData = result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      company_name: row.company_name,
      logo_url: row.logo_url,
      established_year: row.established_year,
      website_url: row.website_url,
      social_media_url: row.social_media_url,
      address: row.address,
      created_at: row.created_at,
      updated_at: row.updated_at,
      car_count: row.car_count,
      user: {
        id: row.user_id,
        username: row.username,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone,
        role: row.role,
        created_at: row.user_created_at
      }
    }));
    
    return {
      data: structuredData,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Update dealer profile (Admin only)
  static async updateDealer(id, updateData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if dealer exists
      const dealerCheck = await client.query(
        'SELECT * FROM dealer_profiles WHERE id = $1',
        [id]
      );

      if (dealerCheck.rows.length === 0) {
        throw new Error('დილერი ვერ მოიძებნა');
      }

      // Update dealer profile
      const fields = [];
      const values = [];
      let paramIndex = 1;

      const allowedFields = ['company_name', 'logo_url', 'established_year', 'website_url', 'social_media_url', 'address'];
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && allowedFields.includes(key)) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(updateData[key]);
          paramIndex++;
        }
      });

      if (fields.length === 0) {
        throw new Error('განახლებისთვის ველები არ არის მითითებული');
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const updateQuery = `
        UPDATE dealer_profiles 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(updateQuery, values);
      const updatedDealer = result.rows[0];

      // Get user data
      const userQuery = `
        SELECT id, username, email, first_name, last_name, phone, role, created_at
        FROM users 
        WHERE id = $1
      `;
      const userResult = await client.query(userQuery, [updatedDealer.user_id]);

      await client.query('COMMIT');

      return {
        ...updatedDealer,
        user: userResult.rows[0]
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete dealer and associated user account (Admin only)
  static async deleteDealer(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get dealer info to get user_id
      const dealerResult = await client.query(
        'SELECT user_id FROM dealer_profiles WHERE id = $1',
        [id]
      );

      if (dealerResult.rows.length === 0) {
        throw new Error('დილერი ვერ მოიძებნა');
      }

      const userId = dealerResult.rows[0].user_id;

      // Delete dealer profile
      await client.query('DELETE FROM dealer_profiles WHERE id = $1', [id]);

      // Delete user account
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      await client.query('COMMIT');

      return { success: true, message: 'დილერი წარმატებით წაიშალა' };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Upload dealer logo (Admin only)
  static async uploadLogo(id, file) {
    try {
      // Process and upload logo to AWS S3
      const processedImages = await processAndUpload([file]);
      const logoUrl = processedImages[0].original;

      // Update dealer with logo URL
      const updateQuery = `
        UPDATE dealer_profiles 
        SET logo_url = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [logoUrl, id]);
      
      if (result.rows.length === 0) {
        throw new Error('დილერი ვერ მოიძებნა');
      }

      return {
        logo_url: logoUrl,
        dealer: result.rows[0]
      };

    } catch (error) {
      throw error;
    }
  }

  // Get dealer's cars with pagination and filters
  static async getDealerCars(dealerId, filters = {}) {
    const {
      page = 1,
      limit = 12,
      priceMin,
      priceMax,
      yearMin,
      yearMax,
      brandId,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = filters;

    const offset = (page - 1) * limit;

    // First get the dealer to get the user_id
    const dealer = await this.getDealerById(dealerId);
    if (!dealer) {
      throw new Error('დილერი ვერ მოიძებნა');
    }

    // Build WHERE clause for filters
    let whereClause = 'WHERE c.seller_id = $1';
    const queryParams = [dealer.user_id];
    let paramIndex = 2;

    if (priceMin) {
      whereClause += ` AND c.price >= $${paramIndex}`;
      queryParams.push(priceMin);
      paramIndex++;
    }

    if (priceMax) {
      whereClause += ` AND c.price <= $${paramIndex}`;
      queryParams.push(priceMax);
      paramIndex++;
    }

    if (yearMin) {
      whereClause += ` AND c.year >= $${paramIndex}`;
      queryParams.push(yearMin);
      paramIndex++;
    }

    if (yearMax) {
      whereClause += ` AND c.year <= $${paramIndex}`;
      queryParams.push(yearMax);
      paramIndex++;
    }

    if (brandId) {
      whereClause += ` AND c.brand_id = $${paramIndex}`;
      queryParams.push(brandId);
      paramIndex++;
    }

    // Query to get cars with proper images structure
    const query = `
      SELECT 
        c.*,
        b.name as brand,
        cat.name as category_name,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', ci.id,
            'url', ci.url,
            'thumbnail_url', ci.thumbnail_url,
            'medium_url', ci.medium_url,
            'large_url', ci.large_url,
            'is_featured', ci.is_featured
          ) ORDER BY ci.is_featured DESC, ci.id)
          FROM car_images ci
          WHERE ci.car_id = c.id
          ), '[]'::json
        ) as images,
        COALESCE(
          (SELECT json_build_object(
            'engine_type', cs.engine_type,
            'transmission', cs.transmission,
            'fuel_type', cs.fuel_type,
            'mileage', cs.mileage,
            'engine_size', cs.engine_size,
            'steering_wheel', cs.steering_wheel,
            'drive_type', cs.drive_type,
            'interior_material', cs.interior_material,
            'interior_color', cs.interior_color
          )
          FROM car_specifications cs
          WHERE cs.id = c.specification_id
          ), '{}'::json
        ) as specifications,
        COALESCE(
          (SELECT json_build_object(
            'city', l.city,
            'country', l.country
          )
          FROM locations l
          WHERE l.id = c.location_id
          ), '{}'::json
        ) as location
      FROM cars c
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      ${whereClause}
      ORDER BY c.${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const result = await pool.query(query, queryParams);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM cars c
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset for count
    
    return {
      cars: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].total / limit)
    };
  }
}

module.exports = DealerService;