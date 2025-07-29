const VipPricing = require('../models/VipPricing');
const { validationResult } = require('express-validator');

/**
 * Get all VIP pricing information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllVipPricing = async (req, res) => {
  try {
    const { role, grouped, category = 'cars' } = req.query;
    
    // If grouped by role is requested
    if (grouped === 'true') {
      const groupedPricing = await VipPricing.findAllGroupedByRole(category);
      return res.status(200).json({
        success: true,
        data: groupedPricing
      });
    }
    
    // Get all pricing records, optionally filtered by role
    const vipPricing = await VipPricing.findAll(role, category);

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
      
      try {
        console.log('Upserting price:', {
          service_type: serviceType,
          price: price.price,
          duration_days: price.duration_days || 1,
          is_daily_price: price.is_daily_price !== undefined ? price.is_daily_price : true,
          user_role: price.user_role || 'user'
        });
        
        await VipPricing.upsert({
          service_type: serviceType,
          price: price.price,
          duration_days: price.duration_days || 1,
          is_daily_price: price.is_daily_price !== undefined ? price.is_daily_price : true,
          user_role: price.user_role || 'user',
          category: price.category || 'cars'
        });
      } catch (upsertError) {
        console.error('Error upserting individual price:', upsertError);
        throw upsertError;
      }
    }

    // Get the updated pricing for the appropriate category
    const category = prices[0]?.category || 'cars';
    const updatedPricing = await VipPricing.findAllGroupedByRole(category);

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
    const { role, category = 'cars' } = req.query;
    const vipPackages = await VipPricing.findVipPackages(role, category);

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
    const { role, category = 'cars' } = req.query;
    const additionalServices = await VipPricing.findAdditionalServices(role, category);

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

/**
 * Get VIP pricing for the current user based on their role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserVipPricing = async (req, res) => {
  try {
    // Debug: log the entire user object
    console.log('getUserVipPricing - Full req.user object:', JSON.stringify(req.user, null, 2));
    
    // Get user role from the authenticated user and category from query
    const userRole = req.user?.role || 'user';
    const { category = 'cars' } = req.query;
    console.log(`Getting VIP pricing for user role: ${userRole}, category: ${category}`);
    console.log('Available roles in system:', ['user', 'dealer', 'autosalon']);
    
    // Validate that the role is one of the expected values
    const validRoles = ['user', 'dealer', 'autosalon'];
    const finalRole = validRoles.includes(userRole) ? userRole : 'user';
    
    if (finalRole !== userRole) {
      console.warn(`Invalid user role '${userRole}' detected, defaulting to 'user'`);
    }
    
    // Get all pricing for this user's role and category
    let vipPricing = await VipPricing.findAll(finalRole, category);
    
    // If no pricing found for this role, ensure it gets created
    if (vipPricing.length === 0) {
      console.log(`No pricing data found for role ${finalRole}, creating default entries...`);
      
      const serviceTypes = [
        { service_type: 'free', price: 0, duration_days: 30, is_daily_price: false },
        { service_type: 'vip', price: 2, duration_days: 1, is_daily_price: true },
        { service_type: 'vip_plus', price: 5, duration_days: 1, is_daily_price: true },
        { service_type: 'super_vip', price: 7, duration_days: 1, is_daily_price: true },
        { service_type: 'color_highlighting', price: 0.5, duration_days: 1, is_daily_price: true },
        { service_type: 'auto_renewal', price: 0.5, duration_days: 1, is_daily_price: true }
      ];
      
      for (const service of serviceTypes) {
        try {
          await VipPricing.upsert({
            ...service,
            user_role: finalRole,
            category: category
          });
        } catch (error) {
          console.error(`Error creating default pricing for ${finalRole}/${service.service_type}:`, error);
        }
      }
      
      // Fetch again after creating defaults
      vipPricing = await VipPricing.findAll(finalRole, category);
    }
    
    // Separate into packages and services
    const packages = vipPricing.filter(p => 
      ['free', 'vip', 'vip_plus', 'super_vip'].includes(p.service_type)
    );
    
    const services = vipPricing.filter(p => 
      ['color_highlighting', 'auto_renewal'].includes(p.service_type)
    );

    console.log(`Found ${packages.length} packages and ${services.length} services for role ${finalRole}`);

    return res.status(200).json({
      success: true,
      data: {
        role: finalRole,
        packages,
        services,
        all: vipPricing
      }
    });
  } catch (error) {
    console.error('Error fetching user VIP pricing:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user VIP pricing',
      error: error.message
    });
  }
};
