const { pg: pool } = require('../config/db.config');

async function addTestVipData() {
  const client = await pool.connect();
  
  try {
    console.log('Adding test VIP data to cars and parts...');
    
    // Check if VIP columns exist in cars table
    const carsColumnCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'cars' 
      AND column_name IN ('vip_status', 'vip_expiration_date');
    `);
    
    console.log('Cars table VIP columns:', carsColumnCheck.rows);
    
    // Check if VIP columns exist in parts table
    const partsColumnCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'parts' 
      AND column_name IN ('vip_status', 'vip_expiration_date');
    `);
    
    console.log('Parts table VIP columns:', partsColumnCheck.rows);
    
    // Get some sample cars
    const carsResult = await client.query('SELECT id FROM cars LIMIT 10');
    console.log(`Found ${carsResult.rows.length} cars`);
    
    // Get some sample parts  
    const partsResult = await client.query('SELECT id FROM parts LIMIT 10');
    console.log(`Found ${partsResult.rows.length} parts`);
    
    // If VIP columns exist in cars, update some with VIP status
    if (carsColumnCheck.rows.length >= 2) {
      for (let i = 0; i < Math.min(carsResult.rows.length, 6); i++) {
        const car = carsResult.rows[i];
        const vipStatuses = ['vip', 'vip_plus', 'super_vip'];
        const vipStatus = vipStatuses[i % 3];
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now
        
        await client.query(`
          UPDATE cars 
          SET vip_status = $1, vip_expiration_date = $2 
          WHERE id = $3
        `, [vipStatus, expirationDate, car.id]);
        
        console.log(`Updated car ${car.id} with VIP status: ${vipStatus}`);
      }
    } else {
      console.log('VIP columns not found in cars table. Mock data will be used.');
    }
    
    // If VIP columns exist in parts, update some with VIP status
    if (partsColumnCheck.rows.length >= 2) {
      for (let i = 0; i < Math.min(partsResult.rows.length, 6); i++) {
        const part = partsResult.rows[i];
        const vipStatuses = ['vip', 'vip_plus', 'super_vip'];
        const vipStatus = vipStatuses[i % 3];
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now
        
        await client.query(`
          UPDATE parts 
          SET vip_status = $1, vip_expiration_date = $2 
          WHERE id = $3
        `, [vipStatus, expirationDate, part.id]);
        
        console.log(`Updated part ${part.id} with VIP status: ${vipStatus}`);
      }
    } else {
      console.log('VIP columns not found in parts table.');
    }
    
    console.log('Test VIP data added successfully!');
    
  } catch (error) {
    console.error('Error adding test VIP data:', error);
  } finally {
    client.release();
  }
}

// Run the script
addTestVipData()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });