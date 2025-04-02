/**
 * This script fixes the location_type constraint in the Render.com database
 * to match the local database structure.
 * 
 * It will:
 * 1. Check the current constraint on location_type
 * 2. Update existing location_type values to 'city' if they're invalid
 * 3. Update the constraint to match the local database
 */

const { Client } = require('pg');
require('dotenv').config();

async function fixLocationTypeConstraint() {
  // Use DATABASE_URL from environment or the provided connection string
  const connectionString = process.env.DATABASE_URL || 
    'postgresql://big_way_main_user:EV1I0ber4F9YewNwz6ojKN2FSQrZuoqq@dpg-cvmhjfogjchc73d3qhag-a/big_way_main';
  
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    // Start a transaction
    await client.query('BEGIN');

    // 1. Check current constraint
    const constraintQuery = `
      SELECT con.conname as constraint_name,
             pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'locations'
      AND nsp.nspname = 'public'
      AND con.conname LIKE '%location_type%';
    `;
    const constraintResult = await client.query(constraintQuery);
    
    if (constraintResult.rows.length > 0) {
      console.log('Current location_type constraint:');
      console.log(constraintResult.rows[0].constraint_definition);
      
      // 2. Update existing values to 'city' if they're invalid
      console.log('Updating invalid location_type values to "city"...');
      await client.query(`
        UPDATE locations
        SET location_type = 'city'
        WHERE location_type IS NULL
           OR location_type NOT IN ('city', 'country', 'special', 'transit');
      `);
      
      // 3. Drop the existing constraint
      const constraintName = constraintResult.rows[0].constraint_name;
      console.log(`Dropping constraint: ${constraintName}`);
      await client.query(`ALTER TABLE locations DROP CONSTRAINT IF EXISTS ${constraintName};`);
    }
    
    // 4. Add the new constraint matching the local database
    console.log('Adding new constraint for location_type...');
    await client.query(`
      ALTER TABLE locations 
      ADD CONSTRAINT locations_location_type_check 
      CHECK (location_type::text = ANY (ARRAY['city'::character varying, 'country'::character varying, 'special'::character varying, 'transit'::character varying]::text[]));
    `);
    
    // 5. Make location_type NOT NULL
    console.log('Making location_type NOT NULL...');
    await client.query(`
      ALTER TABLE locations 
      ALTER COLUMN location_type SET NOT NULL;
    `);
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Successfully updated location_type constraint');
    
    // Verify the changes
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'locations' AND column_name = 'location_type';
    `;
    const verifyResult = await client.query(verifyQuery);
    console.log('Updated location_type column:');
    console.log(verifyResult.rows[0]);
    
    const verifyConstraintQuery = `
      SELECT con.conname as constraint_name,
             pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'locations'
      AND nsp.nspname = 'public'
      AND con.conname LIKE '%location_type%';
    `;
    const verifyConstraintResult = await client.query(verifyConstraintQuery);
    console.log('Updated location_type constraint:');
    console.log(verifyConstraintResult.rows[0].constraint_definition);
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Connection closed');
  }
}

fixLocationTypeConstraint().catch(console.error);
