// Debug script to check color highlighting setup
const { Pool } = require('pg');

// Create a pool using environment variables or default values
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'big_way_marketplace',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function debugColorHighlighting() {
  console.log('🔍 Debugging Color Highlighting Setup...\n');
  
  try {
    // 1. Check if color highlighting columns exist in cars table
    console.log('1. Checking color highlighting columns in cars table...');
    const carsColumnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'cars' 
      AND column_name LIKE '%color_highlighting%'
      ORDER BY column_name
    `;
    
    const carsColumns = await pool.query(carsColumnsQuery);
    
    if (carsColumns.rows.length === 0) {
      console.log('❌ No color highlighting columns found in cars table!');
      console.log('\n💡 Solution: Run the migration:');
      console.log('   psql -d your_database -f database/migrations/add_color_highlighting_to_cars.sql\n');
    } else {
      console.log('✅ Color highlighting columns found in cars table:');
      carsColumns.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
      });
    }
    
    // 2. Check if color highlighting columns exist in parts table
    console.log('\n2. Checking color highlighting columns in parts table...');
    const partsColumnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'parts' 
      AND column_name LIKE '%color_highlighting%'
      ORDER BY column_name
    `;
    
    const partsColumns = await pool.query(partsColumnsQuery);
    
    if (partsColumns.rows.length === 0) {
      console.log('❌ No color highlighting columns found in parts table!');
      console.log('\n💡 Solution: Run the migration:');
      console.log('   psql -d your_database -f database/migrations/add_color_highlighting_to_parts.sql\n');
    } else {
      console.log('✅ Color highlighting columns found in parts table:');
      partsColumns.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
      });
    }
    
    // 3. Check if there are any cars with color highlighting
    if (carsColumns.rows.length > 0) {
      console.log('\n3. Checking existing cars with color highlighting...');
      const carsWithHighlightingQuery = `
        SELECT id, brand, model, title, color_highlighting_enabled, color_highlighting_expiration_date, color_highlighting_total_days
        FROM cars 
        WHERE color_highlighting_enabled = TRUE
        LIMIT 5
      `;
      
      const carsWithHighlighting = await pool.query(carsWithHighlightingQuery);
      
      if (carsWithHighlighting.rows.length === 0) {
        console.log('📝 No cars currently have color highlighting enabled');
      } else {
        console.log('✅ Cars with color highlighting:');
        carsWithHighlighting.rows.forEach(car => {
          console.log(`   - Car ${car.id}: ${car.brand} ${car.model} (expires: ${car.color_highlighting_expiration_date})`);
        });
      }
    }
    
    // 4. Test if we can update a car with color highlighting
    if (carsColumns.rows.length > 0) {
      console.log('\n4. Testing color highlighting update...');
      
      // Find a test car
      const testCarQuery = 'SELECT id, brand, model FROM cars LIMIT 1';
      const testCarResult = await pool.query(testCarQuery);
      
      if (testCarResult.rows.length === 0) {
        console.log('❌ No cars found in database for testing');
      } else {
        const testCar = testCarResult.rows[0];
        console.log(`📝 Testing with car ${testCar.id}: ${testCar.brand} ${testCar.model}`);
        
        // Try to update with color highlighting
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7); // 7 days from now
        
        const updateQuery = `
          UPDATE cars 
          SET 
            color_highlighting_enabled = $1,
            color_highlighting_expiration_date = $2,
            color_highlighting_total_days = $3,
            color_highlighting_remaining_days = $4
          WHERE id = $5
          RETURNING id, color_highlighting_enabled, color_highlighting_expiration_date, color_highlighting_total_days
        `;
        
        try {
          const updateResult = await pool.query(updateQuery, [
            true,
            expirationDate.toISOString(),
            7,
            7,
            testCar.id
          ]);
          
          if (updateResult.rowCount > 0) {
            console.log('✅ Color highlighting update successful!');
            console.log('   Updated data:', updateResult.rows[0]);
          } else {
            console.log('❌ Color highlighting update failed - no rows affected');
          }
        } catch (updateError) {
          console.log('❌ Color highlighting update failed:', updateError.message);
          
          if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
            console.log('\n💡 The columns exist in information_schema but the UPDATE failed.');
            console.log('   This suggests the migration might not have been applied correctly.');
            console.log('   Try re-running the migration or check if you\'re connected to the right database.');
          }
        }
      }
    }
    
    // 5. Check recent balance transactions for color highlighting
    console.log('\n5. Checking recent color highlighting transactions...');
    const transactionsQuery = `
      SELECT id, user_id, amount, transaction_type, description, created_at
      FROM balance_transactions 
      WHERE description ILIKE '%color highlighting%' OR transaction_type LIKE '%color%'
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    const transactions = await pool.query(transactionsQuery);
    
    if (transactions.rows.length === 0) {
      console.log('📝 No color highlighting transactions found');
    } else {
      console.log('✅ Recent color highlighting transactions:');
      transactions.rows.forEach(tx => {
        console.log(`   - Transaction ${tx.id}: ${tx.description} (${tx.amount} GEL) - ${tx.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Database connection failed. Make sure PostgreSQL is running and connection details are correct.');
    } else if (error.message.includes('does not exist')) {
      console.log('\n💡 Database or table does not exist. Check your database setup.');
    }
  } finally {
    await pool.end();
    console.log('\n🏁 Debug complete!');
  }
}

// Run the debug script
debugColorHighlighting().catch(console.error);