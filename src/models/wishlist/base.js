const pool = require('../../../config/db.config');

class WishlistModel {
  static async findUserWishlist(userId) {
    const query = `
      SELECT 
        w.id as wishlist_id,
        c.*,
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
          'clearance_status', s.clearance_status
        ) as specifications,
        json_build_object(
          'id', l.id,
          'city', l.city,
          'state', l.state,
          'country', l.country,
          'location_type', l.location_type,
          'is_transit', l.is_transit
        ) as location,
        (
          SELECT json_agg(ci.*)
          FROM car_images ci
          WHERE ci.car_id = c.id
        ) as images,
        b.name as brand_name,
        cat.name as category_name
      FROM wishlists w
      JOIN cars c ON w.car_id = c.id
      LEFT JOIN specifications s ON c.specification_id = s.id
      LEFT JOIN locations l ON c.location_id = l.id
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE w.user_id = $1
      GROUP BY w.id, c.id, s.id, l.id, b.name, cat.name
      ORDER BY w.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async exists(userId, carId) {
    const query = 'SELECT id FROM wishlists WHERE user_id = $1 AND car_id = $2';
    const result = await pool.query(query, [userId, carId]);
    return result.rows.length > 0;
  }
}

module.exports = WishlistModel;