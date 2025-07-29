const express = require('express');
const router = express.Router();
const autoRenewalService = require('../services/autoRenewalService');
const { authenticateToken, requireAdmin } = require('../middlewares/auth.middleware');
const { pg: pool } = require('../../config/db.config');

/**
 * @route POST /api/auto-renewal/enable-test-car
 * @desc Enable auto-renewal for the first car (for testing)
 * @access Admin only
 */
router.post('/enable-test-car', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get the first car
    const getCarQuery = `SELECT id, title FROM cars ORDER BY id ASC LIMIT 1`;
    const carResult = await pool.query(getCarQuery);
    
    if (carResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No cars found in database'
      });
    }
    
    const car = carResult.rows[0];
    
    // Enable auto-renewal for this car (30 days)
    const enableQuery = `
      UPDATE cars 
      SET 
        auto_renewal_enabled = TRUE,
        auto_renewal_days = 1,
        auto_renewal_expiration_date = NOW() + INTERVAL '30 days',
        auto_renewal_total_days = 30,
        auto_renewal_remaining_days = 30,
        auto_renewal_last_processed = NULL
      WHERE id = $1
      RETURNING id, title, auto_renewal_enabled, auto_renewal_expiration_date
    `;
    
    const updateResult = await pool.query(enableQuery, [car.id]);
    
    return res.status(200).json({
      success: true,
      message: `Auto-renewal enabled for car #${car.id}`,
      car: updateResult.rows[0],
      currentTime: new Date().toLocaleString()
    });
    
  } catch (error) {
    console.error('Error enabling auto-renewal for test car:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to enable auto-renewal for test car',
      details: error.message
    });
  }
});

/**
 * @route GET /api/auto-renewal/debug/:carId
 * @desc Debug specific car's auto-renewal status and manually update created_at
 * @access Admin only
 */
router.get('/debug/:carId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    
    if (!carId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid car ID'
      });
    }
    
    // Get current car data
    const beforeQuery = `
      SELECT 
        id, title, created_at, auto_renewal_enabled, 
        auto_renewal_expiration_date, auto_renewal_last_processed
      FROM cars 
      WHERE id = $1
    `;
    const beforeResult = await pool.query(beforeQuery, [carId]);
    
    if (beforeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }
    
    const carBefore = beforeResult.rows[0];
    
    // Manually update created_at
    const updateQuery = `
      UPDATE cars 
      SET created_at = NOW(), auto_renewal_last_processed = NOW()
      WHERE id = $1
      RETURNING created_at, auto_renewal_last_processed
    `;
    const updateResult = await pool.query(updateQuery, [carId]);
    const carAfter = updateResult.rows[0];
    
    return res.status(200).json({
      success: true,
      carId: carId,
      before: {
        created_at: carBefore.created_at,
        auto_renewal_last_processed: carBefore.auto_renewal_last_processed
      },
      after: {
        created_at: carAfter.created_at,
        auto_renewal_last_processed: carAfter.auto_renewal_last_processed
      },
      updated: true,
      currentTime: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Debug failed',
      details: error.message
    });
  }
});

/**
 * @route GET /api/auto-renewal/eligible
 * @desc Get cars eligible for auto-renewal
 * @access Admin only
 */
router.get('/eligible', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        title,
        seller_id,
        created_at,
        auto_renewal_enabled,
        auto_renewal_days,
        auto_renewal_expiration_date,
        auto_renewal_last_processed,
        auto_renewal_remaining_days,
        CASE 
          WHEN auto_renewal_last_processed IS NULL THEN 'Never processed'
          WHEN auto_renewal_last_processed + INTERVAL '1 day' * auto_renewal_days <= NOW() THEN 'Ready for renewal'
          ELSE 'Not yet due'
        END as renewal_status
      FROM cars 
      WHERE auto_renewal_enabled = TRUE 
        AND auto_renewal_expiration_date > NOW()
      ORDER BY auto_renewal_last_processed ASC NULLS FIRST
    `;
    
    const result = await pool.query(query);
    
    return res.status(200).json({
      success: true,
      currentTime: new Date().toLocaleString(),
      eligibleCars: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error getting eligible cars:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get eligible cars'
    });
  }
});

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
 * @route POST /api/auto-renewal/manual-trigger
 * @desc Manually trigger auto-renewal for testing
 * @access Admin only
 */
router.post('/manual-trigger', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log(`Admin ${req.user.id} manually triggered auto-renewal at ${new Date().toLocaleString()}`);
    
    // Get current system time
    const now = new Date();
    const timeInfo = {
      currentTime: now.toLocaleString(),
      currentHour: now.getHours(),
      currentMinutes: now.getMinutes(),
      timezoneOffset: now.getTimezoneOffset()
    };
    
    // Process auto-renewals immediately
    const expiredResult = await autoRenewalService.disableExpiredAutoRenewals();
    const renewalResult = await autoRenewalService.processAllAutoRenewals();
    
    return res.status(200).json({
      success: true,
      message: 'Auto-renewal manually triggered',
      timeInfo,
      results: {
        expired: expiredResult,
        renewed: renewalResult
      }
    });
  } catch (error) {
    console.error('Error in manual auto-renewal trigger:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to trigger auto-renewal',
      details: error.message
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