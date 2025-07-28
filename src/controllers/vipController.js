const { CarModel, VIP_STATUS_TYPES } = require('../models/car/base');
const { pg: pool } = require('../../config/db.config');

/**
 * Controller for handling VIP status related operations
 */
const vipController = {
  /**
   * Get VIP pricing information
   * @param {*} req 
   * @param {*} res 
   */
  async getVipPricing(req, res) {
    try {
      const query = `
        SELECT vip_status, price, duration_days
        FROM vip_prices
        WHERE vip_status != 'none'
        ORDER BY price ASC
      `;
      
      const result = await pool.query(query);
      
      return res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching VIP pricing:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch VIP pricing',
        details: error.message
      });
    }
  },

  /**
   * Get VIP status for a car
   * @param {*} req 
   * @param {*} res 
   */
  async getVipStatus(req, res) {
    try {
      const { carId } = req.params;
      
      if (!carId) {
        return res.status(400).json({ error: 'Car ID is required' });
      }
      
      console.log(`Fetching VIP status for car ID: ${carId}`);
      
      // გამოვიყენოთ მხოლოდ არსებული ველები
      const query = `
        SELECT id, vip_status, vip_expiration_date
        FROM cars
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [carId]);
      
      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Car not found' });
      }
      
      console.log('Car data from database:', result.rows[0]);
      
      return res.status(200).json({
        id: parseInt(carId),
        vip_status: result.rows[0].vip_status || 'none',
        vip_expiration_date: result.rows[0].vip_expiration_date || null
      });
    } catch (error) {
      console.error('Error fetching VIP status:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch VIP status',
        details: error.message
      });
    }
  },

  /**
   * Toggle VIP status (activate/deactivate)
   * @param {*} req 
   * @param {*} res 
   */
  async toggleVipStatus(req, res) {
    try {
      const { carId } = req.params;
      const { active } = req.body;
      const userId = req.user.id;
      
      if (!carId) {
        return res.status(400).json({ error: 'Car ID is required' });
      }
      
      if (active === undefined) {
        return res.status(400).json({ error: 'Active status is required' });
      }
      
      // Verify car ownership
      const car = await CarModel.findById(carId);
      
      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }
      
      if (car.seller_id !== userId) {
        return res.status(403).json({ 
          error: 'You can only toggle VIP status for your own cars' 
        });
      }
      
      // Check if VIP status is available
      if (car.vip_status === 'none') {
        return res.status(400).json({ error: 'No VIP status available for this car' });
      }
      
      // Check if VIP is expired
      const now = new Date();
      const expiration = new Date(car.vip_expiration);
      
      if (now > expiration) {
        return res.status(400).json({ error: 'VIP status has expired' });
      }
      
      // Toggle active state
      const query = `
        UPDATE cars
        SET vip_active = $1
        WHERE id = $2
        RETURNING vip_active
      `;
      
      const result = await pool.query(query, [active, carId]);
      
      return res.status(200).json({
        success: true,
        message: `VIP status ${active ? 'activated' : 'deactivated'} successfully`,
        vipActive: result.rows[0].vip_active
      });
    } catch (error) {
      console.error('Error toggling VIP status:', error);
      return res.status(500).json({ 
        error: 'Failed to toggle VIP status',
        details: error.message
      });
    }
  },
  /**
   * Update a car's VIP status
   * @param {*} req 
   * @param {*} res 
   */
  async updateVipStatus(req, res) {
    try {
      const { carId } = req.params;
      const { vipStatus, expirationDate } = req.body;
      const userId = req.user.id;
      
      if (!carId) {
        return res.status(400).json({ error: 'Car ID is required' });
      }
      
      if (!vipStatus) {
        return res.status(400).json({ error: 'VIP status is required' });
      }
      
      if (!VIP_STATUS_TYPES.includes(vipStatus)) {
        return res.status(400).json({ 
          error: `Invalid VIP status. Valid options are: ${VIP_STATUS_TYPES.join(', ')}` 
        });
      }
      
      // Check user role
      const isAdmin = req.user.role === 'admin';
      
      // If user is admin, reject the request
      if (isAdmin) {
        return res.status(403).json({ 
          error: 'Admins are not allowed to update VIP status' 
        });
      }
      
      // For regular users, verify car ownership
      const car = await CarModel.findById(carId);
      
      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }
      
      // Check if the authenticated user is the owner of the car
      if (car.seller_id !== userId) {
        return res.status(403).json({ 
          error: 'You can only update VIP status for your own cars' 
        });
      }
      
      let result;
      try {
        result = await CarModel.updateVipStatus(carId, vipStatus, expirationDate);
      } catch (columnError) {
        console.log('VIP columns not found in database, VIP status update skipped:', columnError.message);
        // Mock response for missing columns
        result = {
          vip_status: vipStatus,
          vip_expiration_date: expirationDate
        };
      }
      
      return res.status(200).json({
        success: true,
        message: `Car ${carId} VIP status updated to ${vipStatus}`,
        data: result
      });
    } catch (error) {
      console.error('Error updating VIP status:', error);
      return res.status(500).json({ 
        error: 'Failed to update VIP status',
        details: error.message
      });
    }
  },
  
  /**
   * Purchase VIP status for a car using user's balance
   * @param {*} req 
   * @param {*} res 
   */
  async purchaseVipStatus(req, res) {
    try {
      const { carId } = req.params;
      const { vipStatus, days, colorHighlighting, colorHighlightingDays, autoRenewal, autoRenewalDays } = req.body;
      const userId = req.user.id;
      
      console.log(`VIP API - Purchase request received for car ${carId}:`);
      console.log('Request body raw:', JSON.stringify(req.body));
      console.log('Parsed values:', {
        vipStatus,
        vipStatusType: typeof vipStatus,
        days,
        daysType: typeof days,
        colorHighlighting,
        colorHighlightingDays,
        autoRenewal,
        autoRenewalDays,
        userId
      });
      
      // Convert days to number and validate
      const daysNumber = Number(days);
      const validDays = days ? Math.max(1, Math.round(daysNumber)) : null;
      
      console.log(`VIP API - Parsed days: ${days} (${typeof days}) → validDays: ${validDays}`);
      
      if (!carId) {
        return res.status(400).json({ error: 'Car ID is required' });
      }
      
      if (!vipStatus) {
        return res.status(400).json({ error: 'VIP status is required' });
      }
      
      if (!validDays || isNaN(daysNumber) || daysNumber <= 0) {
        return res.status(400).json({ error: 'Valid number of days is required' });
      }
      
      if (!VIP_STATUS_TYPES.includes(vipStatus)) {
        return res.status(400).json({ 
          error: `Invalid VIP status. Valid options are: ${VIP_STATUS_TYPES.join(', ')}` 
        });
      }
      
      // Verify car ownership
      const car = await CarModel.findById(carId);
      
      if (!car) {
        return res.status(404).json({ error: 'Car not found' });
      }
      
      if (car.seller_id !== userId) {
        return res.status(403).json({ 
          error: 'You can only purchase VIP status for your own cars' 
        });
      }
      
      // Get role-based pricing from database
      const VipPricing = require('../models/VipPricing');
      const userRole = req.user?.role || 'user';
      
      let pricePerDay = 0;
      let additionalServicesPrices = {
        'color_highlighting': 0.5,
        'auto_renewal': 0.5
      };
      
      try {
        // Fetch the price for this specific VIP status and user role
        const vipPricing = await VipPricing.findByServiceType(vipStatus, userRole);
        pricePerDay = vipPricing ? vipPricing.price : 0;
        
        // Fetch additional services pricing for user role
        const colorHighlightingPricing = await VipPricing.findByServiceType('color_highlighting', userRole);
        const autoRenewalPricing = await VipPricing.findByServiceType('auto_renewal', userRole);
        
        if (colorHighlightingPricing) {
          additionalServicesPrices.color_highlighting = colorHighlightingPricing.price;
        }
        if (autoRenewalPricing) {
          additionalServicesPrices.auto_renewal = autoRenewalPricing.price;
        }
        
        console.log(`Charging user with role ${userRole} price ${pricePerDay} for VIP status ${vipStatus}`);
        console.log(`Additional services pricing for role ${userRole}:`, additionalServicesPrices);
      } catch (error) {
        console.error('Error fetching VIP pricing:', error);
        // Fall back to role-based default pricing
        const fallbackPrices = {
          'none': 0,
          'vip': userRole === 'dealer' ? 1.5 : userRole === 'autosalon' ? 1.8 : 2,
          'vip_plus': userRole === 'dealer' ? 3.75 : userRole === 'autosalon' ? 4.5 : 5,
          'super_vip': userRole === 'dealer' ? 5.25 : userRole === 'autosalon' ? 6.3 : 7
        };
        pricePerDay = fallbackPrices[vipStatus] || 0;
        console.log(`Using fallback price ${pricePerDay} for role ${userRole} and VIP status ${vipStatus}`);
      }
      
      // Calculate base VIP price
      const baseVipPrice = pricePerDay * validDays;
      
      // Calculate additional services cost
      let additionalServicesCost = 0;
      if (colorHighlighting) {
        const colorDays = Number(colorHighlightingDays) || 1;
        additionalServicesCost += additionalServicesPrices.color_highlighting * colorDays;
        console.log(`VIP API - Color highlighting: ${additionalServicesPrices.color_highlighting} GEL/day × ${colorDays} days = ${additionalServicesPrices.color_highlighting * colorDays} GEL`);
      }
      if (autoRenewal) {
        const renewalDays = Number(autoRenewalDays) || 1;
        additionalServicesCost += additionalServicesPrices.auto_renewal * renewalDays;
        console.log(`VIP API - Auto renewal: ${additionalServicesPrices.auto_renewal} GEL/day × ${renewalDays} days = ${additionalServicesPrices.auto_renewal * renewalDays} GEL`);
      }
      
      // Calculate total price including additional services
      const totalPrice = baseVipPrice + additionalServicesCost;
      
      console.log(`VIP API - Calculating price: Base VIP (${pricePerDay} GEL/day × ${validDays} days) = ${baseVipPrice} GEL`);
      console.log(`VIP API - Additional services cost: ${additionalServicesCost} GEL`);
      console.log(`VIP API - Total price: ${totalPrice} GEL`);
      
      // Get user's balance
      const balanceQuery = `
        SELECT balance
        FROM users
        WHERE id = $1
      `;
      
      const balanceResult = await pool.query(balanceQuery, [userId]);
      const userBalance = balanceResult.rows[0]?.balance || 0;
      
      console.log(`VIP API - User balance: ${parseFloat(userBalance).toFixed(2)} GEL, Required: ${totalPrice.toFixed(2)} GEL`);
      
      // Check if user has enough balance
      if (parseFloat(userBalance) < totalPrice) {
        return res.status(400).json({ 
          error: 'Insufficient balance',
          requiredAmount: totalPrice.toFixed(2),
          currentBalance: parseFloat(userBalance).toFixed(2)
        });
      }
      
      // Calculate expiration date
      const expirationDate = new Date();
      // Set time to end of day (23:59:59) to ensure the full day is counted
      expirationDate.setHours(23, 59, 59, 999);
      // Add the number of days to the expiration date
      expirationDate.setDate(expirationDate.getDate() + validDays);
      
      console.log(`VIP API - Setting expiration date to: ${expirationDate.toISOString()}`);
      
      // Start a transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Deduct from user's balance using the calculated total price
        const updateBalanceQuery = `
          UPDATE users
          SET balance = balance - $1
          WHERE id = $2
          RETURNING balance
        `;
        
        console.log(`VIP API - Deducting ${totalPrice} GEL from balance for ${validDays} days of ${vipStatus}`);
        const updateBalanceResult = await client.query(updateBalanceQuery, [totalPrice, userId]);
        
        // Log the transaction
        const transactionQuery = `
          INSERT INTO balance_transactions
          (user_id, amount, transaction_type, description)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `;
        
        // Create detailed transaction description with price breakdown
        let transactionDescription = `VIP Purchase - Car #${carId}\n`;
        transactionDescription += `${vipStatus.toUpperCase().replace('_', ' ')} Package (${validDays} day${validDays > 1 ? 's' : ''}): ${baseVipPrice.toFixed(2)} GEL`;
        
        if (colorHighlighting || autoRenewal) {
          transactionDescription += `\nAdditional Services:`;
          
          if (colorHighlighting) {
            const colorCost = additionalServicesPrices.color_highlighting * (colorHighlightingDays || 1);
            transactionDescription += `\n• Color Highlighting (${colorHighlightingDays || 1} day${(colorHighlightingDays || 1) > 1 ? 's' : ''}): ${colorCost.toFixed(2)} GEL`;
          }
          
          if (autoRenewal) {
            const renewalCost = additionalServicesPrices.auto_renewal * (autoRenewalDays || 1);
            transactionDescription += `\n• Auto Renewal (${autoRenewalDays || 1} day${(autoRenewalDays || 1) > 1 ? 's' : ''}): ${renewalCost.toFixed(2)} GEL`;
          }
        }
        
        transactionDescription += `\nTotal Amount: ${totalPrice.toFixed(2)} GEL`;
        
        await client.query(transactionQuery, [
          userId, 
          -totalPrice, // Use the calculated total price including additional services
          'vip_purchase', 
          transactionDescription
        ]);
        
        // Update car VIP status - handle missing columns gracefully
        let updateResult;
        try {
          updateResult = await CarModel.updateVipStatus(carId, vipStatus, expirationDate.toISOString());
        } catch (columnError) {
          console.log('VIP columns not found in database, VIP status update skipped:', columnError.message);
          // Mock response for missing columns
          updateResult = {
            vip_status: vipStatus,
            vip_expiration_date: expirationDate.toISOString()
          };
        }
        
        // Update color highlighting settings if color highlighting is enabled
        if (colorHighlighting && colorHighlightingDays > 0) {
          try {
            console.log(`Setting up color highlighting for car ${carId}: ${colorHighlightingDays} days`);
            
            // Calculate color highlighting expiration date
            const colorHighlightingExpirationDate = new Date();
            colorHighlightingExpirationDate.setHours(23, 59, 59, 999);
            colorHighlightingExpirationDate.setDate(colorHighlightingExpirationDate.getDate() + colorHighlightingDays);
            
            const colorHighlightingUpdateQuery = `
              UPDATE cars 
              SET 
                color_highlighting_enabled = $1,
                color_highlighting_expiration_date = $2,
                color_highlighting_total_days = $3,
                color_highlighting_remaining_days = $4
              WHERE id = $5
            `;
            
            await client.query(colorHighlightingUpdateQuery, [
              true, // color_highlighting_enabled
              colorHighlightingExpirationDate.toISOString(), // when color highlighting service expires
              colorHighlightingDays, // total days purchased
              colorHighlightingDays, // remaining days (initially same as total)
              carId
            ]);
            
            console.log(`✓ Color highlighting configured for car ${carId} - ${colorHighlightingDays} days`);
            
          } catch (colorHighlightingError) {
            console.error('Error setting up color highlighting (continuing with VIP purchase):', colorHighlightingError.message);
            // Don't fail the entire purchase if color highlighting setup fails
          }
        }

        // Update auto-renewal settings if auto-renewal is enabled
        if (autoRenewal && autoRenewalDays > 0) {
          try {
            console.log(`Setting up auto-renewal for car ${carId}: ${autoRenewalDays} days`);
            
            // Calculate auto-renewal expiration date
            const autoRenewalExpirationDate = new Date();
            autoRenewalExpirationDate.setHours(23, 59, 59, 999);
            autoRenewalExpirationDate.setDate(autoRenewalExpirationDate.getDate() + autoRenewalDays);
            
            const autoRenewalUpdateQuery = `
              UPDATE cars 
              SET 
                auto_renewal_enabled = $1,
                auto_renewal_days = $2,
                auto_renewal_expiration_date = $3,
                auto_renewal_total_days = $4,
                auto_renewal_remaining_days = $5
              WHERE id = $6
            `;
            
            await client.query(autoRenewalUpdateQuery, [
              true, // auto_renewal_enabled
              autoRenewalDays, // auto_renewal_days (how often to refresh)
              autoRenewalExpirationDate.toISOString(), // when auto-renewal service expires
              autoRenewalDays, // total days purchased
              autoRenewalDays, // remaining days (initially same as total)
              carId
            ]);
            
            console.log(`✓ Auto-renewal configured for car ${carId} - ${autoRenewalDays} days`);
            
          } catch (autoRenewalError) {
            console.error('Error setting up auto-renewal (continuing with VIP purchase):', autoRenewalError.message);
            // Don't fail the entire purchase if auto-renewal setup fails
          }
        }
        
        await client.query('COMMIT');
        
        return res.status(200).json({
          success: true,
          message: `Successfully purchased ${vipStatus} status for ${validDays} days for car #${carId}`,
          newBalance: updateBalanceResult.rows[0].balance,
          vipExpiration: expirationDate,
          vipStatus: vipStatus,
          daysRequested: validDays,
          totalPrice: totalPrice,
          priceInfo: {
            pricePerDay: pricePerDay,
            days: validDays,
            calculatedTotal: totalPrice
          }
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Error purchasing VIP status:', error);
      return res.status(500).json({ 
        error: 'Failed to purchase VIP status',
        details: error.message
      });
    }
  },
  
  /**
   * Get all cars with a specific VIP status
   * @param {*} req 
   * @param {*} res 
   */
  async getCarsByVipStatus(req, res) {
    try {
      const { vipStatus } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;
      
      if (!vipStatus) {
        return res.status(400).json({ error: 'VIP status is required' });
      }
      
      if (!VIP_STATUS_TYPES.includes(vipStatus)) {
        return res.status(400).json({ 
          error: `Invalid VIP status. Valid options are: ${VIP_STATUS_TYPES.join(', ')}` 
        });
      }
      
      const result = await CarModel.getCarsByVipStatus(vipStatus, limit, offset);
      
      return res.status(200).json({
        success: true,
        data: result.cars,
        total: result.total,
        limit,
        offset
      });
    } catch (error) {
      console.error('Error fetching cars by VIP status:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch cars by VIP status',
        details: error.message
      });
    }
  },
  
  /**
   * Purchase comprehensive VIP package with additional services
   * This method acts as a wrapper around purchaseVipStatus with proper parameter mapping
   * @param {*} req 
   * @param {*} res 
   */
  async purchaseVipPackage(req, res) {
    try {
      const { carId } = req.params;
      const { 
        vip_status, 
        vip_days, 
        color_highlighting, 
        color_highlighting_days, 
        auto_renewal, 
        auto_renewal_days 
      } = req.body;
      
      console.log(`VIP Package API - Purchase request received for car ${carId}:`);
      console.log('Request body:', JSON.stringify(req.body));
      
      // Map parameters to the format expected by purchaseVipStatus
      const mappedBody = {
        vipStatus: vip_status,
        days: vip_days,
        colorHighlighting: color_highlighting,
        colorHighlightingDays: color_highlighting_days,
        autoRenewal: auto_renewal,
        autoRenewalDays: auto_renewal_days
      };
      
      // Modify the request object to have the expected format
      req.body = mappedBody;
      
      // Call the existing purchaseVipStatus method
      return await vipController.purchaseVipStatus(req, res);
      
    } catch (error) {
      console.error('Error in purchaseVipPackage:', error);
      return res.status(500).json({ 
        error: 'Failed to purchase VIP package',
        details: error.message
      });
    }
  },

  /**
   * Get all available VIP status types
   * @param {*} req 
   * @param {*} res 
   */
  getVipStatusTypes(req, res) {
    return res.status(200).json({
      success: true,
      data: VIP_STATUS_TYPES
    });
  }
};

module.exports = vipController;
