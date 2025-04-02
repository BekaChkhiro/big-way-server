require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Connection string from environment variable or direct value
const connectionString = process.env.DATABASE_URL || 'postgresql://big_way_main_user:EV1I0ber4F9YewNwz6ojKN2FSQrZuoqq@dpg-cvmhjfogjchc73d3qhag-a/big_way_main';

console.log('Connecting to database...');
console.log(`Connection string: ${connectionString}`);

// Create a new pool with the connection string
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Path to the SQL dump file
const dumpFilePath = path.join(__dirname, 'full-dump.sql');

// Read the SQL dump file
const sqlDump = fs.readFileSync(dumpFilePath, 'utf8');

async function importDatabase() {
  const client = await pool.connect();
  console.log('Connected to database');
  
  try {
    console.log('Starting database import...');
    
    // Execute the SQL dump
    await client.query(sqlDump);
    
    console.log('✓ Database import completed successfully!');
  } catch (error) {
    console.error('Error importing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the import function
importDatabase()
  .catch(error => {
    console.error('Failed to import database:', error);
    process.exit(1);
  })
  .then(() => {
    console.log('Import completed. Connection closed.');
    process.exit(0);
  });
