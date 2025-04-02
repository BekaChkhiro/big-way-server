require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Get database URL from environment variable
const connectionString = process.env.DATABASE_URL;
console.log('Initializing database using connection string from environment variables');

// Create a new pool with the connection string
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Read the schema file
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

async function initDatabase() {
  const client = await pool.connect();
  console.log('Connected to database');
  
  try {
    console.log('Starting database initialization...');
    
    // Execute schema SQL (this will create all tables and constraints)
    console.log('Creating database schema...');
    await client.query(schemaSQL);
    console.log('✓ Schema created successfully');
    
    // Add basic data (you can expand this as needed)
    console.log('Adding basic data...');
    
    // Add brands
    await client.query(`
      INSERT INTO brands (name) VALUES 
      ('BMW'),
      ('Mercedes-Benz'),
      ('Audi'),
      ('Toyota'),
      ('Honda'),
      ('Ford'),
      ('Chevrolet'),
      ('Volkswagen'),
      ('Hyundai'),
      ('Kia')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Add categories
    await client.query(`
      INSERT INTO categories (name, type) VALUES 
      ('Sedan', 'car'),
      ('SUV', 'car'),
      ('Coupe', 'car'),
      ('Hatchback', 'car'),
      ('Truck', 'car'),
      ('Convertible', 'car'),
      ('Motorcycle', 'moto'),
      ('Scooter', 'moto'),
      ('Excavator', 'special_equipment'),
      ('Bulldozer', 'special_equipment')
      ON CONFLICT (name, type) DO NOTHING;
    `);
    
    // Add admin user (password: admin123)
    await client.query(`
      INSERT INTO users (username, email, password, role, first_name, last_name, age, gender, phone)
      VALUES (
        'admin', 
        'admin@example.com', 
        '$2b$10$mLwxZgNhYQAXVV5K.Aw9qOJmRd9KvQvj4BWFHXSrWj2MgJTghymrG', 
        'admin',
        'Admin',
        'User',
        30,
        'male',
        '+995555123456'
      )
      ON CONFLICT (username) DO NOTHING;
    `);
    
    console.log('✓ Basic data added successfully');
    console.log('✓ Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the initialization function
initDatabase()
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  })
  .then(() => {
    console.log('Initialization completed. Connection closed.');
    process.exit(0);
  });
