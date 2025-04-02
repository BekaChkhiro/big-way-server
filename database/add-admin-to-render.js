require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addAdminUser() {
  const client = await pool.connect();
  try {
    console.log('Connected to database. Adding admin user...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-admin.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await client.query(sqlContent);
    
    console.log('Admin user creation script executed successfully');
    
    // Verify admin user exists
    const result = await client.query("SELECT id, username, email, role FROM users WHERE email = 'admin@bigway.com'");
    
    if (result.rows.length > 0) {
      console.log('Admin user details:');
      console.log(result.rows[0]);
    } else {
      console.log('Warning: Admin user was not found after script execution');
    }
    
  } catch (error) {
    console.error('Error adding admin user:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
addAdminUser().catch(console.error);
