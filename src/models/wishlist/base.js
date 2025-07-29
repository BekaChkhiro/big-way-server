const { pg: pool } = require('../../../config/db.config');

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
            s.id as spec_id,
            l.id as loc_id,
            c.vip_status as car_vip_status,
            c.vip_expiration_date as car_vip_expiration_date
          FROM wishlists w
          LEFT JOIN cars c ON w.car_id = c.id
          LEFT JOIN brands b ON c.brand_id = b.id
          LEFT JOIN categories cat ON c.category_id = cat.id
          LEFT JOIN specifications s ON c.specification_id = s.id
          LEFT JOIN locations l ON c.location_id = l.id
          WHERE w.user_id = $1 AND c.id IS NOT NULL
        )
        SELECT 
          wi.wishlist_id,
          wi.car_id as id,
          wi.brand_id,
          wi.category_id,
          wi.model,
          wi.year,
          wi.price,
          wi.currency,
          wi.title,
          wi.description_ka,
          wi.description_en,
          wi.seller_id,
          wi.featured,
          wi.status,
          wi.created_at,
          wi.updated_at,
          wi.added_to_wishlist_at,
          wi.brand,
          wi.car_vip_status as vip_status,
          wi.car_vip_expiration_date as vip_expiration_date,
          wi.category,
          jsonb_build_object(
            'id', s.id,
            'mileage', s.mileage,
            'fuel_type', s.fuel_type,
            'transmission', s.transmission,
            'engine_type', s.engine_type,
            'drive_type', s.drive_type,
            'interior_color', s.interior_color,
            'color', s.color
          ) as specifications,
          jsonb_build_object(
            'id', l.id,
            'city', l.city,
            'country', l.country,
            'location_type', l.location_type
          ) as location,
          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', ci.id,
                  'car_id', ci.car_id,
                  'url', ci.image_url,
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
        LEFT JOIN specifications s ON s.id = wi.spec_id
        LEFT JOIN locations l ON l.id = wi.loc_id
        ORDER BY wi.added_to_wishlist_at DESC;
      `;
      
      console.log('Executing wishlist query...');
      const result = await client.query(query, [userId]);
      console.log('Wishlist query result rows:', result.rows.length);
      
      // Transform the result to ensure proper format for frontend
      const transformedRows = result.rows.map(row => ({
        id: row.id, // This is car_id
        brand_id: row.brand_id,
        category_id: row.category_id,
        model: row.model,
        title: row.title || `${row.brand || ''} ${row.model || ''}`,
        year: row.year,
        price: row.price,
        currency: row.currency || 'GEL',
        description_ka: row.description_ka || '',
        description_en: row.description_en || '',
        status: row.status || 'available',
        featured: row.featured || false,
        seller_id: row.seller_id || 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
        brand: row.brand,
        category: row.category,
        vip_status: row.vip_status,
        vip_expiration_date: row.vip_expiration_date,
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