const pool = require('../../../config/db.config');
const WishlistModel = require('./base');

class WishlistOperations {
  static async add(userId, carId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if already exists
      const exists = await WishlistModel.exists(userId, carId);
      if (exists) {
        throw new Error('Car already in wishlist');
      }

      // Add to wishlist
      const query = `
        INSERT INTO wishlists (user_id, car_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      const result = await client.query(query, [userId, carId]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async remove(userId, carId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Remove from wishlist
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