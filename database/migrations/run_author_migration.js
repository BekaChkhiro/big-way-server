const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Initialize the PostgreSQL connection
const pool = new Pool({
  // Get database connection details from environment variables or use defaults
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'big_way',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting author information migration...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'add_author_fields.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL statements by semicolon
    const statements = sqlContent
      .split(';')
      .filter(stmt => stmt.trim() !== '')
      .map(stmt => stmt.trim());
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing: ${statement}`);
      await client.query(statement);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Migration completed successfully.');
    
    // Optional: Check if the columns were added
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'cars'
      AND (column_name = 'author_name' OR column_name = 'author_phone')
    `);
    
    if (checkResult.rows.length === 2) {
      console.log('Verified: author_name and author_phone columns exist in cars table.');
    } else {
      console.log('Warning: Migration may have been incomplete. Found columns:', 
        checkResult.rows.map(row => row.column_name).join(', '));
    }
    
  } catch (error) {
    // Rollback transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
