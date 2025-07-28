const VipPricing = require('../src/models/VipPricing');

async function debugVipPricing() {
  try {
    console.log('Testing VIP Pricing operations...');
    
    // First, try to initialize the table
    console.log('1. Initializing VIP pricing table...');
    await VipPricing.createTableIfNotExists();
    
    console.log('2. Fetching all existing pricing...');
    const allPricing = await VipPricing.findAll();
    console.log('Existing pricing records:', allPricing.length);
    
    if (allPricing.length > 0) {
      console.log('Sample record:', allPricing[0]);
    }
    
    console.log('3. Testing upsert with user role...');
    const testRecord = await VipPricing.upsert({
      service_type: 'vip',
      price: 2.50,
      duration_days: 1,
      is_daily_price: true,
      user_role: 'user'
    });
    
    console.log('Upsert successful:', testRecord);
    
    console.log('4. Testing grouped by role fetch...');
    const groupedPricing = await VipPricing.findAllGroupedByRole();
    console.log('Grouped pricing:', Object.keys(groupedPricing));
    
  } catch (error) {
    console.error('Debug failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

debugVipPricing();