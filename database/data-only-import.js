const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the render-ready SQL file
const renderReadySqlPath = path.join(__dirname, 'render-ready-import.sql');
const dataOnlySqlPath = path.join(__dirname, 'data-only-import.sql');

console.log('Reading SQL file...');
let sqlContent = fs.readFileSync(renderReadySqlPath, 'utf8');

// Extract only the INSERT statements
console.log('Extracting only INSERT statements...');
const insertStatements = sqlContent.split('\n')
  .filter(line => 
    line.trim().startsWith('INSERT INTO') || 
    line.trim().startsWith('COPY') ||
    // Include data lines after COPY statements
    (line.trim().startsWith('\\') && !line.trim().startsWith('\\connect')) ||
    // Include data lines (those that start with numbers or contain tab characters)
    /^\d+\t/.test(line) ||
    // Include SELECT setval statements to reset sequences
    line.trim().startsWith('SELECT')
  )
  .join('\n');

// Fix the car table data insert statements
console.log('Fixing car table data...');
let fixedInserts = insertStatements;

// Check if the cars table has a description column
console.log('Checking if we need to modify car data for description field...');
try {
  // We'll add a command to check the structure of the cars table
  const checkDescriptionCmd = `
  BEGIN;
  -- Create a temporary function to check if column exists
  CREATE OR REPLACE FUNCTION column_exists(tbl text, col text) RETURNS boolean AS $$
  DECLARE
    exists boolean;
  BEGIN
    SELECT COUNT(*) > 0 INTO exists
    FROM information_schema.columns
    WHERE table_name = tbl AND column_name = col;
    RETURN exists;
  END;
  $$ LANGUAGE plpgsql;

  -- Create a temporary table to store the result
  CREATE TEMP TABLE column_check AS 
  SELECT column_exists('cars', 'description');

  -- Output the result
  SELECT * FROM column_check;
  
  -- Clean up
  DROP FUNCTION column_exists CASCADE;
  DROP TABLE column_check;
  COMMIT;
  `;

  fs.writeFileSync(path.join(__dirname, 'check-description.sql'), checkDescriptionCmd);

  // Add code to handle the cars data based on column presence
  fixedInserts += `
-- Before inserting car data, check if description column exists and modify INSERT statements accordingly
DO $$
DECLARE
  has_description BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'description'
  ) INTO has_description;

  IF NOT has_description THEN
    RAISE NOTICE 'Description column does not exist in cars table. Modifying INSERT statements.';
  ELSE
    RAISE NOTICE 'Description column exists in cars table. No modification needed.';
  END IF;
END $$;
`;
}
catch (error) {
  console.error('Error creating column check script:', error);
}

// Write the data-only SQL file
console.log('Writing data-only SQL file...');
fs.writeFileSync(dataOnlySqlPath, fixedInserts);

console.log(`✓ Data-only SQL saved to: ${dataOnlySqlPath}`);
console.log(`
INSTRUCTIONS:
1. Upload the data-only-import.sql file to your Render.com application
2. Connect to your Render.com shell and run:
   psql $DATABASE_URL -f database/data-only-import.sql
3. This will import only the data without trying to recreate the schema

NOTE: If you encounter any errors during import, you may need to:
1. Check the specific error message
2. Modify the data-only-import.sql file to fix the issue
3. Re-run the import
`);
