const pool = require('../../../config/db.config');

// Valid part conditions
const VALID_CONDITIONS = ['new', 'used'];

class PartModel {
  static async findById(id) {
    const query = `
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
      WHERE p.id = $1
      GROUP BY p.id, b.name, cat.name, cm.name
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getBrands() {
    const query = 'SELECT * FROM brands ORDER BY name ASC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async getModelsByBrand(brandId) {
    const query = 'SELECT * FROM car_models WHERE brand_id = $1 ORDER BY name ASC';
    const result = await pool.query(query, [brandId]);
    return result.rows;
  }

  static async getCategories() {
    const query = 'SELECT * FROM categories ORDER BY name ASC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async getPartCategories() {
    const query = 'SELECT * FROM part_categories ORDER BY id ASC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async listTopParts(limit = 6) {
    const query = `
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
      ORDER BY p.created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  static async delete(id) {
    // First, delete all images associated with the part
    await pool.query('DELETE FROM part_images WHERE part_id = $1', [id]);
    
    // Then delete the part
    const result = await pool.query('DELETE FROM parts WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = {
  PartModel,
  VALID_CONDITIONS
};
