const pool = require('../../config/db.config');
const brands = require('./data/brands');
const carModels = require('./data/car_models');
const categories = require('./data/categories');

async function seedData() {
    try {
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

        // Insert car models
        for (const model of carModels) {
            const brandId = brandMap.get(model.brand_name);
            if (brandId) {
                await pool.query(
                    'INSERT INTO car_models (name, brand_id) VALUES ($1, $2) ON CONFLICT (name, brand_id) DO NOTHING',
                    [model.name, brandId]
                );
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