require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function to execute SQL files
async function executeSqlFile(filePath) {
  try {
    console.log(`Executing SQL file: ${filePath}`);
    
    // Handle both absolute and relative paths
    let fullPath;
    if (path.isAbsolute(filePath)) {
      fullPath = filePath;
    } else {
      // For relative paths, first try relative to current directory
      const relativePath = path.resolve(process.cwd(), filePath);
      if (fs.existsSync(relativePath)) {
        fullPath = relativePath;
      } else {
        // Then try relative to the script directory
        fullPath = path.resolve(__dirname, filePath);
      }
    }
    
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      console.log(`Tried paths:\n- ${path.resolve(process.cwd(), filePath)}\n- ${path.resolve(__dirname, filePath)}`);
      return false;
    }
    
    // Execute the SQL file using psql for better compatibility
    const command = `psql "${process.env.DATABASE_URL}" -f "${fullPath}"`;
    console.log('Running command:', command);
    
    const output = execSync(command, { encoding: 'utf8' });
    console.log('Command output:', output);
    return true;
  } catch (error) {
    console.error('Error executing SQL file:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
    return false;
  }
}

// Function to check database connection
async function checkConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    console.log('Database connection successful:', result.rows[0].time);
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return false;
  }
}

// Function to get table information
async function getTableInfo() {
  try {
    const client = await pool.connect();
    
    // Get list of tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Tables in database:');
    for (const row of tablesResult.rows) {
      const countResult = await client.query(`SELECT COUNT(*) FROM ${row.table_name}`);
      console.log(`- ${row.table_name}: ${countResult.rows[0].count} records`);
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('Error getting table info:', error.message);
    return false;
  }
}

// Function to check enum types and their values
async function checkEnumTypes() {
  try {
    const client = await pool.connect();
    
    // Get enum types
    const enumsResult = await client.query(`
      SELECT t.typname, array_agg(e.enumlabel) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      GROUP BY t.typname
      ORDER BY t.typname
    `);
    
    if (enumsResult.rows.length === 0) {
      console.log('No enum types found in database');
    } else {
      console.log('Enum types in database:');
      for (const row of enumsResult.rows) {
        console.log(`- ${row.typname}: ${row.enum_values.join(', ')}`);
      }
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('Error checking enum types:', error.message);
    return false;
  }
}

// Function to run the full import process
async function runFullImport() {
  console.log('Starting full database import process...');
  
  // Check connection first
  if (!await checkConnection()) {
    console.error('Cannot proceed with import due to connection error');
    return false;
  }
  
  // Run the import scripts in sequence
  const importSteps = [
    { name: 'Basic data import', file: 'fully-adaptive-import.sql' },
    { name: 'Cars and images import', file: 'cars-import.sql' },
    { name: 'Verification', file: 'verify-import.sql' }
  ];
  
  for (const step of importSteps) {
    console.log(`\n==== ${step.name} ====`);
    const success = await executeSqlFile(step.file);
    if (!success) {
      console.error(`Failed at step: ${step.name}`);
      return false;
    }
  }
  
  console.log('\nImport process completed successfully');
  return true;
}

// Main function to handle command line arguments
async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();
  
  switch (command) {
    case 'check':
      await checkConnection();
      break;
    case 'tables':
      await getTableInfo();
      break;
    case 'enums':
      await checkEnumTypes();
      break;
    case 'import':
      await runFullImport();
      break;
    case 'verify':
      await executeSqlFile('verify-import.sql');
      break;
    case 'execute':
      if (args[1]) {
        await executeSqlFile(args[1]);
      } else {
        console.error('Please specify a SQL file to execute');
      }
      break;
    default:
      console.log(`
Database Management Utility

Usage:
  node manage-render-db.js [command]

Commands:
  check     - Check database connection
  tables    - List tables and record counts
  enums     - Check enum types and their values
  import    - Run the full import process
  verify    - Verify the imported data
  execute   - Execute a specific SQL file (e.g., node manage-render-db.js execute my-script.sql)
      `);
  }
  
  // Close the pool
  await pool.end();
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
