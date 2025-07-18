/**
 * Script to insert test car parts data into the database
 * Run with: node insert_test_parts.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { pg: config } = require('../../config/db.config');

// Read SQL file content
const sqlFilePath = path.join(__dirname, 'test_parts_data.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

async function insertTestParts() {
  const client = await config.connect();
  
  try {
    console.log('Starting test data insertion...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Execute SQL commands
    await client.query(sqlContent);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✓ Test car parts data inserted successfully!');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error inserting test data:', error.message);
    console.error('SQL Error Details:', error.detail);
  } finally {
    // Release client
    client.release();
    process.exit(0);
  }
}

insertTestParts();
