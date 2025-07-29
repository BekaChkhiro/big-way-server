#!/usr/bin/env node

/**
 * Color highlighting script for daily execution
 * This script should be run daily via cron job or scheduled task
 * 
 * Usage:
 * node src/scripts/runColorHighlighting.js
 * 
 * Cron job example (run every day at 2 AM):
 * 0 2 * * * cd /path/to/big-way-server && node src/scripts/runColorHighlighting.js
 */

const colorHighlightingService = require('../services/colorHighlightingService');

async function runColorHighlighting() {
  console.log(`\n=== Color Highlighting Script Started at ${new Date().toISOString()} ===`);
  
  try {
    // Run complete color highlighting maintenance
    console.log('\n1. Running color highlighting maintenance...');
    const maintenanceResult = await colorHighlightingService.processColorHighlightingMaintenance();
    
    console.log('✓ Color highlighting maintenance completed');
    console.log(`  Duration: ${maintenanceResult.duration}`);
    
    // Display remaining days update results
    if (maintenanceResult.remainingDaysUpdate.success) {
      console.log('\n2. Remaining days update results:');
      console.log(`  - Cars updated: ${maintenanceResult.remainingDaysUpdate.updatedCars}`);
      console.log(`  - Parts updated: ${maintenanceResult.remainingDaysUpdate.updatedParts}`);
      console.log(`  - Total updated: ${maintenanceResult.remainingDaysUpdate.total}`);
    } else {
      console.error('✗ Failed to update remaining days');
    }
    
    // Display expired disabling results
    if (maintenanceResult.expiredDisabling.success) {
      console.log('\n3. Expired color highlighting cleanup:');
      console.log(`  - Cars disabled: ${maintenanceResult.expiredDisabling.disabledCars}`);
      console.log(`  - Parts disabled: ${maintenanceResult.expiredDisabling.disabledParts}`);
      console.log(`  - Total disabled: ${maintenanceResult.expiredDisabling.total}`);
    } else {
      console.error('✗ Failed to disable expired color highlighting');
    }
    
    // Display current statistics
    console.log('\n4. Current color highlighting statistics:');
    if (maintenanceResult.currentStats && maintenanceResult.currentStats.length > 0) {
      maintenanceResult.currentStats.forEach(stat => {
        console.log(`  ${stat.type.toUpperCase()}:`);
        console.log(`    - Total with color highlighting: ${stat.total_with_color_highlighting}`);
        console.log(`    - Active color highlighting: ${stat.active_color_highlighting}`);
        console.log(`    - Expired color highlighting: ${stat.expired_color_highlighting}`);
      });
    } else {
      console.log('  No color highlighting statistics available');
    }
    
    console.log(`\n=== Color Highlighting Script Completed at ${new Date().toISOString()} ===\n`);
    
    // Exit with success code
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ Color highlighting script failed with error:', error);
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

// Run the color highlighting script
runColorHighlighting();