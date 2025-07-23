const VipPricing = require('../models/VipPricing');
const { validationResult } = require('express-validator');

/**
 * Get all VIP pricing information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllVipPricing = async (req, res) => {
  try {
    // Get all pricing records
    const vipPricing = await VipPricing.findAll();

    return res.status(200).json({
      success: true,
      data: vipPricing
    });
  } catch (error) {
    console.error('Error fetching VIP pricing:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch VIP pricing',
      error: error.message
    });
  }
};

/**
 * Update VIP pricing information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateVipPricing = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { prices } = req.body;

    if (!Array.isArray(prices) || prices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prices data. Expected an array of price objects.'
      });
    }

    // Validate each price object
    for (const price of prices) {
      // Handle both old format (vip_status) and new format (service_type)
      const serviceType = price.service_type || price.vip_status;
      
      if (!serviceType || !['free', 'vip', 'vip_plus', 'super_vip', 'color_highlighting', 'auto_renewal'].includes(serviceType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid service type: ${serviceType}`
        });
      }

      if (isNaN(price.price) || price.price < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for ${serviceType}: ${price.price}`
        });
      }

      if (price.duration_days && (isNaN(price.duration_days) || price.duration_days <= 0)) {
        return res.status(400).json({
          success: false,
          message: `Invalid duration for ${serviceType}: ${price.duration_days}`
        });
      }
    }

    // Update each price in the database
    for (const price of prices) {
      const serviceType = price.service_type || price.vip_status;
      
      await VipPricing.upsert({
        service_type: serviceType,
        price: price.price,
        duration_days: price.duration_days || 1,
        is_daily_price: price.is_daily_price !== undefined ? price.is_daily_price : true
      });
    }

    // Get the updated pricing
    const updatedPricing = await VipPricing.findAll();

    return res.status(200).json({
      success: true,
      message: 'VIP pricing updated successfully',
      data: updatedPricing
    });
  } catch (error) {
    console.error('Error updating VIP pricing:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update VIP pricing',
      error: error.message
    });
  }
};

/**
 * Get VIP packages only (excluding additional services)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getVipPackages = async (req, res) => {
  try {
    const vipPackages = await VipPricing.findVipPackages();

    return res.status(200).json({
      success: true,
      data: vipPackages
    });
  } catch (error) {
    console.error('Error fetching VIP packages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch VIP packages',
      error: error.message
    });
  }
};

/**
 * Get additional services only
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAdditionalServices = async (req, res) => {
  try {
    const additionalServices = await VipPricing.findAdditionalServices();

    return res.status(200).json({
      success: true,
      data: additionalServices
    });
  } catch (error) {
    console.error('Error fetching additional services:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch additional services',
      error: error.message
    });
  }
};
