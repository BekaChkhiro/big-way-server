const pool = require('../../config/db.config');
const bcrypt = require('bcrypt');

class UserModel {
  static async create(userData) {
    const { username, email, password, first_name, last_name, age, gender, phone } = userData;
    
    // Validate password
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (username, email, password, first_name, last_name, age, gender, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, email, first_name, last_name, age, gender, phone, role, created_at
    `;
    
    try {
      const result = await pool.query(query, [
        username, 
        email, 
        hashedPassword, 
        first_name, 
        last_name, 
        age, 
        gender, 
        phone
      ]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already registered');
      }
      throw error;
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT id, username, email, first_name, last_name, age, gender, phone, role, created_at 
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateProfile(id, data) {
    const allowedUpdates = ['username', 'email', 'first_name', 'last_name', 'age', 'gender', 'phone'];
    const updates = [];
    const values = [];
    let counter = 1;

    Object.keys(data).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates.push(`${key} = $${counter}`);
        values.push(data[key]);
        counter++;
      }
    });

    if (updates.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${counter}
      RETURNING id, username, email, first_name, last_name, age, gender, phone, role, created_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE users SET password = $1 WHERE id = $2 RETURNING id';
    const result = await pool.query(query, [hashedPassword, id]);
    return result.rows[0];
  }

  static async deleteAll() {
    const query = 'DELETE FROM users WHERE role != \'admin\'';
    await pool.query(query);
  }
}

const User = require('./user');
module.exports = User;