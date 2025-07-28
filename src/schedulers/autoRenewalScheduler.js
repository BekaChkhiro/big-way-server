const cron = require('node-cron');
const autoRenewalService = require('../services/autoRenewalService');

class AutoRenewalScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Start the auto-renewal scheduler
   * Runs every day at 2:00 AM to avoid peak traffic
   */
  start() {
    if (this.isRunning) {
      console.log('[AUTO-RENEWAL SCHEDULER] Already running');
      return;
    }

    // Schedule to run every day at 2:00 AM
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      console.log('[AUTO-RENEWAL SCHEDULER] Starting daily auto-renewal process...');
      
      try {
        // First, disable expired auto-renewals
        const expiredResult = await autoRenewalService.disableExpiredAutoRenewals();
        console.log('[AUTO-RENEWAL SCHEDULER] Disabled expired renewals:', expiredResult);

        // Then, process active auto-renewals
        const renewalResult = await autoRenewalService.processAllAutoRenewals();
        console.log('[AUTO-RENEWAL SCHEDULER] Renewal process completed:', renewalResult);

        // Log summary
        const totalProcessed = renewalResult.totalRenewed || 0;
        const totalExpired = expiredResult.total || 0;
        
        console.log(`[AUTO-RENEWAL SCHEDULER] Daily summary: ${totalProcessed} renewed, ${totalExpired} expired`);

      } catch (error) {
        console.error('[AUTO-RENEWAL SCHEDULER] Error during daily process:', error);
      }
    }, {
      scheduled: false, // Don't start immediately
      timezone: "Europe/Tbilisi" // Adjust to your timezone
    });

    // Start the cron job
    this.cronJob.start();
    this.isRunning = true;

    console.log('[AUTO-RENEWAL SCHEDULER] Started - will run daily at 2:00 AM');
    
    // Also run a startup check
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
    console.log('[AUTO-RENEWAL SCHEDULER] Stopped');
  }

  /**
   * Manual trigger for testing
   */
  async triggerNow() {
    console.log('[AUTO-RENEWAL SCHEDULER] Manual trigger activated');
    
    try {
      const expiredResult = await autoRenewalService.disableExpiredAutoRenewals();
      const renewalResult = await autoRenewalService.processAllAutoRenewals();
      
      return {
        success: true,
        expired: expiredResult,
        renewals: renewalResult,
        message: 'Auto-renewal process completed successfully'
      };
    } catch (error) {
      console.error('[AUTO-RENEWAL SCHEDULER] Manual trigger failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run a startup check to see current auto-renewal status
   */
  async runStartupCheck() {
    try {
      console.log('[AUTO-RENEWAL SCHEDULER] Running startup check...');
      
      const stats = await autoRenewalService.getAutoRenewalStats();
      
      if (stats.success) {
        console.log('[AUTO-RENEWAL SCHEDULER] Current auto-renewal stats:');
        stats.stats.forEach(stat => {
          console.log(`  ${stat.type}: ${stat.active_auto_renewals} active, ${stat.expired_auto_renewals} expired`);
        });
      }
      
      // Check if any renewals need immediate processing
      // This handles cases where the server was down during scheduled time
      const lastRunCheck = await this.checkLastRunTime();
      if (lastRunCheck.shouldRun) {
        console.log('[AUTO-RENEWAL SCHEDULER] Missed scheduled run detected, processing now...');
        await this.triggerNow();
      }
      
    } catch (error) {
      console.error('[AUTO-RENEWAL SCHEDULER] Startup check failed:', error);
    }
  }

  /**
   * Check if we missed a scheduled run (server was down)
   */
  async checkLastRunTime() {
    try {
      // This is a simple check - in production you might want to store last run time in database
      const now = new Date();
      const currentHour = now.getHours();
      
      // If it's after 2 AM and before 4 AM, and we haven't run today, we should run
      if (currentHour >= 2 && currentHour < 4) {
        return { shouldRun: true, reason: 'Within scheduled window' };
      }
      
      return { shouldRun: false, reason: 'Outside scheduled window' };
      
    } catch (error) {
      console.error('[AUTO-RENEWAL SCHEDULER] Error checking last run time:', error);
      return { shouldRun: false, reason: 'Error checking' };
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.cronJob ? this.cronJob.nextDates(1).toString() : null,
      timezone: 'Europe/Tbilisi',
      schedule: '0 2 * * * (Daily at 2:00 AM)'
    };
  }

  /**
   * Get auto-renewal statistics
   */
  async getStats() {
    return await autoRenewalService.getAutoRenewalStats();
  }
}

module.exports = new AutoRenewalScheduler();