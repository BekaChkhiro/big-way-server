require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database connection details
const DB_NAME = 'big_way_db';
const DB_USER = 'postgres';
const DB_PASSWORD = 'Lumia635-'; // Using the password from db.config.js

// Output file path
const outputFile = path.join(__dirname, 'data-only-dump.sql');

console.log('Starting data-only export from local database...');
console.log(`Database: ${DB_NAME}`);
console.log(`Output file: ${outputFile}`);

// Command to export only data (no schema) from the database
// --data-only: export only data, not schema
// --column-inserts: use INSERT with column names
// --inserts: use INSERT commands instead of COPY
// --no-owner: do not set ownership of objects
// --no-privileges: do not include privileges (GRANT/REVOKE)
const command = `PGPASSWORD=${DB_PASSWORD} pg_dump -U ${DB_USER} -d ${DB_NAME} --data-only --column-inserts --inserts --no-owner --no-privileges > ${outputFile}`;

// Execute the command
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error exporting data: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`pg_dump stderr: ${stderr}`);
    return;
  }
  
  console.log('Data export completed successfully!');
  console.log(`Data has been saved to: ${outputFile}`);
  console.log('You can now upload this file to your Render.com database.');
  
  // Read the file to check its size
  fs.stat(outputFile, (err, stats) => {
    if (err) {
      console.error(`Error checking file: ${err.message}`);
      return;
    }
    
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    console.log(`File size: ${fileSizeKB} KB`);
    
    // Create a script to import this data to Render.com
    const importScriptPath = path.join(__dirname, 'import-data-to-render.js');
    const importScriptContent = `require('dotenv').config();
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
  });`;
    
    fs.writeFile(importScriptPath, importScriptContent, (err) => {
      if (err) {
        console.error(`Error creating import script: ${err.message}`);
        return;
      }
      
      console.log(`Import script created at: ${importScriptPath}`);
      console.log('To import the data to Render.com, run this script on your Render.com server:');
      console.log('node database/import-data-to-render.js');
    });
  });
});
