const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupTestDatabase() {
  // First connect to default database to create test database
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres'
  });

  try {
    await client.connect();

    // Drop test database if it exists and create it again
    await client.query('DROP DATABASE IF EXISTS big_way_test_db');
    await client.query('CREATE DATABASE big_way_test_db');

    console.log('Test database created successfully');
  } catch (error) {
    console.error('Error creating test database:', error);
    throw error;
  } finally {
    await client.end();
  }

  // Now connect to the test database to create schema
  const testClient = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'big_way_test_db'
  });

  try {
    await testClient.connect();

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await testClient.query(schema);

    console.log('Test database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing test database schema:', error);
    throw error;
  } finally {
    await testClient.end();
  }
}

// Run if this script is executed directly
if (require.main === module) {
  setupTestDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = setupTestDatabase;