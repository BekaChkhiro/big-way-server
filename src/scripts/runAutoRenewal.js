#!/usr/bin/env node

/**
 * Auto-renewal script for daily execution
 * This script should be run daily via cron job or scheduled task
 * 
 * Usage:
 * node src/scripts/runAutoRenewal.js
 * 
 * Cron job example (run every day at 3 AM):
 * 0 3 * * * cd /path/to/big-way-server && node src/scripts/runAutoRenewal.js
 */

const autoRenewalService = require('../services/autoRenewalService');

async function runAutoRenewal() {
  console.log(`\n=== Auto-Renewal Script Started at ${new Date().toISOString()} ===`);
  
  try {
    // Disable expired auto-renewals first
    console.log('\n1. Disabling expired auto-renewals...');
    const disableResult = await autoRenewalService.disableExpiredAutoRenewals();
    
    if (disableResult.success) {
      console.log(`✓ Disabled ${disableResult.total} expired auto-renewals`);
      console.log(`  - Cars: ${disableResult.disabledCars}`);
      console.log(`  - Parts: ${disableResult.disabledParts}`);
    } else {
      console.error('✗ Failed to disable expired auto-renewals:', disableResult.error);
    }
    
    // Process active auto-renewals
    console.log('\n2. Processing active auto-renewals...');
    const processResult = await autoRenewalService.processAllAutoRenewals();
    
    if (processResult.cars.success && processResult.parts.success) {
      console.log(`✓ Auto-renewal processing completed successfully`);
      console.log(`  - Cars renewed: ${processResult.cars.renewed}/${processResult.cars.total}`);
      console.log(`  - Parts renewed: ${processResult.parts.renewed}/${processResult.parts.total}`);
      console.log(`  - Total renewed: ${processResult.totalRenewed}`);
      console.log(`  - Duration: ${processResult.duration}`);
    } else {
      console.error('✗ Auto-renewal processing had errors');
      if (!processResult.cars.success) {
        console.error('  - Car processing failed');
      }
      if (!processResult.parts.success) {
        console.error('  - Part processing failed');
      }
    }
    
    // Get and display statistics
    console.log('\n3. Auto-renewal statistics:');
    const statsResult = await autoRenewalService.getAutoRenewalStats();
    
    if (statsResult.success) {
      statsResult.stats.forEach(stat => {
        console.log(`  ${stat.type.toUpperCase()}:`);
        console.log(`    - Total with auto-renewal: ${stat.total_with_auto_renewal}`);
        console.log(`    - Active auto-renewals: ${stat.active_auto_renewals}`);
        console.log(`    - Expired auto-renewals: ${stat.expired_auto_renewals}`);
      });
    } else {
      console.error('✗ Failed to get auto-renewal statistics:', statsResult.error);
    }
    
    console.log(`\n=== Auto-Renewal Script Completed at ${new Date().toISOString()} ===\n`);
    
    // Exit with success code
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ Auto-renewal script failed with error:', error);
    console.error('Stack trace:', error.stack);
    
    // Exit with error code
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the auto-renewal script
runAutoRenewal();