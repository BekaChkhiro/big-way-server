const pool = require('../../config/db.config');

class WishlistModel {
  static async addToWishlist(userId, carId) {
    try {
      const query = `
        INSERT INTO wishlists (user_id, car_id)
        VALUES ($1, $2)
        RETURNING id
      `;
      const result = await pool.query(query, [userId, carId]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Car is already in wishlist');
      }
      if (error.code === '23503') { // Foreign key violation
        throw new Error('Car not found');
      }
      throw error;
    }
  }

  static async removeFromWishlist(userId, carId) {
    const query = `
      DELETE FROM wishlists
      WHERE user_id = $1 AND car_id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [userId, carId]);
    if (result.rowCount === 0) {
      throw new Error('Car not found in wishlist');
    }
    return true;
  }

  static async getWishlist(userId) {
    const query = `
      SELECT c.*,
        json_build_object(
          'id', s.id,
          'engine_type', s.engine_type,
          'transmission', s.transmission,
          'fuel_type', s.fuel_type,
          'mileage', s.mileage,
          'engine_size', s.engine_size,
          'horsepower', s.horsepower,
          'doors', s.doors,
          'color', s.color,
          'body_type', s.body_type
        ) as specifications,
        json_build_object(
          'id', l.id,
          'city', l.city,
          'state', l.state,
          'country', l.country
        ) as location,
        (
          SELECT json_agg(ci.*)
          FROM car_images ci
          WHERE ci.car_id = c.id
        ) as images,
        b.name as brand_name,
        cat.name as category_name,
        w.created_at as added_to_wishlist_at
      FROM wishlists w
      JOIN cars c ON w.car_id = c.id
      LEFT JOIN specifications s ON c.specification_id = s.id
      LEFT JOIN locations l ON c.location_id = l.id
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE w.user_id = $1
      GROUP BY c.id, s.id, l.id, b.name, cat.name, w.created_at
      ORDER BY w.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async isInWishlist(userId, carId) {
    const query = `
      SELECT id FROM wishlists
      WHERE user_id = $1 AND car_id = $2
    `;
    const result = await pool.query(query, [userId, carId]);
    return result.rows.length > 0;
  }

  static async deleteAll() {
    const query = 'DELETE FROM wishlists';
    await pool.query(query);
  }
}

module.exports = WishlistModel;