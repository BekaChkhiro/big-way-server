const pool = require('./config/db.config');

async function testVinCode() {
  try {
    console.log('Testing VIN code functionality...');
    
    // Insert a test car with VIN code
    const testCar = await pool.query(`
      INSERT INTO cars (
        brand_id, category_id, model, year, price, 
        description_ka, status, seller_id, vin_code,
        location_id, specification_id
      ) VALUES (
        1, 1, 'Test Car', 2023, 25000,
        'ტესტ მანქანა VIN კოდით', 'available', 1, '1HGBH41JXMN109186',
        (SELECT id FROM locations LIMIT 1),
        (SELECT id FROM specifications LIMIT 1)
      )
      RETURNING id, model, year, vin_code
    `);
    
    console.log('Created test car:', testCar.rows[0]);
    
    // Query the car back to verify VIN code
    const carCheck = await pool.query(`
      SELECT id, model, year, vin_code 
      FROM cars 
      WHERE id = $1
    `, [testCar.rows[0].id]);
    
    console.log('Retrieved car:', carCheck.rows[0]);
    
    // Test the findById method from CarModel
    const CarModel = require('./src/models/car/base').CarModel;
    const carFromModel = await CarModel.findById(testCar.rows[0].id);
    
    console.log('Car from model (VIN code):', carFromModel.vin_code);
    
    // Clean up - delete the test car
    await pool.query('DELETE FROM cars WHERE id = $1', [testCar.rows[0].id]);
    console.log('Test car deleted');
    
  } catch (error) {
    console.error('Error testing VIN code:', error);
  } finally {
    process.exit(0);
  }
}

testVinCode();