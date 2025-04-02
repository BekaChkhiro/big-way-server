/**
 * This script prepares a SQL file for Render.com deployment without requiring a direct connection.
 * It creates a fresh database dump and modifies SQL statements to ensure compatibility with Render.com.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Local database configuration
const localConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Lumia635-',
  database: process.env.NODE_ENV === 'test' ? 'big_way_test_db' : 'big_way_db',
};

// Temporary file paths
const DUMP_FILE = path.join(__dirname, 'fresh-dump.sql');
const renderReadyPath = path.join(__dirname, 'render-ready-import.sql');

async function prepareRenderImport() {
  try {
    // Create a fresh database dump
    console.log('Creating a fresh database dump...');
    const pgDumpCmd = `PGPASSWORD="${localConfig.password}" pg_dump -h ${localConfig.host} -p ${localConfig.port} -U ${localConfig.user} -d ${localConfig.database} --no-owner --no-acl > ${DUMP_FILE}`;
    
    try {
      await execPromise(pgDumpCmd);
      console.log(`✓ Fresh database dump created at ${DUMP_FILE}`);
    } catch (dumpError) {
      console.error('Error creating database dump:', dumpError);
      throw dumpError;
    }
    
    console.log('Reading SQL dump...');
    let sqlContent = fs.readFileSync(DUMP_FILE, 'utf8');
    
    // Apply fixes based on known issues
    console.log('Applying fixes for Render.com compatibility...');
    
    // 1. Remove references to non-existent tables
    console.log('Removing references to non-existent tables...');
    const backupCategoriesRegex = /--\s*Data for Name: backup_categories[\s\S]*?--\s*Data for Name:/g;
    sqlContent = sqlContent.replace(backupCategoriesRegex, '-- Data for Name:');
    
    // 2. Fix models table issues
    console.log('Handling models table...');
    // Create models table if it doesn't exist
    const createModelsTable = `
-- Create models table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand_id INTEGER REFERENCES public.brands(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

`;
    
    // Add models table creation at the beginning
    sqlContent = sqlContent.replace(/SET row_security = off;/, `SET row_security = off;

${createModelsTable}`);
    
    // 3. Fix car_models table issues
    console.log('Handling car_models table...');
    // Create car_models table if it doesn't exist
    const createCarModelsTable = `
-- Create car_models table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.car_models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand_id INTEGER REFERENCES public.brands(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

`;
    
    // Add car_models table creation at the beginning
    sqlContent = sqlContent.replace(/SET row_security = off;/, `SET row_security = off;

${createCarModelsTable}`);
    
    // Extract existing car_models statements if any
    let carModelsStatements = [];
    const carModelsRegex = /INSERT INTO public\.car_models[^;]*;/g;
    let carModelsMatch;
    
    while ((carModelsMatch = carModelsRegex.exec(sqlContent)) !== null) {
      carModelsStatements.push(carModelsMatch[0]);
    }
    
    console.log(`Found ${carModelsStatements.length} car_models statements`);
    
    // 4. Fix known problematic fields based on our past experience
    console.log('Fixing known problematic fields...');
    
    // 4.1. Fix car_images table (url -> image_url)
    console.log('Fixing car_images table (url -> image_url)...');
    sqlContent = sqlContent.replace(/INSERT INTO public\.car_images.*?\(car_id, url/g, 
                                  (match) => match.replace('(car_id, url', '(car_id, image_url'));
    
    // 4.2. Fix steering_wheel field constraints
    console.log('Fixing steering_wheel field constraints...');
    // Remove from table definitions
    sqlContent = sqlContent.replace(/,\s*steering_wheel\s*character varying\([^)]+\)[^,)]*,/g, ',');
    // Remove from INSERT statements
    sqlContent = sqlContent.replace(/,\s*steering_wheel\s*=\s*'[^']*'/g, '');
    
    // 4.3. Fix transmission field constraints
    console.log('Fixing transmission field constraints...');
    // Remove from table definitions
    sqlContent = sqlContent.replace(/,\s*transmission\s*character varying\([^)]+\)[^,)]*,/g, ',');
    // Remove from INSERT statements
    sqlContent = sqlContent.replace(/,\s*transmission\s*=\s*'[^']*'/g, '');
    
    // 4.4. Fix doors field constraints (foreign key constraint violation fk_door_count)
    console.log('Fixing doors field constraints...');
    // Remove from table definitions
    sqlContent = sqlContent.replace(/,\s*doors\s*integer[^,)]*,/g, ',');
    // Remove from INSERT statements
    sqlContent = sqlContent.replace(/,\s*doors\s*=\s*\d+/g, '');
    
    // 4.5. Fix locations table issues
    console.log('Fixing locations table issues...');
    // Remove is_transit field if it doesn't exist
    sqlContent = sqlContent.replace(/,\s*is_transit\s*boolean[^,)]*,/g, ',');
    // Fix location_type field - ensure it's one of: 'city', 'country', 'special', or 'transit'
    sqlContent = sqlContent.replace(/location_type\s*=\s*'dealer'/g, "location_type = 'city'");
    
    // 4.6. Fix categories table type field - ensure it's not NULL
    console.log('Fixing categories table type field...');
    sqlContent = sqlContent.replace(/INSERT INTO public\.categories.*?\(([^)]*)\) VALUES \(([^)]*)(, NULL)([^)]*)\)/g, 
                                  (match, cols, vals, nullVal, rest) => {
                                    // Replace NULL with 'other'
                                    return match.replace(nullVal, ", 'other'");
                                  });
    sqlContent = sqlContent.replace(/type\s*=\s*NULL/g, "type = 'other'");
    
    // 5. Write the fixed SQL to the render-ready file
    console.log('Writing deployment-ready SQL file...');
    fs.writeFileSync(renderReadyPath, sqlContent);
    console.log(`✓ Deployment-ready SQL saved to: ${renderReadyPath}`);
    
    console.log('\nINSTRUCTIONS:');
    console.log('1. Upload the render-ready-import.sql file to your Render.com application');
    console.log('2. Connect to your Render.com shell and run:');
    console.log('   psql $DATABASE_URL -f database/render-ready-import.sql');
    console.log('3. This will create all tables and import all data with the necessary fixes');
    console.log('\nNOTE: If you encounter any errors during import, you may need to:');
    console.log('1. Drop the problematic table: DROP TABLE table_name CASCADE;');
    console.log('2. Re-run the import: psql $DATABASE_URL -f database/render-ready-import.sql');
    
  } catch (error) {
    console.error('Error in prepare process:', error);
    throw error;
  }
}

// Run the preparation function
prepareRenderImport()
  .catch(error => {
    console.error('Failed to prepare import file:', error);
    process.exit(1);
  })
  .then(() => {
    console.log('Preparation process completed.');
    process.exit(0);
  });
