require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Get database URL from environment variable
const connectionString = process.env.DATABASE_URL;
console.log('Connecting to Render.com database...');

// Create a new pool with the connection string
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Path to the data-only SQL dump file
const dumpFilePath = path.join(__dirname, 'data-only-dump.sql');

// Read the SQL dump file
const sqlDump = fs.readFileSync(dumpFilePath, 'utf8');

async function importData() {
  const client = await pool.connect();
  console.log('Connected to database');
  
  try {
    console.log('Starting data import...');
    
    // Execute the SQL dump
    await client.query(sqlDump);
    
    console.log('✓ Data import completed successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the import function
importData()
  .catch(error => {
    console.error('Failed to import data:', error);
    process.exit(1);
  })
  .then(() => {
    console.log('Import completed. Connection closed.');
    process.exit(0);
  });