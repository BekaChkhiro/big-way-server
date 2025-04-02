require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Get database URL from environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('Connecting to Render.com database...');

// Create a new pool with the connection string
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Function to import data from the clean SQL dump
async function importData() {
  try {
    // Path to the cleaned SQL dump file
    // Note: This file should be included in the deployment to Render.com
    const cleanDumpPath = path.join(__dirname, 'clean-data-dump.sql');
    
    if (!fs.existsSync(cleanDumpPath)) {
      console.error(`Clean SQL dump file not found at: ${cleanDumpPath}`);
      process.exit(1);
    }
    
    console.log('Reading cleaned SQL dump...');
    const sqlContent = fs.readFileSync(cleanDumpPath, 'utf8');
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // Check if car_models table exists, create it if it doesn't
      console.log('Checking if car_models table exists...');
      const tableCheckResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'car_models'
        );
      `);
      
      if (!tableCheckResult.rows[0].exists) {
        console.log('Creating car_models table...');
        await client.query(`
          CREATE TABLE public.car_models (
            id SERIAL PRIMARY KEY,
            brand_id INTEGER NOT NULL REFERENCES public.brands(id),
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('car_models table created successfully');
      }
      
      // Start transaction
      await client.query('BEGIN');
      
      // Split the SQL content into individual statements
      console.log('Executing SQL statements...');
      const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
      
      console.log(`Found ${statements.length} SQL statements to execute`);
      
      // Execute each statement
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim() + ';';
        
        try {
          await client.query(statement);
          successCount++;
          
          // Log progress periodically
          if (successCount % 100 === 0) {
            console.log(`Progress: ${successCount}/${statements.length} statements executed successfully`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error executing statement ${i + 1}: ${error.message}`);
          // Continue with the next statement
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log(`Import completed: ${successCount} statements executed successfully, ${errorCount} errors`);
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release client
      client.release();
    }
    
    console.log('Database import completed successfully');
    
  } catch (error) {
    console.error('Error in import process:', error);
    throw error;
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the import function
importData()
  .then(() => {
    console.log('Data import process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to import data:', error);
    process.exit(1);
  });
