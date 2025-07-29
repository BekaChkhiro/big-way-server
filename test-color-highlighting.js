// Quick test script to check color highlighting functionality
const { pg: pool } = require('./config/db.config');

async function testColorHighlighting() {
  console.log('Testing color highlighting setup...');
  
  try {
    // Check if color highlighting columns exist
    const columnCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cars' 
      AND column_name LIKE '%color_highlighting%'
      ORDER BY column_name
    `);
    
    console.log('Color highlighting columns in cars table:');
    columnCheck.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ No color highlighting columns found! Need to run migrations.');
      return;
    }
    
    // Test a simple update to see if it works
    const testCarId = 1; // Assuming there's a car with ID 1
    
    console.log(`\nTesting color highlighting update for car ${testCarId}...`);
    
    const updateQuery = `
      UPDATE cars 
      SET 
        color_highlighting_enabled = $1,
        color_highlighting_expiration_date = $2,
        color_highlighting_total_days = $3,
        color_highlighting_remaining_days = $4
      WHERE id = $5
      RETURNING id, color_highlighting_enabled, color_highlighting_expiration_date
    `;
    
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // 7 days from now
    
    const result = await pool.query(updateQuery, [
      true,
      expirationDate.toISOString(),
      7,
      7,
      testCarId
    ]);
    
    if (result.rowCount > 0) {
      console.log('✅ Color highlighting update successful!');
      console.log('Result:', result.rows[0]);
    } else {
      console.log('❌ No car found with ID', testCarId);
    }
    
  } catch (error) {
    console.error('❌ Error testing color highlighting:', error.message);
    
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('\n💡 Solution: Run the color highlighting migration:');
      console.log('   psql -d your_database -f database/migrations/add_color_highlighting_to_cars.sql');
    }
  } finally {
    await pool.end();
  }
}

testColorHighlighting();