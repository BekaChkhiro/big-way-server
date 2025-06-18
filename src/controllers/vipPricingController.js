const VipPricing = require('../models/VipPricing');
const { validationResult } = require('express-validator');

/**
 * Get all VIP pricing information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllVipPricing = async (req, res) => {
  try {
    // Ensure the table exists
    await VipPricing.createTableIfNotExists();
    
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
      if (!price.vip_status || !['vip', 'vip_plus', 'super_vip'].includes(price.vip_status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid VIP status: ${price.vip_status}`
        });
      }

      if (isNaN(price.price) || price.price <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for ${price.vip_status}: ${price.price}`
        });
      }

      if (isNaN(price.duration_days) || price.duration_days <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid duration for ${price.vip_status}: ${price.duration_days}`
        });
      }
    }

    // Update each price in the database
    for (const price of prices) {
      await VipPricing.upsert({
        vip_status: price.vip_status,
        price: price.price,
        duration_days: price.duration_days
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
