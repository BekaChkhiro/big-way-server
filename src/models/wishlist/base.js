const pool = require('../../../config/db.config');

class WishlistModel {
  static async findUserWishlist(userId) {
    const client = await pool.connect();
    try {
      console.log('Finding wishlist for user:', userId);

      // First verify the user exists
      const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        throw new Error('User not found');
      }

      const query = `
        WITH wishlist_items AS (
          SELECT 
            w.id as wishlist_id,
            w.car_id,
            w.created_at as added_to_wishlist_at,
            c.*,
            b.name as brand,
            cat.name as category,
            s.id as specification_id,
            l.id as location_id
          FROM wishlists w
          LEFT JOIN cars c ON w.car_id = c.id
          LEFT JOIN brands b ON c.brand_id = b.id
          LEFT JOIN categories cat ON c.category_id = cat.id
          LEFT JOIN specifications s ON c.specification_id = s.id
          LEFT JOIN locations l ON c.location_id = l.id
          WHERE w.user_id = $1
        )
        SELECT 
          wi.*,
          jsonb_build_object(
            'id', s.id,
            'engine_type', s.engine_type,
            'transmission', s.transmission,
            'fuel_type', s.fuel_type,
            'mileage', s.mileage,
            'engine_size', s.engine_size,
            'doors', s.doors,
            'color', s.color,
            'clearance_status', s.clearance_status
          ) as specifications,
          jsonb_build_object(
            'id', l.id,
            'city', l.city,
            'state', l.state,
            'country', l.country,
            'location_type', l.location_type,
            'is_transit', l.is_transit
          ) as location,
          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', ci.id,
                  'car_id', ci.car_id,
                  'url', ci.url,
                  'thumbnail_url', ci.thumbnail_url,
                  'medium_url', ci.medium_url,
                  'large_url', ci.large_url,
                  'is_primary', ci.is_primary
                )
              )
              FROM car_images ci
              WHERE ci.car_id = wi.car_id
            ),
            '[]'::jsonb
          ) as images
        FROM wishlist_items wi
        LEFT JOIN specifications s ON wi.specification_id = s.id
        LEFT JOIN locations l ON wi.location_id = l.id
        ORDER BY wi.added_to_wishlist_at DESC;
      `;
      
      console.log('Executing wishlist query...');
      const result = await client.query(query, [userId]);
      console.log('Wishlist query result rows:', result.rows.length);
      
      // Transform the result to match the expected format
      const transformedRows = result.rows.map(row => ({
        id: row.car_id,
        brand_id: row.brand_id,
        category_id: row.category_id,
        model: row.model,
        year: row.year,
        price: row.price,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        brand: row.brand,
        category: row.category,
        specifications: row.specifications,
        location: row.location,
        images: row.images || [],
        wishlist_id: row.wishlist_id,
        added_to_wishlist_at: row.added_to_wishlist_at
      }));

      console.log('Transformed rows:', transformedRows.length);
      return transformedRows;
    } catch (error) {
      console.error('Error in findUserWishlist:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async exists(userId, carId) {
    const client = await pool.connect();
    try {
      const query = 'SELECT id FROM wishlists WHERE user_id = $1 AND car_id = $2';
      const result = await client.query(query, [userId, carId]);
      return result.rows.length > 0;
    } finally {
      client.release();
    }
  }
}

module.exports = WishlistModel;