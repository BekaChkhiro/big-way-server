const cron = require('node-cron');
const autoRenewalService = require('../services/autoRenewalService');

class AutoRenewalScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Start the auto-renewal scheduler
   * Runs every day at midnight (00:00)
   */
  start() {
    if (this.isRunning) {
      console.log('[AUTO-RENEWAL SCHEDULER] Already running');
      return;
    }

    // Schedule to run every day at midnight (00:00)
    this.cronJob = cron.schedule('0 0 * * *', async () => {
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
      scheduled: false // Don't start immediately
      // Removed timezone to use system default
    });

    // Start the cron job
    this.cronJob.start();
    this.isRunning = true;

    // Log current system time
    const now = new Date();
    console.log('[AUTO-RENEWAL SCHEDULER] Current system time:', now.toLocaleString());
    console.log('[AUTO-RENEWAL SCHEDULER] Current system timezone offset:', now.getTimezoneOffset(), 'minutes from UTC');
    console.log('[AUTO-RENEWAL SCHEDULER] Started - will run daily at midnight (00:00)');
    
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
      
      // Log next scheduled run time
      if (this.cronJob) {
        const nextRun = this.cronJob.nextDates(1);
        console.log('[AUTO-RENEWAL SCHEDULER] Next scheduled run:', nextRun.toString());
      }
      
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
      
      // If it's after midnight and before 2 AM, and we haven't run today, we should run
      if (currentHour >= 0 && currentHour < 2) {
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
      timezone: 'System Default',
      schedule: '0 0 * * * (Daily at midnight 00:00)'
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