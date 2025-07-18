const { pg: pool } = require('../../../config/db.config');
const UserModel = require('./base');

class UserUpdate {
  static async updateProfile(userId, userData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate user exists
      await UserModel.validateUser(userId);

      // Check if email is being changed and if it's already taken
      if (userData.email) {
        const emailUser = await UserModel.findByEmail(userData.email);
        if (emailUser && emailUser.id !== userId) {
          throw new Error('Email already in use');
        }
      }

      // Check if username is being changed and if it's already taken
      if (userData.username) {
        const usernameUser = await UserModel.findByUsername(userData.username);
        if (usernameUser && usernameUser.id !== userId) {
          throw new Error('Username already in use');
        }
      }

      // Build update query
      const updateFields = [];
      const values = [];
      let paramCounter = 1;

      const updateableFields = [
        'username',
        'email',
        'first_name',
        'last_name',
        'age',
        'gender',
        'phone'
      ];

      updateableFields.forEach(field => {
        if (field in userData) {
          updateFields.push(`${field} = $${paramCounter}`);
          values.push(userData[field]);
          paramCounter++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(userId);
      const query = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING id, username, email, first_name, last_name, age, gender, phone, role, created_at
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

  static async delete(userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate user exists
      await UserModel.validateUser(userId);

      // Delete user's cars
      await client.query('DELETE FROM cars WHERE seller_id = $1', [userId]);
      
      // Delete user's wishlists
      await client.query('DELETE FROM wishlists WHERE user_id = $1', [userId]);
      
      // Finally delete the user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateRole(userId, role) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate user exists
      await UserModel.validateUser(userId);

      // Update role
      const result = await client.query(
        `UPDATE users 
        SET role = $1 
        WHERE id = $2
        RETURNING id, username, email, first_name, last_name, age, gender, phone, role, created_at`,
        [role, userId]
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

module.exports = UserUpdate;