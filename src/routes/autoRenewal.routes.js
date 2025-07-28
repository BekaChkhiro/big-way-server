const express = require('express');
const router = express.Router();
const autoRenewalService = require('../services/autoRenewalService');
const { authenticateToken, requireAdmin } = require('../middlewares/auth.middleware');

/**
 * @route GET /api/auto-renewal/stats
 * @desc Get auto-renewal statistics
 * @access Admin only
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await autoRenewalService.getAutoRenewalStats();
    
    if (stats.success) {
      return res.status(200).json({
        success: true,
        data: stats.stats
      });
    } else {
      return res.status(500).json({
        success: false,
        error: stats.error
      });
    }
  } catch (error) {
    console.error('Error getting auto-renewal stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get auto-renewal statistics'
    });
  }
});

/**
 * @route POST /api/auto-renewal/process
 * @desc Manually trigger auto-renewal processing
 * @access Admin only
 */
router.post('/process', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log(`Admin ${req.user.id} manually triggered auto-renewal processing`);
    
    const result = await autoRenewalService.processAllAutoRenewals();
    
    return res.status(200).json({
      success: true,
      message: 'Auto-renewal processing completed',
      data: result
    });
  } catch (error) {
    console.error('Error in manual auto-renewal processing:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process auto-renewals'
    });
  }
});

/**
 * @route POST /api/auto-renewal/disable-expired
 * @desc Manually disable expired auto-renewals
 * @access Admin only
 */
router.post('/disable-expired', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log(`Admin ${req.user.id} manually triggered expired auto-renewal cleanup`);
    
    const result = await autoRenewalService.disableExpiredAutoRenewals();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Disabled ${result.total} expired auto-renewals`,
        data: {
          disabledCars: result.disabledCars,
          disabledParts: result.disabledParts,
          total: result.total
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error disabling expired auto-renewals:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to disable expired auto-renewals'
    });
  }
});

/**
 * @route GET /api/auto-renewal/test
 * @desc Test auto-renewal functionality (development only)
 * @access Admin only
 */
router.get('/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Test endpoint not available in production'
      });
    }
    
    console.log(`Admin ${req.user.id} testing auto-renewal functionality`);
    
    // Get current stats
    const statsBefore = await autoRenewalService.getAutoRenewalStats();
    
    // Process auto-renewals
    const processResult = await autoRenewalService.processAllAutoRenewals();
    
    // Get stats after processing
    const statsAfter = await autoRenewalService.getAutoRenewalStats();
    
    return res.status(200).json({
      success: true,
      message: 'Auto-renewal test completed',
      data: {
        statsBefore: statsBefore.stats,
        processResult: processResult,
        statsAfter: statsAfter.stats
      }
    });
  } catch (error) {
    console.error('Error in auto-renewal test:', error);
    return res.status(500).json({
      success: false,
      error: 'Auto-renewal test failed'
    });
  }
});

module.exports = router;