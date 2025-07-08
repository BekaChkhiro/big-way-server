const pool = require('./config/db.config');

async function checkLatestCar() {
  try {
    // Check the latest added car
    const latestCar = await pool.query(`
      SELECT id, model, year, vin_code, created_at 
      FROM cars 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    console.log('Latest car:', latestCar.rows[0]);
    
    // If there's a car, check it using the CarModel.findById method
    if (latestCar.rows.length > 0) {
      const CarModel = require('./src/models/car/base').CarModel;
      const carFromModel = await CarModel.findById(latestCar.rows[0].id);
      
      console.log('Car from CarModel.findById:');
      console.log('- ID:', carFromModel.id);
      console.log('- Model:', carFromModel.model);
      console.log('- Year:', carFromModel.year);
      console.log('- VIN Code:', carFromModel.vin_code);
      console.log('- VIN Code type:', typeof carFromModel.vin_code);
      console.log('- VIN Code length:', carFromModel.vin_code ? carFromModel.vin_code.length : 'null/undefined');
    }
    
  } catch (error) {
    console.error('Error checking latest car:', error);
  } finally {
    process.exit(0);
  }
}

checkLatestCar();