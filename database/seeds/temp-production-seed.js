const { Pool } = require('pg');
const brands = require('./data/brands');
const carModels = require('./data/car_models');
const categories = require('./data/categories');

const pool = new Pool({
    connectionString: "postgresql://big_way_db_user:pSbBa19XtVX1nBDua6wnF4oa07V5WC8p@dpg-cv4qpf52ng1s73bqpuu0-a.oregon-postgres.render.com/big_way_db",
    ssl: {
        rejectUnauthorized: false
    }
});

async function seedData() {
    try {
        // Create car_models table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS car_models (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                brand_id INTEGER REFERENCES brands(id),
                UNIQUE(name, brand_id)
            );
        `);
        console.log('✓ car_models table created if it didn\'t exist');

        // Insert brands
        for (const brand of brands) {
            await pool.query(
                'INSERT INTO brands (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                [brand.name]
            );
        }
        console.log('✓ Brands seeded');

        // Get brand IDs for models
        const brandResults = await pool.query('SELECT id, name FROM brands');
        const brandMap = new Map(brandResults.rows.map(row => [row.name, row.id]));

        // Insert car models - handling the structure
        for (const [brandName, models] of Object.entries(carModels)) {
            const brandId = brandMap.get(brandName);
            if (brandId) {
                for (const modelName of models) {
                    await pool.query(
                        'INSERT INTO car_models (name, brand_id) VALUES ($1, $2) ON CONFLICT (name, brand_id) DO NOTHING',
                        [modelName, brandId]
                    );
                }
            }
        }
        console.log('✓ Car models seeded');

        // Insert categories
        for (const category of categories) {
            await pool.query(
                'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                [category.name]
            );
        }
        console.log('✓ Categories seeded');

        console.log('All data seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedData();