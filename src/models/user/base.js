const { pg: pool } = require('../../../config/db.config');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../../../config/jwt.config');

class UserModel {
  static async findById(id) {
    try {
      // First try with a query that includes all possible fields
      const query = `
        SELECT id, username, email, first_name, last_name, age, gender, phone, role, created_at
        FROM users 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in findById with full fields:', error);
      
      // If that fails, try with minimal fields that should exist in all environments
      try {
        const minimalQuery = `
          SELECT id, username, email, role, created_at
          FROM users 
          WHERE id = $1
        `;
        const result = await pool.query(minimalQuery, [id]);
        return result.rows[0];
      } catch (fallbackError) {
        console.error('Error in findById with minimal fields:', fallbackError);
        throw fallbackError;
      }
    }
  }

  static async findByEmail(email) {
    try {
      // First try with specific fields instead of SELECT *
      const query = `
        SELECT id, username, email, password, first_name, last_name, age, gender, phone, role, created_at
        FROM users 
        WHERE email = $1
      `;
      const result = await pool.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in findByEmail with specific fields:', error);
      
      // If that fails, try with minimal fields
      try {
        const minimalQuery = `
          SELECT id, username, email, password, role, created_at
          FROM users 
          WHERE email = $1
        `;
        const result = await pool.query(minimalQuery, [email]);
        return result.rows[0];
      } catch (fallbackError) {
        console.error('Error in findByEmail with minimal fields:', fallbackError);
        throw fallbackError;
      }
    }
  }

  static async findByUsername(username) {
    try {
      // First try with specific fields instead of SELECT *
      const query = `
        SELECT id, username, email, password, first_name, last_name, age, gender, phone, role, created_at
        FROM users 
        WHERE username = $1
      `;
      const result = await pool.query(query, [username]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in findByUsername with specific fields:', error);
      
      // If that fails, try with minimal fields
      try {
        const minimalQuery = `
          SELECT id, username, email, password, role, created_at
          FROM users 
          WHERE username = $1
        `;
        const result = await pool.query(minimalQuery, [username]);
        return result.rows[0];
      } catch (fallbackError) {
        console.error('Error in findByUsername with minimal fields:', fallbackError);
        throw fallbackError;
      }
    }
  }

  static async findAll() {
    try {
      // Query that includes all user fields plus car count
      const query = `
        SELECT 
          u.id, 
          u.username, 
          u.email, 
          u.first_name, 
          u.last_name, 
          u.age, 
          u.phone, 
          u.role, 
          u.created_at,
          COALESCE(c.car_count, 0) as car_count
        FROM users u
        LEFT JOIN (
          SELECT seller_id, COUNT(*) as car_count
          FROM cars
          GROUP BY seller_id
        ) c ON u.id = c.seller_id
        ORDER BY u.created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in findAll with car count:', error);
      
      // If that fails, try with minimal fields that should exist in all environments
      try {
        const minimalQuery = `
          SELECT 
            u.id, 
            u.username, 
            u.email, 
            u.role, 
            u.created_at,
            COALESCE(c.car_count, 0) as car_count
          FROM users u
          LEFT JOIN (
            SELECT seller_id, COUNT(*) as car_count
            FROM cars
            GROUP BY seller_id
          ) c ON u.id = c.seller_id
          ORDER BY u.created_at DESC
        `;
        const result = await pool.query(minimalQuery);
        return result.rows;
      } catch (fallbackError) {
        console.error('Error in findAll with minimal fields:', fallbackError);
        throw fallbackError;
      }
    }
  }

  static generateToken(user) {
    return generateToken({ 
      id: user.id,
      role: user.role
    });
  }

  static async validateUser(id) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

module.exports = UserModel;