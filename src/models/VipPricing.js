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
        // Check if service_type and user_role columns exist
        const columnCheck = await client.query(`
          SELECT column_name
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'vip_pricing' 
          AND column_name IN ('service_type', 'user_role');
        `);
        
        const hasServiceType = columnCheck.rows.some(row => row.column_name === 'service_type');
        const hasUserRole = columnCheck.rows.some(row => row.column_name === 'user_role');
        
        if (!hasServiceType || !hasUserRole) {
          console.log('vip_pricing table exists but has incorrect structure. Dropping it...');
          await client.query('DROP TABLE IF EXISTS vip_pricing CASCADE');
        } else {
          console.log('VIP pricing table has required columns, checking constraints...');
          
          // Check if the unique constraint exists
          const constraintCheck = await client.query(`
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'vip_pricing' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name ILIKE '%service_type%role%'
          `);
          
          if (constraintCheck.rows.length === 0) {
            console.log('Adding missing unique constraint...');
            try {
              await client.query(`
                ALTER TABLE vip_pricing 
                ADD CONSTRAINT vip_pricing_service_type_user_role_key 
                UNIQUE (service_type, user_role)
              `);
              console.log('✓ Added unique constraint');
            } catch (constraintError) {
              console.log('Note: Could not add constraint (may already exist):', constraintError.message);
            }
          }
          
          console.log('VIP pricing table structure verified');
          return; // Table exists and is correct
        }
      }
      
      // Create new table with correct structure including role-based pricing
      await client.query(`
        CREATE TABLE IF NOT EXISTS vip_pricing (
          id SERIAL PRIMARY KEY,
          service_type VARCHAR(30) NOT NULL CHECK (service_type IN ('free', 'vip', 'vip_plus', 'super_vip', 'color_highlighting', 'auto_renewal')),
          price DECIMAL(10, 2) NOT NULL,
          duration_days INTEGER DEFAULT 1,
          is_daily_price BOOLEAN DEFAULT FALSE,
          user_role public.user_role DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT vip_pricing_service_type_user_role_key UNIQUE (service_type, user_role)
        )
      `);
      
      // Check if we need to insert default values
      const result = await client.query('SELECT COUNT(*) FROM vip_pricing');
      
      if (parseInt(result.rows[0].count) === 0) {
        // Insert default values for all services for all roles
        const roles = ['user', 'dealer', 'autosalon'];
        const services = [
          { service_type: 'free', price: 0, duration_days: 30, is_daily_price: false },
          { service_type: 'vip', price: 2, duration_days: 1, is_daily_price: true },
          { service_type: 'vip_plus', price: 5, duration_days: 1, is_daily_price: true },
          { service_type: 'super_vip', price: 7, duration_days: 1, is_daily_price: true },
          { service_type: 'color_highlighting', price: 0.5, duration_days: 1, is_daily_price: true },
          { service_type: 'auto_renewal', price: 0.5, duration_days: 1, is_daily_price: true }
        ];
        
        for (const role of roles) {
          for (const service of services) {
            await client.query(`
              INSERT INTO vip_pricing (service_type, price, duration_days, is_daily_price, user_role) 
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (service_type, user_role) DO NOTHING
            `, [service.service_type, service.price, service.duration_days, service.is_daily_price, role]);
          }
        }
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
   * Find all VIP pricing records (optionally filtered by role)
   */
  static async findAll(userRole = null) {
    try {
      let query = 'SELECT * FROM vip_pricing';
      const params = [];
      
      if (userRole) {
        query += ' WHERE user_role = $1';
        params.push(userRole);
      }
      
      query += ' ORDER BY user_role, CASE WHEN service_type = \'free\' THEN 0 ELSE price END ASC';
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding VIP pricing records:', error);
      throw error;
    }
  }

  /**
   * Find all VIP pricing records grouped by role
   */
  static async findAllGroupedByRole() {
    try {
      const result = await pool.query(`
        SELECT * FROM vip_pricing 
        ORDER BY user_role, 
        CASE 
          WHEN service_type = 'free' THEN 0 
          WHEN service_type = 'vip' THEN 1
          WHEN service_type = 'vip_plus' THEN 2
          WHEN service_type = 'super_vip' THEN 3
          WHEN service_type = 'color_highlighting' THEN 4
          WHEN service_type = 'auto_renewal' THEN 5
          ELSE 6 
        END
      `);
      
      // Initialize all roles to ensure they exist
      const grouped = {
        user: [],
        dealer: [],
        autosalon: []
      };
      
      // Group existing data by role
      result.rows.forEach(row => {
        if (grouped[row.user_role]) {
          grouped[row.user_role].push(row);
        }
      });
      
      // If any role is missing data, populate it with default prices based on 'user' role
      const serviceTypes = ['free', 'vip', 'vip_plus', 'super_vip', 'color_highlighting', 'auto_renewal'];
      const roles = ['user', 'dealer', 'autosalon'];
      
      for (const role of roles) {
        if (grouped[role].length === 0) {
          console.log(`No pricing data found for role: ${role}, creating default entries...`);
          
          // Get default prices from user role or use fallback
          const userPrices = grouped.user.length > 0 ? grouped.user : null;
          
          for (const serviceType of serviceTypes) {
            const defaultPrice = userPrices ? 
              userPrices.find(p => p.service_type === serviceType)?.price || this.getDefaultPrice(serviceType) :
              this.getDefaultPrice(serviceType);
            
            const defaultDays = serviceType === 'free' ? 30 : 1;
            
            try {
              const newRecord = await this.upsert({
                service_type: serviceType,
                price: defaultPrice,
                duration_days: defaultDays,
                is_daily_price: serviceType !== 'free',
                user_role: role
              });
              grouped[role].push(newRecord);
            } catch (error) {
              console.error(`Error creating default pricing for ${role}/${serviceType}:`, error);
            }
          }
        }
      }
      
      return grouped;
    } catch (error) {
      console.error('Error finding VIP pricing records grouped by role:', error);
      throw error;
    }
  }

  /**
   * Get default price for a service type
   */
  static getDefaultPrice(serviceType) {
    const defaults = {
      free: 0,
      vip: 2,
      vip_plus: 5,
      super_vip: 7,
      color_highlighting: 0.5,
      auto_renewal: 0.5
    };
    return defaults[serviceType] || 0;
  }

  /**
   * Update or insert a VIP pricing record
   */
  static async upsert({ service_type, price, duration_days, is_daily_price, user_role = 'user' }) {
    try {
      // Validate user_role
      const validRoles = ['user', 'dealer', 'autosalon'];
      if (!validRoles.includes(user_role)) {
        throw new Error(`Invalid user_role: ${user_role}. Must be one of: ${validRoles.join(', ')}`);
      }
      
      console.log('VipPricing.upsert called with:', {
        service_type,
        price,
        duration_days,
        is_daily_price,
        user_role
      });
      
      // First, try to find existing record
      const existingQuery = `
        SELECT id FROM vip_pricing 
        WHERE service_type = $1 AND user_role = $2
      `;
      const existingResult = await pool.query(existingQuery, [service_type, user_role]);
      
      let result;
      if (existingResult.rows.length > 0) {
        // Update existing record
        result = await pool.query(
          `UPDATE vip_pricing 
           SET price = $1, duration_days = $2, is_daily_price = $3, updated_at = CURRENT_TIMESTAMP
           WHERE service_type = $4 AND user_role = $5
           RETURNING *`,
          [price, duration_days, is_daily_price, service_type, user_role]
        );
      } else {
        // Insert new record
        result = await pool.query(
          `INSERT INTO vip_pricing (service_type, price, duration_days, is_daily_price, user_role, updated_at) 
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           RETURNING *`,
          [service_type, price, duration_days, is_daily_price, user_role]
        );
      }
      
      console.log('VipPricing.upsert result:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error upserting VIP pricing record:', error);
      console.error('Query parameters:', [service_type, price, duration_days, is_daily_price, user_role]);
      throw error;
    }
  }

  /**
   * Find a VIP pricing record by service type and role
   */
  static async findByServiceType(service_type, user_role = 'user') {
    try {
      const result = await pool.query(
        'SELECT * FROM vip_pricing WHERE service_type = $1 AND user_role = $2', 
        [service_type, user_role]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error finding VIP pricing by service type:', error);
      throw error;
    }
  }

  /**
   * Get VIP status pricing (backwards compatibility)
   */
  static async findByStatus(vip_status, user_role = 'user') {
    return this.findByServiceType(vip_status, user_role);
  }

  /**
   * Get all VIP packages only (excluding additional services)
   */
  static async findVipPackages(user_role = null) {
    try {
      let query = `SELECT * FROM vip_pricing 
         WHERE service_type IN ('free', 'vip', 'vip_plus', 'super_vip')`;
      const params = [];
      
      if (user_role) {
        query += ' AND user_role = $1';
        params.push(user_role);
      }
      
      query += ' ORDER BY CASE WHEN service_type = \'free\' THEN 0 ELSE price END ASC';
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding VIP packages:', error);
      throw error;
    }
  }

  /**
   * Get all additional services only
   */
  static async findAdditionalServices(user_role = null) {
    try {
      let query = `SELECT * FROM vip_pricing 
         WHERE service_type IN ('color_highlighting', 'auto_renewal')`;
      const params = [];
      
      if (user_role) {
        query += ' AND user_role = $1';
        params.push(user_role);
      }
      
      query += ' ORDER BY service_type ASC';
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding additional services:', error);
      throw error;
    }
  }
}

module.exports = VipPricing;
