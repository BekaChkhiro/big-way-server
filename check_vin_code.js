const pool = require('./config/db.config');

async function checkVinCodes() {
  try {
    // Check if vin_code column exists in cars table
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'cars' AND column_name = 'vin_code'
    `);
    
    console.log('VIN code column info:', columnCheck.rows);
    
    // Check some sample cars and their VIN codes
    const sampleCars = await pool.query(`
      SELECT id, model, year, vin_code 
      FROM cars 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('Sample cars with VIN codes:');
    sampleCars.rows.forEach(car => {
      console.log(`Car ID: ${car.id}, Model: ${car.model}, Year: ${car.year}, VIN: ${car.vin_code || 'NULL'}`);
    });
    
    // Count cars with and without VIN codes
    const vinStats = await pool.query(`
      SELECT 
        COUNT(*) as total_cars,
        COUNT(vin_code) as cars_with_vin,
        COUNT(*) - COUNT(vin_code) as cars_without_vin
      FROM cars
    `);
    
    console.log('VIN code statistics:', vinStats.rows[0]);
    
  } catch (error) {
    console.error('Error checking VIN codes:', error);
  } finally {
    process.exit(0);
  }
}

checkVinCodes();