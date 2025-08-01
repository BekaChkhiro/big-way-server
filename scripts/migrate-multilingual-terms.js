// Load environment variables first
require('dotenv').config();
const { pg } = require('../config/db.config');

async function runMultilingualTermsMigration() {
  const client = await pg.connect();
  
  try {
    console.log('Starting multilingual terms migration...');
    
    // Add language-specific columns to terms_and_conditions table
    await client.query(`
      ALTER TABLE terms_and_conditions 
      ADD COLUMN IF NOT EXISTS title_en VARCHAR(500),
      ADD COLUMN IF NOT EXISTS title_ru VARCHAR(500),
      ADD COLUMN IF NOT EXISTS content_en TEXT,
      ADD COLUMN IF NOT EXISTS content_ru TEXT;
    `);
    console.log('✓ Added new language columns');
    
    // Check if old columns exist before renaming
    const titleColumnExists = await client.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='terms_and_conditions' AND column_name='title'
    `);
    
    const contentColumnExists = await client.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='terms_and_conditions' AND column_name='content'
    `);
    
    if (titleColumnExists.rows.length > 0) {
      await client.query('ALTER TABLE terms_and_conditions RENAME COLUMN title TO title_ka');
      console.log('✓ Renamed title column to title_ka');
    } else {
      console.log('ℹ title column already renamed or doesn\'t exist');
    }
    
    if (contentColumnExists.rows.length > 0) {
      await client.query('ALTER TABLE terms_and_conditions RENAME COLUMN content TO content_ka');
      console.log('✓ Renamed content column to content_ka');
    } else {
      console.log('ℹ content column already renamed or doesn\'t exist');
    }
    
    // Verify the changes
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'terms_and_conditions' 
      ORDER BY column_name
    `);
    
    console.log('\n✓ Migration completed successfully!');
    console.log('\nCurrent table structure:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
runMultilingualTermsMigration()
  .then(() => {
    console.log('\n🎉 Multilingual terms migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });