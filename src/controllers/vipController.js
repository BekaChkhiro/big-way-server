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
      
      const result = await CarModel.updateVipStatus(carId, vipStatus, expirationDate);
      
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
      const { vipStatus, days } = req.body;
      const userId = req.user.id;
      
      console.log(`VIP API - Purchase request received for car ${carId}:`, {
        vipStatus,
        days,
        userId
      });
      
      // Convert days to number and validate
      const daysNumber = Number(days);
      const validDays = days ? Math.max(1, Math.round(daysNumber)) : null;
      
      console.log(`VIP API - Parsed days: ${days} (${typeof days}) → validDays: ${validDays}`);
      
      if (!carId) {
        return res.status(400).json({ error: 'Car ID is required' });
      }
      
      if (!vipStatus || vipStatus === 'none') {
        return res.status(400).json({ error: 'Valid VIP status is required' });
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
      
      // Use fixed prices matching the balance controller
      const fixedPrices = {
        'vip': 2.5,
        'vip_plus': 5.0,
        'super_vip': 8.0
      };
      
      // Get price per day based on VIP status
      const pricePerDay = fixedPrices[vipStatus] || 2.5;
      
      // Calculate total price based on number of days
      const totalPrice = pricePerDay * validDays;
      
      console.log(`VIP API - Calculating price: ${pricePerDay} GEL/day × ${validDays} days = ${totalPrice} GEL`);
      
      // Get user's balance
      const balanceQuery = `
        SELECT balance
        FROM users
        WHERE id = $1
      `;
      
      const balanceResult = await pool.query(balanceQuery, [userId]);
      const userBalance = balanceResult.rows[0]?.balance || 0;
      
      console.log(`VIP API - User balance: ${userBalance} GEL, Required: ${totalPrice} GEL`);
      
      // Check if user has enough balance
      if (userBalance < totalPrice) {
        return res.status(400).json({ 
          error: 'Insufficient balance',
          requiredAmount: totalPrice,
          currentBalance: userBalance
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
        
        await client.query(transactionQuery, [
          userId, 
          -totalPrice, // Use the calculated total price
          'vip_purchase', 
          `Purchase of ${vipStatus} status for ${validDays} days for car #${carId}`
        ]);
        
        // Update car VIP status
        const updateResult = await CarModel.updateVipStatus(carId, vipStatus, expirationDate.toISOString());
        
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
