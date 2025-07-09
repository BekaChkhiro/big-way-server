const express = require('express');
const analyticsService = require('../services/analytics-ga4.service');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Get complete analytics data
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const analyticsData = await analyticsService.getCompleteAnalyticsData(
      startDate || '30daysAgo',
      endDate || 'today'
    );

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Error fetching analytics dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics data',
      data: analyticsService.getDefaultCompleteData()
    });
  }
});

// Get basic analytics metrics
router.get('/metrics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const metrics = await analyticsService.getAnalyticsData(
      startDate || '7daysAgo',
      endDate || 'today'
    );

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching analytics metrics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics metrics',
      data: analyticsService.getDefaultAnalyticsData()
    });
  }
});

// Get top pages
router.get('/top-pages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const topPages = await analyticsService.getTopPages(
      startDate || '7daysAgo',
      endDate || 'today'
    );

    res.json({
      success: true,
      data: topPages
    });
  } catch (error) {
    console.error('Error fetching top pages:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch top pages',
      data: analyticsService.getDefaultTopPages()
    });
  }
});

// Get device types
router.get('/device-types', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const deviceTypes = await analyticsService.getDeviceTypes(
      startDate || '7daysAgo',
      endDate || 'today'
    );

    res.json({
      success: true,
      data: deviceTypes
    });
  } catch (error) {
    console.error('Error fetching device types:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch device types',
      data: analyticsService.getDefaultDeviceTypes()
    });
  }
});

// Get referral sources
router.get('/referral-sources', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const referralSources = await analyticsService.getReferralSources(
      startDate || '7daysAgo',
      endDate || 'today'
    );

    res.json({
      success: true,
      data: referralSources
    });
  } catch (error) {
    console.error('Error fetching referral sources:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch referral sources',
      data: analyticsService.getDefaultReferralSources()
    });
  }
});

module.exports = router;