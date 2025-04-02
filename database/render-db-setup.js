require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Import seed data
const brands = require('./seeds/data/brands');
const categories = require('./seeds/data/categories');
const users = require('./seeds/data/users');
const cars = require('./seeds/data/cars');
const wishlists = require('./seeds/data/wishlists');

// Connection to the new Render.com database
const pool = new Pool({
  connectionString: 'postgresql://big_way_main_user:EV1I0ber4F9YewNwz6ojKN2FSQrZuoqq@dpg-cvmhjfogjchc73d3qhag-a/big_way_main',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Extended timeout for initial connection
});

// Read the schema file
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

async function setupDatabase() {
  const client = await pool.connect();
  console.log('Connected to Render.com database');
  
  try {
    console.log('Starting database setup...');
    
    // Execute schema SQL (this will create all tables and constraints)
    console.log('Creating database schema...');
    await client.query(schemaSQL);
    console.log('✓ Schema created successfully');
    
    // Begin transaction for seeding data
    await client.query('BEGIN');

    // Seed brands
    console.log('Seeding brands...');
    for (const brand of brands) {
      await client.query('INSERT INTO brands (name) VALUES ($1)', [brand.name]);
    }
    console.log(`✓ Inserted ${brands.length} brands`);

    // Seed categories
    console.log('Seeding categories...');
    for (const category of categories) {
      await client.query(
        'INSERT INTO categories (name, type) VALUES ($1, $2)', 
        [category.name, category.type]
      );
    }
    console.log(`✓ Inserted ${categories.length} categories`);

    // Seed users
    console.log('Seeding users...');
    const userPromises = users.map(async user => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return client.query(
        `INSERT INTO users (username, email, password, role, first_name, last_name, age, gender, phone) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          user.username, 
          user.email, 
          hashedPassword, 
          user.role || 'user',
          user.first_name,
          user.last_name,
          user.age,
          user.gender,
          user.phone
        ]
      );
    });
    await Promise.all(userPromises);
    console.log(`✓ Inserted ${users.length} users`);

    // Seed cars with their specifications and locations
    console.log('Seeding cars...');
    for (const car of cars) {
      try {
        // Insert specification - handle constraints based on previous issues
        const specResult = await client.query(
          `INSERT INTO specifications 
          (engine_type, fuel_type, mileage, mileage_unit, 
          engine_size, horsepower, is_turbo, cylinders, 
          manufacture_month, body_type, drive_type,
          has_catalyst, airbags_count, interior_material, interior_color)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
          RETURNING id`,
          [
            car.specifications.engine_type,
            car.specifications.fuel_type,
            car.specifications.mileage,
            car.specifications.mileage_unit || 'km',
            car.specifications.engine_size,
            car.specifications.horsepower,
            car.specifications.is_turbo || false,
            car.specifications.cylinders,
            car.specifications.manufacture_month,
            car.specifications.body_type,
            car.specifications.drive_type || 'front',
            car.specifications.has_catalyst !== undefined ? car.specifications.has_catalyst : true,
            car.specifications.airbags_count || 0,
            car.specifications.interior_material,
            car.specifications.interior_color
          ]
        );

        // Insert location - handle constraints based on previous issues
        const locationResult = await client.query(
          `INSERT INTO locations (location_type, city, state, country)
          VALUES ($1, $2, $3, $4) RETURNING id`,
          ['georgia', car.location.city, car.location.state, car.location.country]
        );

        // Insert car
        const carResult = await client.query(
          `INSERT INTO cars 
          (brand_id, category_id, location_id, specification_id, model, year, price, 
          description_en, status, featured, seller_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id`,
          [
            car.brand_id,
            car.category_id,
            locationResult.rows[0].id,
            specResult.rows[0].id,
            car.model,
            car.year,
            car.price,
            car.description,
            car.status || 'available',
            car.featured || false,
            car.seller_id
          ]
        );

        // Insert car images - using image_url instead of url based on previous issues
        if (car.images && car.images.length > 0) {
          for (let i = 0; i < car.images.length; i++) {
            await client.query(
              `INSERT INTO car_images 
              (car_id, image_url, thumbnail_url, medium_url, large_url, is_primary)
              VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                carResult.rows[0].id,
                car.images[i].url || car.images[i].image_url,
                car.images[i].thumbnail_url,
                car.images[i].medium_url,
                car.images[i].large_url,
                i === 0
              ]
            );
          }
        }
      } catch (carError) {
        console.error(`Error inserting car ${car.model}:`, carError.message);
        // Continue with next car instead of failing the entire process
      }
    }
    console.log(`✓ Inserted cars with specifications and images`);

    // Seed wishlists
    console.log('Seeding wishlists...');
    for (const wishlist of wishlists) {
      try {
        await client.query(
          'INSERT INTO wishlists (user_id, car_id) VALUES ($1, $2)',
          [wishlist.user_id, wishlist.car_id]
        );
      } catch (wishlistError) {
        console.error(`Error inserting wishlist:`, wishlistError.message);
      }
    }
    console.log(`✓ Inserted wishlist entries`);

    await client.query('COMMIT');
    console.log('✓ Database setup completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup function
setupDatabase()
  .catch(error => {
    console.error('Failed to set up database:', error);
    process.exit(1);
  })
  .then(() => {
    console.log('Setup completed. Connection closed.');
    process.exit(0);
  });
