require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkAdminUser() {
  const client = await pool.connect();
  try {
    console.log('Connected to database. Checking admin users...');
    
    // Check for users with admin role
    const adminRoleResult = await client.query("SELECT id, username, email, role FROM users WHERE role = 'admin'");
    
    console.log(`Found ${adminRoleResult.rows.length} users with admin role:`);
    console.log(adminRoleResult.rows);
    
    // Check for user with username 'admin'
    const adminUsernameResult = await client.query("SELECT id, username, email, role FROM users WHERE username = 'admin'");
    
    console.log(`\nFound ${adminUsernameResult.rows.length} users with username 'admin':`);
    console.log(adminUsernameResult.rows);
    
    // Check for user with email 'admin@bigway.com'
    const adminEmailResult = await client.query("SELECT id, username, email, role FROM users WHERE email = 'admin@bigway.com'");
    
    console.log(`\nFound ${adminEmailResult.rows.length} users with email 'admin@bigway.com':`);
    console.log(adminEmailResult.rows);
    
  } catch (error) {
    console.error('Error checking admin users:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
checkAdminUser().catch(console.error);
