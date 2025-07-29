const VipPricing = require('../src/models/VipPricing');

async function initVipPricing() {
  try {
    console.log('Initializing VIP pricing table...');
    
    await VipPricing.createTableIfNotExists();
    
    console.log('✅ VIP pricing table initialized successfully!');
    
    // Test that it works
    console.log('Testing VIP pricing operations...');
    const testData = await VipPricing.findAll();
    console.log(`Found ${testData.length} pricing records`);
    
    // Test upsert
    console.log('Testing upsert...');
    const testResult = await VipPricing.upsert({
      service_type: 'vip',
      price: 2.5,
      duration_days: 1,
      is_daily_price: true,
      user_role: 'user'
    });
    console.log('Upsert test successful:', testResult.id);
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    console.error('Error details:', error.message);
  } finally {
    process.exit(0);
  }
}

initVipPricing();