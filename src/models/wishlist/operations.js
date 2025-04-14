const pool = require('../../../config/db.config');
const WishlistModel = require('./base');

class WishlistOperations {
  static async add(userId, carId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First verify the car exists
      const carCheck = await client.query('SELECT id FROM cars WHERE id = $1', [carId]);
      if (carCheck.rows.length === 0) {
        throw new Error('Car not found');
      }

      // Then verify user exists
      const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        throw new Error('User not found');
      }

      // Add to wishlist
      const query = `
        INSERT INTO wishlists (user_id, car_id)
        VALUES ($1, $2)
        RETURNING id, created_at
      `;
      const result = await client.query(query, [userId, carId]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') { // unique_violation
        throw new Error('Car already in wishlist');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  static async remove(userId, carId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        DELETE FROM wishlists
        WHERE user_id = $1 AND car_id = $2
        RETURNING id
      `;
      const result = await client.query(query, [userId, carId]);

      if (result.rows.length === 0) {
        throw new Error('Car not found in wishlist');
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async clear(userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify user exists
      const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        throw new Error('User not found');
      }

      // Clear user's wishlist
      const query = 'DELETE FROM wishlists WHERE user_id = $1';
      await client.query(query, [userId]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = WishlistOperations;