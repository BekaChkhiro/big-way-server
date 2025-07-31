const cron = require('node-cron');
const vipExpirationService = require('../services/vipExpirationService');
const colorHighlightingService = require('../services/colorHighlightingService');

class VipExpirationScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Start the VIP expiration scheduler
   * Runs every hour to check and expire VIP statuses
   */
  start() {
    if (this.isRunning) {
      console.log('[VIP EXPIRATION SCHEDULER] Already running');
      return;
    }

    // Schedule to run every hour
    this.cronJob = cron.schedule('0 * * * *', async () => {
      console.log('[VIP EXPIRATION SCHEDULER] Starting hourly VIP expiration check...');
      
      try {
        // Process expired VIP statuses for cars
        const carResult = await vipExpirationService.processExpiredCarVipStatuses();
        console.log('[VIP EXPIRATION SCHEDULER] Car VIP expiration result:', carResult);

        // Process expired VIP statuses for parts
        const partResult = await vipExpirationService.processExpiredPartVipStatuses();
        console.log('[VIP EXPIRATION SCHEDULER] Part VIP expiration result:', partResult);

        // Process expired color highlighting services
        const colorResult = await colorHighlightingService.disableExpiredColorHighlighting();
        console.log('[VIP EXPIRATION SCHEDULER] Color highlighting expiration result:', colorResult);

        // Log summary
        const totalExpiredCars = carResult.expired || 0;
        const totalExpiredParts = partResult.expired || 0;
        const totalExpiredColorCars = colorResult.disabledCars || 0;
        const totalExpiredColorParts = colorResult.disabledParts || 0;
        
        console.log(`[VIP EXPIRATION SCHEDULER] Hourly summary:`);
        console.log(`  - VIP expired: ${totalExpiredCars} cars, ${totalExpiredParts} parts`);
        console.log(`  - Color highlighting expired: ${totalExpiredColorCars} cars, ${totalExpiredColorParts} parts`);

      } catch (error) {
        console.error('[VIP EXPIRATION SCHEDULER] Error during hourly process:', error);
      }
    }, {
      scheduled: false // Don't start immediately
    });

    // Start the cron job
    this.cronJob.start();
    this.isRunning = true;

    // Log current system time
    const now = new Date();
    console.log('[VIP EXPIRATION SCHEDULER] Current system time:', now.toLocaleString());
    console.log('[VIP EXPIRATION SCHEDULER] Started - will run every hour at :00');
    
    // Run initial check on startup
    this.runStartupCheck();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('[VIP EXPIRATION SCHEDULER] Stopped');
  }

  /**
   * Manual trigger for testing
   */
  async triggerNow() {
    console.log('[VIP EXPIRATION SCHEDULER] Manual trigger activated');
    
    try {
      const carResult = await vipExpirationService.processExpiredCarVipStatuses();
      const partResult = await vipExpirationService.processExpiredPartVipStatuses();
      const colorResult = await colorHighlightingService.disableExpiredColorHighlighting();
      
      return {
        success: true,
        cars: carResult,
        parts: partResult,
        colorHighlighting: colorResult,
        message: 'VIP expiration and color highlighting process completed successfully'
      };
    } catch (error) {
      console.error('[VIP EXPIRATION SCHEDULER] Manual trigger failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run a startup check to process any expired VIPs
   */
  async runStartupCheck() {
    try {
      console.log('[VIP EXPIRATION SCHEDULER] Running startup check...');
      
      // Log next scheduled run time
      if (this.cronJob) {
        try {
          const nextRun = this.cronJob.nextDate ? this.cronJob.nextDate() : 'Unknown';
          console.log('[VIP EXPIRATION SCHEDULER] Next scheduled run:', nextRun.toString ? nextRun.toString() : nextRun);
        } catch (error) {
          console.log('[VIP EXPIRATION SCHEDULER] Could not determine next run time');
        }
      }
      
      // Get current VIP statistics
      const stats = await vipExpirationService.getVipStatistics();
      
      if (stats.success) {
        console.log('[VIP EXPIRATION SCHEDULER] Current VIP statistics:');
        console.log(`  Cars: ${stats.cars.active} active, ${stats.cars.expired} expired`);
        console.log(`  Parts: ${stats.parts.active} active, ${stats.parts.expired} expired`);
      }
      
      // Process any expired VIPs on startup
      console.log('[VIP EXPIRATION SCHEDULER] Processing any expired VIPs on startup...');
      await this.triggerNow();
      
    } catch (error) {
      console.error('[VIP EXPIRATION SCHEDULER] Startup check failed:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    let nextRun = null;
    if (this.cronJob) {
      try {
        nextRun = this.cronJob.nextDate ? this.cronJob.nextDate().toString() : 'Unknown';
      } catch (error) {
        nextRun = 'Could not determine';
      }
    }
    
    return {
      isRunning: this.isRunning,
      nextRun: nextRun,
      schedule: '0 * * * * (Every hour at :00)'
    };
  }

  /**
   * Get VIP statistics
   */
  async getStats() {
    return await vipExpirationService.getVipStatistics();
  }
}

module.exports = new VipExpirationScheduler();