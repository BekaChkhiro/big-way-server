const { pg: pool } = require('../../config/db.config');
const fs = require('fs');
const path = require('path');

async function runAutosalonMigration() {
  const client = await pool.connect();
  try {
    console.log('Running autosalon profiles migration...');
    
    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, 'create_autosalon_profiles_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Autosalon profiles migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error running autosalon migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runAutosalonMigration()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = runAutosalonMigration;