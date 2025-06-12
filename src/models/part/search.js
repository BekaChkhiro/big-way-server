const pool = require('../../../config/db.config');

class PartSearch {
  async search(filters = {}) {
    try {
      let conditions = [];
      let values = [];
      let paramCounter = 1;

      // Build base query
      let query = `
        SELECT 
          p.*,
          b.name as brand,
          cat.name as category,
          cm.name as model,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', pi.id,
                'part_id', pi.part_id,
                'url', pi.image_url,
                'thumbnail_url', pi.thumbnail_url,
                'medium_url', pi.medium_url,
                'large_url', pi.large_url,
                'is_primary', pi.is_primary
              )
            ) FROM part_images pi WHERE pi.part_id = p.id),
            '[]'
          ) as images
        FROM parts p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        LEFT JOIN car_models cm ON p.model_id = cm.id
      `;

      // Add search term filter
      if (filters.searchTerm) {
        conditions.push(`p.search_vector @@ to_tsquery('english', $${paramCounter})`);
        values.push(filters.searchTerm.split(' ').join(' & '));
        paramCounter++;
      }

      // Add brand filter
      if (filters.brand_id) {
        conditions.push(`p.brand_id = $${paramCounter}`);
        values.push(filters.brand_id);
        paramCounter++;
      }

      // Add model filter
      if (filters.model_id) {
        conditions.push(`p.model_id = $${paramCounter}`);
        values.push(filters.model_id);
        paramCounter++;
      }

      // Add category filter
      if (filters.category_id) {
        conditions.push(`p.category_id = $${paramCounter}`);
        values.push(filters.category_id);
        paramCounter++;
      }

      // Add condition filter
      if (filters.condition) {
        conditions.push(`p.condition = $${paramCounter}`);
        values.push(filters.condition);
        paramCounter++;
      }

      // Add price range filter
      if (filters.minPrice) {
        conditions.push(`p.price >= $${paramCounter}`);
        values.push(filters.minPrice);
        paramCounter++;
      }

      if (filters.maxPrice) {
        conditions.push(`p.price <= $${paramCounter}`);
        values.push(filters.maxPrice);
        paramCounter++;
      }

      // Add seller filter
      if (filters.sellerId) {
        conditions.push(`p.seller_id = $${paramCounter}`);
        values.push(filters.sellerId);
        paramCounter++;
      }

      // Add conditions to query
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      // Add sorting
      let orderBy = 'p.created_at DESC';
      if (filters.sort) {
        switch (filters.sort) {
          case 'price_asc':
            orderBy = 'p.price ASC';
            break;
          case 'price_desc':
            orderBy = 'p.price DESC';
            break;
          case 'newest':
            orderBy = 'p.created_at DESC';
            break;
          case 'oldest':
            orderBy = 'p.created_at ASC';
            break;
        }
      }
      
      query += ` GROUP BY p.id, b.name, cat.name, cm.name ORDER BY ${orderBy}`;

      // Add pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;
      
      query += ` LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
      values.push(limit, offset);

      // Execute the query
      const result = await pool.query(query, values);
      
      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) FROM parts p`;
      if (conditions.length > 0) {
        countQuery += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      const countResult = await pool.query(countQuery, values.slice(0, -2));
      const totalCount = parseInt(countResult.rows[0].count);
      
      return {
        parts: result.rows,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      console.error('Error in PartSearch.search:', error);
      throw error;
    }
  }
}

module.exports = new PartSearch();
