const { pg: pool } = require('../config/db.config');

async function migrateCategoryColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Starting VIP pricing category migration...');
    
    // Create enum type for category if it doesn't exist
    await client.query(`
      DO $$ BEGIN
          CREATE TYPE vip_category_enum AS ENUM ('cars', 'parts');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ Created/verified vip_category_enum type');

    // Check if category column already exists
    const columnCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vip_pricing' 
      AND column_name = 'category';
    `);

    if (columnCheck.rows.length === 0) {
      // Add category column to vip_pricing table
      await client.query(`
        ALTER TABLE vip_pricing 
        ADD COLUMN category vip_category_enum DEFAULT 'cars';
      `);
      console.log('✓ Added category column to vip_pricing table');

      // Update existing records to have 'cars' category
      await client.query(`
        UPDATE vip_pricing SET category = 'cars' WHERE category IS NULL;
      `);
      console.log('✓ Updated existing records with cars category');
    } else {
      console.log('✓ Category column already exists');
    }

    // Drop the old unique constraint if it exists
    await client.query(`
      ALTER TABLE vip_pricing 
      DROP CONSTRAINT IF EXISTS vip_pricing_service_type_user_role_key;
    `);
    console.log('✓ Dropped old unique constraint');

    // Add new unique constraint including category
    await client.query(`
      ALTER TABLE vip_pricing 
      DROP CONSTRAINT IF EXISTS vip_pricing_service_type_user_role_category_key;
    `);
    await client.query(`
      ALTER TABLE vip_pricing 
      ADD CONSTRAINT vip_pricing_service_type_user_role_category_key 
      UNIQUE (service_type, user_role, category);
    `);
    console.log('✓ Added new unique constraint with category');

    // Insert default prices for parts category based on existing cars prices
    await client.query(`
      INSERT INTO vip_pricing (service_type, price, duration_days, is_daily_price, user_role, category)
      SELECT 
          service_type, 
          price, 
          duration_days, 
          is_daily_price, 
          user_role, 
          'parts' as category
      FROM vip_pricing 
      WHERE category = 'cars'
      ON CONFLICT (service_type, user_role, category) DO NOTHING;
    `);
    console.log('✓ Inserted default pricing for parts category');

    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
migrateCategoryColumn()
  .then(() => {
    console.log('Category migration finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Category migration failed:', error);
    process.exit(1);
  });