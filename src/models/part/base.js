const { pg: pool } = require('../../../config/db.config');

// Valid part conditions
const VALID_CONDITIONS = ['new', 'used'];

// VIP status types
const VIP_STATUS_TYPES = ['none', 'vip', 'vip_plus', 'super_vip'];

class PartModel {
  static async findById(id) {
    const query = `
      SELECT 
        p.*,
        COALESCE(p.vip_status, 'none')::text as vip_status,
        p.vip_expiration_date AT TIME ZONE 'UTC' as vip_expiration_date,
        CASE 
          WHEN p.vip_status IS NOT NULL AND p.vip_status != 'none' 
               AND p.vip_expiration_date > NOW() 
          THEN true 
          ELSE false 
        END as is_vip_active,
        p.views_count,
        b.name as brand,
        pc.name as category,
        cm.name as model,
        u.username,
        u.first_name,
        u.last_name,
        u.phone,
        u.created_at as user_created_at,
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
      LEFT JOIN part_categories pc ON p.category_id = pc.id
      LEFT JOIN car_models cm ON p.model_id = cm.id
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.id = $1
      GROUP BY p.id, b.name, pc.name, cm.name, u.username, u.first_name, u.last_name, u.phone, u.created_at
    `;
    console.log('Finding part by ID:', id);
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
        COALESCE(p.vip_status, 'none')::text as vip_status,
        p.vip_expiration_date AT TIME ZONE 'UTC' as vip_expiration_date,
        CASE 
          WHEN p.vip_status IS NOT NULL AND p.vip_status != 'none' 
               AND p.vip_expiration_date > NOW() 
          THEN true 
          ELSE false 
        END as is_vip_active,
        b.name as brand,
        pc.name as category,
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
      LEFT JOIN part_categories pc ON p.category_id = pc.id
      LEFT JOIN car_models cm ON p.model_id = cm.id
      ORDER BY 
        CASE 
          WHEN p.vip_status = 'super_vip' AND (p.vip_expiration_date IS NULL OR p.vip_expiration_date > NOW()) THEN 1
          WHEN p.vip_status = 'vip_plus' AND (p.vip_expiration_date IS NULL OR p.vip_expiration_date > NOW()) THEN 2
          WHEN p.vip_status = 'vip' AND (p.vip_expiration_date IS NULL OR p.vip_expiration_date > NOW()) THEN 3
          ELSE 4
        END,
        p.created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  static async updateVipStatus(partId, vipStatus, expirationDate = null) {
    // Validate VIP status
    if (!VIP_STATUS_TYPES.includes(vipStatus)) {
      throw new Error(`Invalid VIP status: ${vipStatus}. Valid options are: ${VIP_STATUS_TYPES.join(', ')}`);
    }
    
    try {
      // First, check if vip_status column exists
      const checkColumnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'parts' 
        AND column_name IN ('vip_status', 'vip_expiration_date')
      `;
      
      const columnCheck = await pool.query(checkColumnQuery);
      const existingColumns = columnCheck.rows.map(row => row.column_name);
      
      if (!existingColumns.includes('vip_status') || !existingColumns.includes('vip_expiration_date')) {
        console.log('VIP columns not found in parts table. Please run the migration first.');
        throw new Error('VIP status feature not available. Please run the database migration.');
      }
      
      // If vip_status is 'none', always set expiration_date to NULL
      const finalExpirationDate = vipStatus === 'none' ? null : expirationDate;
      
      const query = `
        UPDATE parts
        SET 
          vip_status = $1::vip_status,
          vip_expiration_date = $2::TIMESTAMP,
          vip_active = CASE 
            WHEN $1 = 'none' THEN FALSE
            WHEN $2::TIMESTAMP IS NULL THEN FALSE
            WHEN $2::TIMESTAMP > NOW() THEN TRUE
            ELSE FALSE
          END
        WHERE id = $3
        RETURNING id, vip_status, vip_expiration_date, vip_active
      `;
      
      const result = await pool.query(query, [vipStatus, finalExpirationDate, partId]);
      
      if (result.rowCount === 0) {
        throw new Error(`Part with ID ${partId} not found`);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating part VIP status:', error);
      throw error;
    }
  }

  static async getPartsByVipStatus(vipStatus, limit = 10, offset = 0) {
    // Validate VIP status
    if (!VIP_STATUS_TYPES.includes(vipStatus)) {
      throw new Error(`Invalid VIP status: ${vipStatus}. Valid options are: ${VIP_STATUS_TYPES.join(', ')}`);
    }

    const query = `
      SELECT 
        p.*,
        COALESCE(p.vip_status, 'none')::text as vip_status,
        p.vip_expiration_date AT TIME ZONE 'UTC' as vip_expiration_date,
        CASE 
          WHEN p.vip_status IS NOT NULL AND p.vip_status != 'none' 
               AND p.vip_expiration_date > NOW() 
          THEN true 
          ELSE false 
        END as is_vip_active,
        b.name as brand,
        pc.name as category,
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
      LEFT JOIN part_categories pc ON p.category_id = pc.id
      LEFT JOIN car_models cm ON p.model_id = cm.id
      WHERE COALESCE(p.vip_status, 'none') = $1
      AND ($1 = 'none' OR p.vip_expiration_date IS NULL OR p.vip_expiration_date > NOW())
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [vipStatus, limit, offset]);
    return result.rows;
  }

  static async delete(id) {
    // First, delete all images associated with the part
    await pool.query('DELETE FROM part_images WHERE part_id = $1', [id]);
    
    // Then delete the part
    const result = await pool.query('DELETE FROM parts WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async incrementViews(id) {
    const query = 'UPDATE parts SET views_count = views_count + 1 WHERE id = $1';
    await pool.query(query, [id]);
  }
}

module.exports = {
  PartModel,
  VALID_CONDITIONS,
  VIP_STATUS_TYPES
};
