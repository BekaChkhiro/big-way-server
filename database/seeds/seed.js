const pool = require('../../config/db.config');
const bcrypt = require('bcrypt');

// Import seed data
const brands = require('./data/brands');
const categories = require('./data/categories');
const users = require('./data/users');
const cars = require('./data/cars');
const wishlists = require('./data/wishlists');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear existing data
    await client.query('TRUNCATE users, brands, categories, specifications, locations, cars, car_images, wishlists CASCADE');
    
    // Reset sequences
    await client.query('ALTER SEQUENCE brands_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE categories_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE cars_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE specifications_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE locations_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE car_images_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE wishlists_id_seq RESTART WITH 1');

    // Seed brands sequentially
    for (const brand of brands) {
      await client.query('INSERT INTO brands (name) VALUES ($1)', [brand.name]);
    }
    console.log(`✓ Inserted ${brands.length} brands`);

    // Seed categories
    const categoryPromises = categories.map(category => 
      client.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [category.name])
    );
    const categoryResults = await Promise.all(categoryPromises);
    console.log(`✓ Inserted ${categories.length} categories`);

    // Seed users
    const userPromises = users.map(async user => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return client.query(
        `INSERT INTO users (username, email, password, role, first_name, last_name, age, gender, phone) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING id`,
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
    const userResults = await Promise.all(userPromises);
    console.log(`✓ Inserted ${users.length} users`);

    // Seed cars with their specifications and locations
    for (const car of cars) {
      // Insert specification
      const specResult = await client.query(
        `INSERT INTO specifications 
        (engine_type, transmission, fuel_type, mileage, engine_size, horsepower, doors, color, body_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          car.specifications.engine_type,
          car.specifications.transmission,
          car.specifications.fuel_type,
          car.specifications.mileage,
          car.specifications.engine_size,
          car.specifications.horsepower,
          car.specifications.doors,
          car.specifications.color,
          car.specifications.body_type
        ]
      );

      // Insert location
      const locationResult = await client.query(
        `INSERT INTO locations (city, state, country)
        VALUES ($1, $2, $3) RETURNING id`,
        [car.location.city, car.location.state, car.location.country]
      );

      // Insert car
      const carResult = await client.query(
        `INSERT INTO cars 
        (brand_id, category_id, location_id, specification_id, model, year, price, 
        description, status, featured, seller_id)
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

      // Insert car images
      if (car.images && car.images.length > 0) {
        for (let i = 0; i < car.images.length; i++) {
          await client.query(
            `INSERT INTO car_images 
            (car_id, image_url, thumbnail_url, medium_url, large_url, is_primary)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              carResult.rows[0].id,
              car.images[i].url,
              car.images[i].thumbnail_url,
              car.images[i].medium_url,
              car.images[i].large_url,
              i === 0
            ]
          );
        }
      }
    }
    console.log(`✓ Inserted ${cars.length} cars with specifications and images`);

    // Seed wishlists
    for (const wishlist of wishlists) {
      await client.query(
        'INSERT INTO wishlists (user_id, car_id) VALUES ($1, $2)',
        [wishlist.user_id, wishlist.car_id]
      );
    }
    console.log(`✓ Inserted ${wishlists.length} wishlist entries`);

    await client.query('COMMIT');
    console.log('✓ Database seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seed function
seed()
  .catch(error => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  })
  .then(() => {
    console.log('Seeding completed. Closing connection...');
    pool.end();
  });