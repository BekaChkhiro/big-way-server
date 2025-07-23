const { pg: pool } = require('../../config/db.config');

/**
 * VipPricing Model
 * Handles database operations for VIP pricing data
 */
class VipPricing {
  /**
   * Create the vip_pricing table if it doesn't exist
   */
  static async createTableIfNotExists() {
    const client = await pool.connect();
    
    try {
      // First, check if old vip_prices table exists and drop it
      const oldTableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'vip_prices'
        );
      `);
      
      if (oldTableCheck.rows[0].exists) {
        console.log('Found old vip_prices table. Dropping it...');
        await client.query('DROP TABLE IF EXISTS vip_prices CASCADE');
        console.log('Old vip_prices table dropped.');
      }
      
      // Check if new table exists with correct structure
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'vip_pricing'
        );
      `);
      
      if (tableCheck.rows[0].exists) {
        // Check if service_type column exists
        const columnCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'vip_pricing' 
            AND column_name = 'service_type'
          );
        `);
        
        if (!columnCheck.rows[0].exists) {
          console.log('vip_pricing table exists but has incorrect structure. Dropping it...');
          await client.query('DROP TABLE IF EXISTS vip_pricing CASCADE');
        } else {
          console.log('VIP pricing table already exists with correct structure');
          return; // Table exists and is correct, no need to recreate
        }
      }
      
      // Create new table with correct structure
      await client.query(`
        CREATE TABLE IF NOT EXISTS vip_pricing (
          id SERIAL PRIMARY KEY,
          service_type VARCHAR(30) NOT NULL UNIQUE CHECK (service_type IN ('free', 'vip', 'vip_plus', 'super_vip', 'color_highlighting', 'auto_renewal')),
          price DECIMAL(10, 2) NOT NULL,
          duration_days INTEGER DEFAULT 1,
          is_daily_price BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Check if we need to insert default values
      const result = await client.query('SELECT COUNT(*) FROM vip_pricing');
      
      if (parseInt(result.rows[0].count) === 0) {
        // Insert default values for all services
        await client.query(`
          INSERT INTO vip_pricing (service_type, price, duration_days, is_daily_price) VALUES
          ('free', 0, 30, false),
          ('vip', 2, 1, true),
          ('vip_plus', 5, 1, true),
          ('super_vip', 7, 1, true),
          ('color_highlighting', 0.5, 1, true),
          ('auto_renewal', 0.5, 1, true)
        `);
      }
      
      console.log('VIP pricing table initialized successfully');
    } catch (error) {
      console.error('Error initializing VIP pricing table:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find all VIP pricing records
   */
  static async findAll() {
    try {
      const result = await pool.query('SELECT * FROM vip_pricing ORDER BY CASE WHEN service_type = \'free\' THEN 0 ELSE price END ASC');
      return result.rows;
    } catch (error) {
      console.error('Error finding VIP pricing records:', error);
      throw error;
    }
  }

  /**
   * Update or insert a VIP pricing record
   */
  static async upsert({ service_type, price, duration_days, is_daily_price }) {
    try {
      const result = await pool.query(
        `INSERT INTO vip_pricing (service_type, price, duration_days, is_daily_price, updated_at) 
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (service_type) 
         DO UPDATE SET 
           price = $2, 
           duration_days = $3,
           is_daily_price = $4,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [service_type, price, duration_days, is_daily_price]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error upserting VIP pricing record:', error);
      throw error;
    }
  }

  /**
   * Find a VIP pricing record by service type
   */
  static async findByServiceType(service_type) {
    try {
      const result = await pool.query('SELECT * FROM vip_pricing WHERE service_type = $1', [service_type]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding VIP pricing by service type:', error);
      throw error;
    }
  }

  /**
   * Get VIP status pricing (backwards compatibility)
   */
  static async findByStatus(vip_status) {
    return this.findByServiceType(vip_status);
  }

  /**
   * Get all VIP packages only (excluding additional services)
   */
  static async findVipPackages() {
    try {
      const result = await pool.query(
        `SELECT * FROM vip_pricing 
         WHERE service_type IN ('free', 'vip', 'vip_plus', 'super_vip') 
         ORDER BY CASE WHEN service_type = 'free' THEN 0 ELSE price END ASC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding VIP packages:', error);
      throw error;
    }
  }

  /**
   * Get all additional services only
   */
  static async findAdditionalServices() {
    try {
      const result = await pool.query(
        `SELECT * FROM vip_pricing 
         WHERE service_type IN ('color_highlighting', 'auto_renewal') 
         ORDER BY service_type ASC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding additional services:', error);
      throw error;
    }
  }
}

module.exports = VipPricing;
