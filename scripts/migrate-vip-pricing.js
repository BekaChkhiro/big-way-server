const { pg: pool } = require('../config/db.config');

/**
 * Migration script to handle VIP pricing table structure
 * This script will:
 * 1. Check if old vip_prices table exists
 * 2. Drop it if it exists with incorrect structure
 * 3. Create new vip_pricing table with correct structure
 * 4. Insert default pricing data
 */

async function migrateVipPricing() {
  const client = await pool.connect();
  
  try {
    console.log('Starting VIP pricing table migration...');
    
    // Check if old vip_prices table exists
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
    
    // Check if new vip_pricing table exists
    const newTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'vip_pricing'
      );
    `);
    
    if (newTableCheck.rows[0].exists) {
      console.log('Found existing vip_pricing table. Checking structure...');
      
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
        console.log('Old vip_pricing table dropped.');
      } else {
        console.log('vip_pricing table already has correct structure.');
        return;
      }
    }
    
    // Create new table with correct structure
    console.log('Creating new vip_pricing table...');
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
    
    // Insert default values
    console.log('Inserting default pricing data...');
    await client.query(`
      INSERT INTO vip_pricing (service_type, price, duration_days, is_daily_price) VALUES
      ('free', 0, 30, false),
      ('vip', 2, 1, true),
      ('vip_plus', 5, 1, true),
      ('super_vip', 7, 1, true),
      ('color_highlighting', 0.5, 1, true),
      ('auto_renewal', 0.5, 1, true)
      ON CONFLICT (service_type) DO NOTHING
    `);
    
    // Verify the data
    const result = await client.query('SELECT * FROM vip_pricing ORDER BY id');
    console.log('VIP pricing table created successfully with the following data:');
    console.table(result.rows);
    
    console.log('VIP pricing migration completed successfully!');
    
  } catch (error) {
    console.error('Error during VIP pricing migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateVipPricing()
    .then(() => {
      console.log('Migration completed. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateVipPricing;