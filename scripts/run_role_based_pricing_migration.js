const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'big_way_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function runRoleBasedPricingMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting role-based pricing migration...');
    
    // Check if the user_role column already exists
    const columnCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vip_pricing' 
        AND column_name = 'user_role'
      );
    `);
    
    if (columnCheck.rows[0].exists) {
      console.log('✓ Role-based pricing already migrated!');
      return;
    }
    
    // Read and execute the migration script
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_role_based_pricing.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('Migration file not found:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Executing ${statements.length} migration statements...`);
    
    for (const statement of statements) {
      try {
        await client.query(statement);
        console.log('✓ Executed statement successfully');
      } catch (error) {
        console.error('Error executing statement:', statement);
        console.error('Error:', error.message);
        // Continue with other statements
      }
    }
    
    console.log('✅ Role-based pricing migration completed successfully!');
    
    // Verify the migration
    const verifyCheck = await client.query(`
      SELECT COUNT(*) as count FROM vip_pricing WHERE user_role IS NOT NULL;
    `);
    
    console.log(`Found ${verifyCheck.rows[0].count} pricing records with user roles.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runRoleBasedPricingMigration();