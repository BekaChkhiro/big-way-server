require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Get database URL from environment variable
const connectionString = process.env.DATABASE_URL;
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
    
    // Write the cleaned SQL to a new file
    console.log('Writing cleaned SQL dump...');
    fs.writeFileSync(cleanDumpPath, sqlContent);
    console.log(`Cleaned SQL dump saved to: ${cleanDumpPath}`);
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      console.log('Starting data import...');
      
      // Instead of running the entire SQL at once, split it into individual statements
      // This allows us to continue even if some statements fail
      const statements = sqlContent.split(';').filter(stmt => stmt.trim());
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt) continue;
        
        try {
          await client.query(stmt + ';');
          successCount++;
          
          // Log progress periodically
          if (successCount % 100 === 0) {
            console.log(`Progress: ${successCount}/${statements.length} statements executed successfully`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error executing statement #${i+1}: ${error.message}`);
          // Continue with the next statement
        }
      }
      
      console.log(`Import completed with ${successCount} successful and ${errorCount} failed statements`);
      
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
