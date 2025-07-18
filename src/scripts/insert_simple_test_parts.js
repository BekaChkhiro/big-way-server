/**
 * Simple script to insert test car parts with hardcoded IDs
 */

const { pg: config } = require('../../config/db.config');

async function insertTestParts() {
  const client = await config.connect();
  
  try {
    console.log('Starting test parts insertion...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // First, create part categories if they don't exist
    const createPartCategoriesQuery = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Engine Parts') THEN
          INSERT INTO categories (name) VALUES ('Engine Parts');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Body Parts') THEN
          INSERT INTO categories (name) VALUES ('Body Parts');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Suspension') THEN
          INSERT INTO categories (name) VALUES ('Suspension');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Braking System') THEN
          INSERT INTO categories (name) VALUES ('Braking System');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Electrical') THEN
          INSERT INTO categories (name) VALUES ('Electrical');
        END IF;
      END $$;
    `;
    
    await client.query(createPartCategoriesQuery);
    console.log('✓ Part categories created or confirmed');
    
    // Get category IDs
    const categoriesResult = await client.query(`
      SELECT id, name FROM categories 
      WHERE name IN ('Engine Parts', 'Body Parts', 'Suspension', 'Braking System', 'Electrical')
    `);
    
    const categories = {};
    categoriesResult.rows.forEach(row => {
      categories[row.name] = row.id;
    });
    
    console.log('Found categories:', categories);
    
    // Get a valid brand ID
    const brandResult = await client.query('SELECT id FROM brands LIMIT 5');
    const brandIds = brandResult.rows.map(row => row.id);
    console.log('Found brand IDs:', brandIds);
    
    // Get a valid model ID for each brand
    const modelIds = [];
    for (const brandId of brandIds) {
      const modelResult = await client.query('SELECT id FROM car_models WHERE brand_id = $1 LIMIT 1', [brandId]);
      if (modelResult.rows.length > 0) {
        modelIds.push({
          brandId,
          modelId: modelResult.rows[0].id
        });
      }
    }
    console.log('Found brand/model pairs:', modelIds);
    
    // Get a valid user ID
    const userResult = await client.query('SELECT id FROM users LIMIT 1');
    const userId = userResult.rows[0]?.id;
    console.log('Using user ID:', userId);
    
    if (!userId || Object.keys(categories).length === 0 || modelIds.length === 0) {
      throw new Error('Required data not found in database');
    }
    
    // Insert test parts
    const testParts = [
      {
        title: 'BMW Engine Piston Set',
        category: 'Engine Parts',
        brandModelPair: modelIds[0] || modelIds[modelIds.length - 1],
        condition: 'new',
        price: 450,
        description: 'High performance piston set for BMW engines',
        description_en: 'High performance piston set for BMW engines',
        description_ka: 'მაღალი წარმადობის დგუშების ნაკრები BMW ძრავებისთვის'
      },
      {
        title: 'Mercedes Front Bumper',
        category: 'Body Parts',
        brandModelPair: modelIds[1] || modelIds[0],
        condition: 'used',
        price: 750,
        description: 'Used front bumper in good condition with minor scratches',
        description_en: 'Used front bumper in good condition with minor scratches',
        description_ka: 'ნახმარი წინა ბამპერი კარგ მდგომარეობაში მცირე ნაკაწრებით'
      },
      {
        title: 'Toyota Brake Discs - Pair',
        category: 'Braking System',
        brandModelPair: modelIds[2] || modelIds[0],
        condition: 'new',
        price: 320,
        description: 'New high-quality brake discs for Toyota models',
        description_en: 'New high-quality brake discs for Toyota models',
        description_ka: 'ახალი, მაღალი ხარისხის სამუხრუჭე დისკები Toyota-ს მოდელებისთვის'
      }
    ];
    
    for (const part of testParts) {
      const insertQuery = `
        INSERT INTO parts(
          title, category_id, brand_id, model_id, condition, price, 
          description, description_en, description_ka, seller_id
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;
      
      const result = await client.query(insertQuery, [
        part.title,
        categories[part.category],
        part.brandModelPair.brandId,
        part.brandModelPair.modelId,
        part.condition,
        part.price,
        part.description,
        part.description_en,
        part.description_ka,
        userId
      ]);
      
      console.log(`✓ Created part: ${part.title} with ID ${result.rows[0].id}`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('✓ All test parts inserted successfully!');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error inserting test data:', error);
  } finally {
    // Release client
    client.release();
    process.exit(0);
  }
}

insertTestParts();
