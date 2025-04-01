const pool = require('../../../config/db.config');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../../../config/jwt.config');

class UserModel {
  static async findById(id) {
    const query = `
      SELECT id, username, email, first_name, last_name, age, gender, phone, role, created_at
      FROM users 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT id, username, email, first_name, last_name, age, gender, phone, role, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
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