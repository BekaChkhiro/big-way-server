const pool = require('../../config/db.config');

/**
 * VipPricing Model
 * Handles database operations for VIP pricing data
 */
class VipPricing {
  /**
   * Create the vip_pricing table if it doesn't exist
   */
  static async createTableIfNotExists() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS vip_pricing (
          id SERIAL PRIMARY KEY,
          vip_status VARCHAR(20) NOT NULL UNIQUE CHECK (vip_status IN ('vip', 'vip_plus', 'super_vip')),
          price DECIMAL(10, 2) NOT NULL,
          duration_days INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Check if we need to insert default values
      const result = await pool.query('SELECT COUNT(*) FROM vip_pricing');
      
      if (parseInt(result.rows[0].count) === 0) {
        // Insert default values
        await pool.query(`
          INSERT INTO vip_pricing (vip_status, price, duration_days) VALUES
          ('vip', 10, 7),
          ('vip_plus', 30, 30),
          ('super_vip', 60, 30)
        `);
      }
      
      console.log('VIP pricing table initialized');
    } catch (error) {
      console.error('Error initializing VIP pricing table:', error);
    }
  }

  /**
   * Find all VIP pricing records
   */
  static async findAll() {
    try {
      const result = await pool.query('SELECT * FROM vip_pricing ORDER BY price ASC');
      return result.rows;
    } catch (error) {
      console.error('Error finding VIP pricing records:', error);
      throw error;
    }
  }

  /**
   * Update or insert a VIP pricing record
   */
  static async upsert({ vip_status, price, duration_days }) {
    try {
      const result = await pool.query(
        `INSERT INTO vip_pricing (vip_status, price, duration_days, updated_at) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (vip_status) 
         DO UPDATE SET 
           price = $2, 
           duration_days = $3, 
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [vip_status, price, duration_days]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error upserting VIP pricing record:', error);
      throw error;
    }
  }

  /**
   * Find a VIP pricing record by status
   */
  static async findByStatus(vip_status) {
    try {
      const result = await pool.query('SELECT * FROM vip_pricing WHERE vip_status = $1', [vip_status]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding VIP pricing by status:', error);
      throw error;
    }
  }
}

module.exports = VipPricing;
