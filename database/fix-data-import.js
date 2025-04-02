require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Get database URL from environment variable or use the hardcoded one for testing
let connectionString = process.env.DATABASE_URL;

// If DATABASE_URL is not set, use the hardcoded connection string
if (!connectionString) {
  connectionString = 'postgresql://big_way_main_user:EV1I0ber4F9YewNwz6ojKN2FSQrZuoqq@dpg-cvmhjfogjchc73d3qhag-a/big_way_main';
  console.log('DATABASE_URL not found in environment, using hardcoded connection string');
}

console.log('Connecting to Render.com database...');

// Create a new pool with the connection string
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Function to clean up SQL dump by removing problematic statements
async function cleanupAndImportData() {
  try {
    // Path to the original SQL dump file
    const originalDumpPath = path.join(__dirname, 'data-only-dump.sql');
    const cleanDumpPath = path.join(__dirname, 'clean-data-dump.sql');
    
    console.log('Reading original SQL dump...');
    let sqlContent = fs.readFileSync(originalDumpPath, 'utf8');
    
    // Remove all statements related to backup_categories table
    console.log('Removing backup_categories statements...');
    const backupCategoriesRegex = /--\s*Data for Name: backup_categories[\s\S]*?--\s*Data for Name:/g;
    sqlContent = sqlContent.replace(backupCategoriesRegex, '-- Data for Name:');
    
    // Extract car_models statements for later use
    console.log('Extracting car_models statements for controlled import...');
    let carModelsStatements = [];
    const carModelsRegex = /INSERT INTO public\.car_models[^;]*;/g;
    let carModelsMatch;
    
    while ((carModelsMatch = carModelsRegex.exec(sqlContent)) !== null) {
      carModelsStatements.push(carModelsMatch[0]);
    }
    
    console.log(`Extracted ${carModelsStatements.length} car_models statements`);
    
    // Remove car_models statements from the main SQL content
    sqlContent = sqlContent.replace(/INSERT INTO public\.car_models[^;]*;/g, '');
    
    // Also remove any section headers for car_models
    const carModelsHeaderRegex = /--\s*Data for Name: car_models[\s\S]*?--\s*Data for Name:/g;
    sqlContent = sqlContent.replace(carModelsHeaderRegex, '-- Data for Name:');
    
    // Fix any other known problematic statements based on our past experience
    console.log('Fixing known problematic statements...');
    
    // 1. Fix car_images table (url -> image_url)
    sqlContent = sqlContent.replace(/INSERT INTO public\.car_images.*?\(url\)/g, 
                                   (match) => match.replace('(url)', '(image_url)'));
    
    // 2. Remove steering_wheel field from cars table if it exists
    sqlContent = sqlContent.replace(/INSERT INTO public\.cars.*?(, steering_wheel)/g, 
                                   (match) => match.replace(', steering_wheel', ''));
    sqlContent = sqlContent.replace(/, '[a-z]+'::steering_wheel_position/g, '');
    
    // 3. Remove transmission field from cars table if it exists
    sqlContent = sqlContent.replace(/INSERT INTO public\.cars.*?(, transmission)/g, 
                                   (match) => match.replace(', transmission', ''));
    sqlContent = sqlContent.replace(/, '[a-z]+'::transmission_type/g, '');
    
    // 4. Remove doors field from cars table if it exists
    sqlContent = sqlContent.replace(/INSERT INTO public\.cars.*?(, doors)/g, 
                                   (match) => match.replace(', doors', ''));
    sqlContent = sqlContent.replace(/, \d+::integer/g, '');
    
    // 5. Remove is_transit field from locations table if it exists
    sqlContent = sqlContent.replace(/INSERT INTO public\.locations.*?(, is_transit)/g, 
                                   (match) => match.replace(', is_transit', ''));
    sqlContent = sqlContent.replace(/, (true|false)/g, '');
    
    // 6. Fix categories table type field - ensure it's not NULL
    console.log('Fixing categories table type field...');
    sqlContent = sqlContent.replace(/INSERT INTO public\.categories.*?\(([^)]*)\) VALUES \(([^)]*)(, NULL)([^)]*)\)/g, 
                                   (match, cols, vals, nullVal, rest) => {
                                     // Replace NULL with 'other'
                                     return match.replace(nullVal, ", 'other'");
                                   });
    
    // Write the cleaned SQL to a new file
    console.log('Writing cleaned SQL dump...');
    fs.writeFileSync(cleanDumpPath, sqlContent);
    console.log(`Cleaned SQL dump saved to: ${cleanDumpPath}`);
    
    // Connect to the database and check schema first
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // First, let's check if we need to create the car_models table
      console.log('Checking if car_models table exists...');
      const tableCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'car_models'
        );
      `);
      
      const modelsTableExists = tableCheckResult.rows[0].exists;
      
      if (!modelsTableExists) {
        console.log('car_models table does not exist. Creating it...');
        await client.query(`
          CREATE TABLE IF NOT EXISTS public.car_models (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            brand_id INTEGER REFERENCES public.brands(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('car_models table created successfully.');
      } else {
        console.log('car_models table already exists.');
      }
      
      // Check categories table structure
      console.log('Checking categories table structure...');
      const categoriesResult = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'categories';
      `);
      
      console.log('Categories table structure:', categoriesResult.rows);
      
      // Start importing data
      console.log('Starting data import...');
      
      // Instead of running the entire SQL at once, split it into individual statements
      // This allows us to continue even if some statements fail
      const statements = sqlContent.split(';').filter(stmt => stmt.trim());
      
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      
      // First import all non-car_models data
      console.log('Importing main data...');
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt) continue;
        
        try {
          await client.query(stmt + ';');
          successCount++;
          
          // Log progress periodically
          if (successCount % 50 === 0) {
            console.log(`Progress: ${successCount}/${statements.length} statements executed successfully`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error executing statement #${i+1}: ${error.message}`);
          console.error(`Statement: ${stmt.substring(0, 150)}...`);
          // Continue with the next statement
        }
      }
      
      // Now import car_models data separately
      console.log('\nImporting car_models data...');
      let carModelsSuccess = 0;
      let carModelsError = 0;
      
      for (let i = 0; i < carModelsStatements.length; i++) {
        const stmt = carModelsStatements[i].trim();
        if (!stmt) continue;
        
        try {
          await client.query(stmt);
          carModelsSuccess++;
          
          // Log progress periodically
          if (carModelsSuccess % 50 === 0) {
            console.log(`Progress: ${carModelsSuccess}/${carModelsStatements.length} car_models statements executed successfully`);
          }
        } catch (error) {
          carModelsError++;
          console.error(`Error executing car_models statement #${i+1}: ${error.message}`);
          console.error(`Statement: ${stmt.substring(0, 150)}...`);
          // Continue with the next statement
        }
      }
      
      console.log(`\ncar_models import completed with ${carModelsSuccess} successful and ${carModelsError} failed statements`);
      
      console.log(`\nOverall import completed with:`);
      console.log(`- Main data: ${successCount} successful, ${errorCount} failed, and ${skippedCount} skipped statements`);
      console.log(`- car_models data: ${carModelsSuccess} successful and ${carModelsError} failed statements`);
      
    } finally {
      client.release();
      await pool.end();
    }
    
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error in cleanup and import process:', error);
    throw error;
  }
}

// Run the cleanup and import function
cleanupAndImportData()
  .catch(error => {
    console.error('Failed to import data:', error);
    process.exit(1);
  })
  .then(() => {
    console.log('Process completed.');
    process.exit(0);
  });
