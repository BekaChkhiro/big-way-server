const { pg: pool } = require('./config/db.config');

async function checkUserRoles() {
  try {
    console.log('Connecting to database...');
    
    // Check current enum values
    const result = await pool.query(`
      SELECT enumlabel as role_name
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'user_role'
      )
      ORDER BY enumsortorder;
    `);
    
    console.log('\nCurrent user_role enum values in database:');
    console.log('===========================================');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.role_name}`);
    });
    
    // Check if autosalon exists
    const hasAutosalon = result.rows.some(row => row.role_name === 'autosalon');
    
    console.log('\n===========================================');
    if (hasAutosalon) {
      console.log('✓ AUTOSALON role EXISTS in the database!');
    } else {
      console.log('✗ AUTOSALON role is MISSING from the database!');
      console.log('\nTo add it, run this SQL command in your PostgreSQL:');
      console.log("ALTER TYPE public.user_role ADD VALUE 'autosalon' AFTER 'dealer';");
    }
    
    console.log('\n===========================================');
    console.log('Database check completed.');
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserRoles();