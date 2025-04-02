const { Client } = require('pg');

async function checkLocationTypeConstraint() {
  const client = new Client({
    connectionString: 'postgresql://big_way_main_user:EV1I0ber4F9YewNwz6ojKN2FSQrZuoqq@dpg-cvmhjfogjchc73d3qhag-a/big_way_main'
  });

  try {
    await client.connect();
    console.log('Connected to Render.com database');

    // Check table structure
    const tableQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'locations'
      ORDER BY ordinal_position;
    `;
    const tableResult = await client.query(tableQuery);
    console.log('Locations table structure:');
    console.table(tableResult.rows);

    // Check constraints
    const constraintQuery = `
      SELECT con.conname as constraint_name,
             pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'locations'
      AND nsp.nspname = 'public';
    `;
    const constraintResult = await client.query(constraintQuery);
    console.log('Locations table constraints:');
    console.table(constraintResult.rows);

    // Check for enum types
    const enumQuery = `
      SELECT t.typname as enum_name,
             e.enumlabel as enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder;
    `;
    const enumResult = await client.query(enumQuery);
    console.log('Enum types in database:');
    console.table(enumResult.rows);

    // Try to insert with different location_type values
    console.log('\nTesting location_type values:');
    const testValues = ['city', 'country', 'special', 'transit', 'dealer', 'georgia'];
    
    for (const value of testValues) {
      try {
        const insertQuery = `
          INSERT INTO locations (city, state, country, location_type)
          VALUES ('Test City', 'Test State', 'Test Country', $1)
          RETURNING id;
        `;
        const insertResult = await client.query(insertQuery, [value]);
        console.log(`✅ Value '${value}' is valid. Inserted with ID: ${insertResult.rows[0].id}`);
        
        // Clean up the test data
        await client.query('DELETE FROM locations WHERE id = $1', [insertResult.rows[0].id]);
      } catch (error) {
        console.log(`❌ Value '${value}' is invalid: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('Connection closed');
  }
}

checkLocationTypeConstraint().catch(console.error);
