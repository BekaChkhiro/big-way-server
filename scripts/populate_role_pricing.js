const VipPricing = require('../src/models/VipPricing');

async function populateRolePricing() {
  try {
    console.log('Populating role-based pricing...');
    
    // Initialize the table first
    await VipPricing.createTableIfNotExists();
    
    const roles = ['user', 'dealer', 'autosalon'];
    const serviceTypes = [
      { service_type: 'free', price: 0, duration_days: 30, is_daily_price: false },
      { service_type: 'vip', price: 2, duration_days: 1, is_daily_price: true },
      { service_type: 'vip_plus', price: 5, duration_days: 1, is_daily_price: true },
      { service_type: 'super_vip', price: 7, duration_days: 1, is_daily_price: true },
      { service_type: 'color_highlighting', price: 0.5, duration_days: 1, is_daily_price: true },
      { service_type: 'auto_renewal', price: 0.5, duration_days: 1, is_daily_price: true }
    ];
    
    // Create pricing for each role
    for (const role of roles) {
      console.log(`\nProcessing role: ${role}`);
      for (const service of serviceTypes) {
        try {
          const result = await VipPricing.upsert({
            ...service,
            user_role: role
          });
          console.log(`✓ ${role}/${service.service_type}: ${service.price}`);
        } catch (error) {
          console.error(`✗ Failed to create ${role}/${service.service_type}:`, error.message);
        }
      }
    }
    
    // Verify the results
    console.log('\nVerifying results...');
    const groupedPricing = await VipPricing.findAllGroupedByRole();
    
    for (const role of roles) {
      console.log(`${role}: ${groupedPricing[role]?.length || 0} services`);
    }
    
    console.log('\n✅ Role-based pricing population completed!');
    
  } catch (error) {
    console.error('❌ Population failed:', error);
  } finally {
    process.exit(0);
  }
}

populateRolePricing();