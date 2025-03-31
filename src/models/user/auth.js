const pool = require('../../../config/db.config');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const UserModel = require('./base');
const { generateToken, generateRefreshToken } = require('../../../config/jwt.config');

class UserAuth {
  static async register(userData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if email exists
      const emailExists = await UserModel.findByEmail(userData.email);
      if (emailExists) {
        throw new Error('Email already exists');
      }

      // Check if username exists
      const usernameExists = await UserModel.findByUsername(userData.username);
      if (usernameExists) {
        throw new Error('Username already exists');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Insert user
      const result = await client.query(
        `INSERT INTO users 
        (username, email, password, first_name, last_name, age, gender, phone, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, username, email, first_name, last_name, age, gender, phone, role, created_at`,
        [
          userData.username,
          userData.email,
          hashedPassword,
          userData.first_name,
          userData.last_name,
          userData.age,
          userData.gender,
          userData.phone,
          'user' // default role
        ]
      );

      await client.query('COMMIT');
      const user = result.rows[0];
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      return {
        user,
        token,
        refreshToken
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async login(email, password) {
    const client = await pool.connect();
    try {
      // Find user
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      const user = result.rows[0];

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      // Remove sensitive data from response
      delete user.password;
      delete user.reset_token;
      delete user.reset_token_expires;

      return {
        user,
        token,
        refreshToken
      };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get user with password
      const user = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (!user.rows[0]) {
        throw new Error('User not found');
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
      if (!validPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await client.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, userId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async forgotPassword(email) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if user exists
      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = await bcrypt.hash(resetToken, 10);
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
      
      // Save reset token
      await client.query(
        `UPDATE users 
        SET reset_token = $1, reset_token_expires = $2 
        WHERE id = $3`,
        [resetTokenHash, resetTokenExpires, user.id]
      );
      
      await client.query('COMMIT');
      
      // Return the unhashed token to be sent in email
      return {
        email: user.email,
        resetToken: resetToken,
        expires: resetTokenExpires
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async resetPassword(email, token, newPassword) {
    return this.setNewPassword(email, token, newPassword);
  }

  static async verifyResetToken(email, token) {
    // Get user with reset token
    const user = await pool.query(
      `SELECT * FROM users 
      WHERE email = $1 
      AND reset_token IS NOT NULL 
      AND reset_token_expires > NOW()`,
      [email]
    );

    if (!user.rows[0]) {
      throw new Error('Invalid or expired reset token');
    }

    // Verify token
    const validToken = await bcrypt.compare(token, user.rows[0].reset_token);
    if (!validToken) {
      throw new Error('Invalid or expired reset token');
    }

    return true;
  }

  static async setNewPassword(email, token, newPassword) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify token first
      await this.verifyResetToken(email, token);

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear reset token
      await client.query(
        `UPDATE users 
        SET password = $1, reset_token = NULL, reset_token_expires = NULL 
        WHERE email = $2`,
        [hashedPassword, email]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async refreshToken(token) {
    try {
      const decoded = UserModel.verifyToken(token);
      const user = await UserModel.findById(decoded.id);
      
      if (!user) {
        throw new Error('User not found');
      }

      const newToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      return {
        token: newToken,
        refreshToken: newRefreshToken,
        user
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}

module.exports = UserAuth;