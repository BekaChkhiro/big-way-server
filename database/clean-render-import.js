const fs = require('fs');
const path = require('path');

// Path to the data-only SQL file
const dataOnlySqlPath = path.join(__dirname, 'data-only-import.sql');
const cleanedSqlPath = path.join(__dirname, 'clean-render-import.sql');

console.log('Reading data-only SQL file...');
let sqlContent = fs.readFileSync(dataOnlySqlPath, 'utf8');

// Fix the issues encountered during import
console.log('Fixing import issues...');

// 1. Fix the COPY statements for cars table
console.log('Fixing COPY statements format...');
// Convert problematic COPY statements to INSERT statements
const copyRegex = /COPY public\.(\w+) \([^)]+\) FROM stdin;([\s\S]*?)\\./g;
let match;
let fixedContent = sqlContent;

while ((match = copyRegex.exec(sqlContent)) !== null) {
  const tableName = match[1];
  const dataLines = match[2].trim().split('\n');
  
  // Skip empty data blocks
  if (dataLines.length === 0 || (dataLines.length === 1 && dataLines[0].trim() === '')) {
    continue;
  }
  
  console.log(`Converting COPY data for ${tableName} table to INSERT statements...`);
  
  // Create INSERT statements for each data line
  let insertStatements = '';
  
  // Handle cars table specifically
  if (tableName === 'cars') {
    for (const line of dataLines) {
      const values = line.split('\t');
      if (values.length >= 7) { // Make sure we have enough values
        // Format for cars table without description field
        insertStatements += `INSERT INTO public.cars (id, brand_id, category_id, location_id, specification_id, model, year, price, status, featured, seller_id) 
        VALUES (${values[0]}, ${values[1]}, ${values[2]}, ${values[3]}, ${values[4]}, '${values[5]}', ${values[6]}, ${values[7] || 'NULL'}, '${values[8] || 'available'}', ${values[9] || 'false'}, ${values[10] || 'NULL'});\n`;
      }
    }
  } 
  // Handle locations table specifically
  else if (tableName === 'locations') {
    for (const line of dataLines) {
      const values = line.split('\t');
      if (values.length >= 3) {
        // Format for locations table with location_type set to 'city'
        insertStatements += `INSERT INTO public.locations (id, city, state, country, location_type) 
        VALUES (${values[0]}, '${values[1]}', '${values[2]}', '${values[3]}', 'city');\n`;
      }
    }
  }
  // Handle specifications table specifically
  else if (tableName === 'specifications') {
    for (const line of dataLines) {
      const values = line.split('\t');
      if (values.length >= 1) {
        // Format for specifications table
        insertStatements += `INSERT INTO public.specifications (id, fuel_type) 
        VALUES (${values[0]}, '${values[1]}');\n`;
      }
    }
  }
  // Handle other tables generically
  else {
    for (const line of dataLines) {
      const values = line.split('\t').map(v => v === '\\N' ? 'NULL' : `'${v.replace(/'/g, "''")}'`);
      insertStatements += `INSERT INTO public.${tableName} VALUES (${values.join(', ')});\n`;
    }
  }
  
  // Replace the COPY block with INSERT statements
  fixedContent = fixedContent.replace(match[0], insertStatements);
}

// 2. Fix foreign key constraint issues
console.log('Adding ON CONFLICT clauses to handle duplicate keys...');
fixedContent = fixedContent.replace(/INSERT INTO public\.brands/g, 
  'INSERT INTO public.brands ON CONFLICT (id) DO NOTHING');

// 3. Add transaction blocks for better error handling
console.log('Adding transaction blocks for better error handling...');
fixedContent = `BEGIN;\n\n${fixedContent}\n\nCOMMIT;`;

// 4. Add error handling PL/pgSQL blocks
console.log('Adding error handling blocks...');
fixedContent = `
-- Set client_min_messages to warning to reduce noise
SET client_min_messages TO warning;

-- Enable transaction-level exception handling
DO $$
BEGIN
  -- Main import transaction
  ${fixedContent}
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Import failed: %', SQLERRM;
  ROLLBACK;
END $$;

-- Reset sequences to max value + 1 for each table with an id column
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'id' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, %L), COALESCE((SELECT MAX(id) FROM %I), 0) + 1, false)', 
                  tbl.table_name, 'id', tbl.table_name);
  END LOOP;
END $$;
`;

// Write the cleaned SQL to a new file
console.log('Writing cleaned SQL file...');
fs.writeFileSync(cleanedSqlPath, fixedContent);

console.log(`✓ Cleaned SQL file saved to: ${cleanedSqlPath}`);
console.log(`
INSTRUCTIONS:
1. Upload the clean-render-import.sql file to your Render.com application
2. Connect to your Render.com shell and run:
   psql $DATABASE_URL -f database/clean-render-import.sql
3. This will import the data with better error handling

NOTE: This script has been designed to:
1. Convert COPY statements to INSERT statements
2. Add ON CONFLICT clauses to handle duplicate keys
3. Add transaction blocks for better error handling
4. Fix issues with the cars, locations, and specifications tables
5. Reset sequences after import
`);
