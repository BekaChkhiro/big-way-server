require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateAdminPassword() {
  const client = await pool.connect();
  try {
    console.log('Connected to database. Updating admin password...');
    
    // New password for admin
    const newPassword = 'admin123';
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the admin user's password
    const updateResult = await client.query(
      "UPDATE users SET password = $1 WHERE username = 'admin' AND role = 'admin' RETURNING id, username, email, role",
      [hashedPassword]
    );
    
    if (updateResult.rows.length > 0) {
      console.log('Admin password updated successfully!');
      console.log('Admin user details:');
      console.log(updateResult.rows[0]);
      console.log(`\nNew password: ${newPassword}`);
      console.log('\nYou can now log in with:');
      console.log(`Username: ${updateResult.rows[0].username}`);
      console.log(`Email: ${updateResult.rows[0].email}`);
      console.log(`Password: ${newPassword}`);
    } else {
      console.log('No admin user found to update.');
    }
    
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the function
updateAdminPassword().catch(console.error);
