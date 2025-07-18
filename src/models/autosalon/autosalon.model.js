const { pg: pool } = require('../../../config/db.config');

class AutosalonModel {
  // Create autosalon profile
  static async create(autosalonData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `INSERT INTO autosalon_profiles 
        (user_id, company_name, logo_url, established_year, website_url, address, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          autosalonData.user_id,
          autosalonData.company_name,
          autosalonData.logo_url || null,
          autosalonData.established_year || null,
          autosalonData.website_url || null,
          autosalonData.address || null
        ]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get autosalon by ID
  static async getById(id) {
    const query = `
      SELECT 
        ap.*,
        u.id as user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.created_at as user_created_at,
        COUNT(c.id) as car_count
      FROM autosalon_profiles ap
      LEFT JOIN users u ON ap.user_id = u.id
      LEFT JOIN cars c ON c.seller_id = u.id
      WHERE ap.id = $1
      GROUP BY ap.id, u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at
    `;
    
    const result = await pool.query(query, [id]);
    const row = result.rows[0];
    
    if (!row) return null;
    
    console.log('📱 Autosalon model getById - structuring data with phone:', row.phone);
    
    // Structure the data properly with user nested object
    return {
      id: row.id,
      user_id: row.user_id,
      company_name: row.company_name,
      logo_url: row.logo_url,
      established_year: row.established_year,
      website_url: row.website_url,
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

  // Get autosalon by user ID
  static async getByUserId(userId) {
    const query = `
      SELECT 
        ap.*,
        u.id as user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.created_at as user_created_at,
        COUNT(c.id) as car_count
      FROM autosalon_profiles ap
      LEFT JOIN users u ON ap.user_id = u.id
      LEFT JOIN cars c ON c.seller_id = u.id
      WHERE ap.user_id = $1
      GROUP BY ap.id, u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at
    `;
    
    const result = await pool.query(query, [userId]);
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

  // Get all autosalons with pagination
  static async getAll({ page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' }) {
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereClause = `WHERE (ap.company_name ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM autosalon_profiles ap
      LEFT JOIN users u ON ap.user_id = u.id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Main query
    const query = `
      SELECT 
        ap.*,
        u.id as user_id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.created_at as user_created_at,
        COUNT(c.id) as car_count
      FROM autosalon_profiles ap
      LEFT JOIN users u ON ap.user_id = u.id
      LEFT JOIN cars c ON c.seller_id = u.id
      ${whereClause}
      GROUP BY ap.id, u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at
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

  // Update autosalon profile
  static async update(id, updateData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const fields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'id') {
          fields.push(`${key} = $${paramIndex}`);
          values.push(updateData[key]);
          paramIndex++;
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE autosalon_profiles 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete autosalon profile
  static async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        'DELETE FROM autosalon_profiles WHERE id = $1 RETURNING *',
        [id]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = AutosalonModel;