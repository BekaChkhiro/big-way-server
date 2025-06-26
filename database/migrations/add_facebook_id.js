/**
 * Migration to add facebook_id column to users table
 */

const pool = require('../../config/db.config');

async function addFacebookIdColumn() {
  const client = await pool.connect();
  try {
    console.log('Starting migration: Adding facebook_id column to users table');
    
    // Check if column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'facebook_id'
    `;
    
    const checkResult = await client.query(checkColumnQuery);
    
    if (checkResult.rows.length === 0) {
      // Column doesn't exist, add it
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN facebook_id VARCHAR(255) UNIQUE
      `);
      console.log('Successfully added facebook_id column to users table');
    } else {
      console.log('facebook_id column already exists in users table');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addFacebookIdColumn()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { addFacebookIdColumn };
