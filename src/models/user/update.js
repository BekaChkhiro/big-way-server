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

      // Check if user exists (don't throw error if not found)
      const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        // User doesn't exist, but this is not an error for delete operation
        await client.query('COMMIT');
        return true; // Successfully "deleted" (was already gone)
      }

      // First, update cars to remove seller reference (set seller_id to NULL)
      await client.query('UPDATE cars SET seller_id = NULL WHERE seller_id = $1', [userId]);
      
      // Delete user's wishlists - these should cascade but let's be explicit
      await client.query('DELETE FROM wishlists WHERE user_id = $1', [userId]);
      
      // Delete balance transactions - these should cascade but let's be explicit
      await client.query('DELETE FROM balance_transactions WHERE user_id = $1', [userId]);
      
      // Delete dealer profile if user is a dealer
      await client.query('DELETE FROM dealer_profiles WHERE user_id = $1', [userId]);
      
      // Delete autosalon profile if user is an autosalon
      await client.query('DELETE FROM autosalon_profiles WHERE user_id = $1', [userId]);
      
      // Finally delete the user
      const deleteResult = await client.query('DELETE FROM users WHERE id = $1', [userId]);

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