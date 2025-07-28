const cron = require('node-cron');
const colorHighlightingService = require('../services/colorHighlightingService');

/**
 * Color highlighting scheduled tasks
 * Runs maintenance tasks for color highlighting services
 */

// Schedule color highlighting maintenance to run every day at 2:00 AM
const colorHighlightingScheduler = cron.schedule('0 2 * * *', async () => {
  console.log('=== Color Highlighting Daily Maintenance Starting ===');
  
  try {
    const result = await colorHighlightingService.processColorHighlightingMaintenance();
    console.log('Color highlighting maintenance completed successfully:', result);
  } catch (error) {
    console.error('Error in color highlighting maintenance:', error);
  }
  
  console.log('=== Color Highlighting Daily Maintenance Complete ===');
}, {
  scheduled: false, // Don't start automatically
  timezone: "Asia/Tbilisi" // Georgian timezone
});

/**
 * Start the color highlighting scheduler
 */
function startColorHighlightingScheduler() {
  console.log('Starting color highlighting scheduler...');
  colorHighlightingScheduler.start();
  console.log('Color highlighting scheduler started - runs daily at 2:00 AM (Tbilisi time)');
}

/**
 * Stop the color highlighting scheduler
 */
function stopColorHighlightingScheduler() {
  console.log('Stopping color highlighting scheduler...');
  colorHighlightingScheduler.stop();
  console.log('Color highlighting scheduler stopped');
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
  return {
    isRunning: colorHighlightingScheduler.getStatus() === 'scheduled',
    nextExecution: colorHighlightingScheduler.nextDates(1)[0],
    timezone: 'Asia/Tbilisi',
    schedule: '0 2 * * *' // Daily at 2:00 AM
  };
}

/**
 * Run color highlighting maintenance manually (for testing)
 */
async function runManualMaintenance() {
  console.log('Running manual color highlighting maintenance...');
  
  try {
    const result = await colorHighlightingService.processColorHighlightingMaintenance();
    console.log('Manual color highlighting maintenance completed:', result);
    return result;
  } catch (error) {
    console.error('Error in manual color highlighting maintenance:', error);
    throw error;
  }
}

module.exports = {
  startColorHighlightingScheduler,
  stopColorHighlightingScheduler,
  getSchedulerStatus,
  runManualMaintenance
};