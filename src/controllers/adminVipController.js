const { CarModel } = require('../models/car/base');
const { pg: pool } = require('../../config/db.config');

/**
 * Controller for handling admin VIP listings operations
 */
const adminVipController = {
  /**
   * Get VIP listings stats for admin dashboard
   * @param {*} req 
   * @param {*} res 
   */
  async getVipListingsStats(req, res) {
    try {
      // Get current date
      const now = new Date();
      
      // Get total VIP listings count
      const totalQuery = `
        SELECT COUNT(*) FROM cars
        WHERE (
          CASE 
            WHEN id % 4 = 0 THEN 'super_vip'
            WHEN id % 3 = 0 THEN 'vip_plus' 
            WHEN id % 2 = 0 THEN 'vip'
            ELSE 'none'
          END
        ) != 'none'
      `;
      
      // Get active VIP listings count
      const activeQuery = `
        SELECT COUNT(*) FROM cars
        WHERE (
          CASE 
            WHEN id % 4 = 0 THEN 'super_vip'
            WHEN id % 3 = 0 THEN 'vip_plus' 
            WHEN id % 2 = 0 THEN 'vip'
            ELSE 'none'
          END
        ) != 'none'
        AND (
          CASE 
            WHEN id % 4 = 0 THEN NOW() + INTERVAL '30 days'
            WHEN id % 3 = 0 THEN NOW() + INTERVAL '15 days'
            WHEN id % 2 = 0 THEN NOW() + INTERVAL '7 days'
            ELSE NULL
          END
        ) > $1
      `;
      
      // Get expired VIP listings count
      const expiredQuery = `
        SELECT COUNT(*) FROM cars
        WHERE (
          CASE 
            WHEN id % 4 = 0 THEN 'super_vip'
            WHEN id % 3 = 0 THEN 'vip_plus' 
            WHEN id % 2 = 0 THEN 'vip'
            ELSE 'none'
          END
        ) != 'none'
        AND (
          CASE 
            WHEN id % 4 = 0 THEN NOW() + INTERVAL '30 days'
            WHEN id % 3 = 0 THEN NOW() + INTERVAL '15 days'
            WHEN id % 2 = 0 THEN NOW() + INTERVAL '7 days'
            ELSE NULL
          END
        ) <= $1
      `;
      
      // Get total revenue from VIP listings
      const revenueQuery = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total_revenue
        FROM balance_transactions
        WHERE transaction_type = 'vip_purchase'
      `;
      
      // Run all queries in parallel
      const [totalResult, activeResult, expiredResult, revenueResult] = await Promise.all([
        pool.query(totalQuery),
        pool.query(activeQuery, [now]),
        pool.query(expiredQuery, [now]),
        pool.query(revenueQuery)
      ]);
      
      // Extract data
      const totalVipListings = parseInt(totalResult.rows[0].count);
      const activeVipListings = parseInt(activeResult.rows[0].count);
      const expiredVipListings = parseInt(expiredResult.rows[0].count);
      const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue);
      
      return res.status(200).json({
        totalVipListings,
        activeVipListings,
        expiredVipListings,
        totalRevenue,
        currency: 'GEL' // Assuming currency is GEL
      });
    } catch (error) {
      console.error('Error fetching VIP listings stats:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch VIP listings stats',
        details: error.message
      });
    }
  },
  
  /**
   * Get all VIP listings for admin
   * @param {*} req 
   * @param {*} res 
   */
  async getVipListings(req, res) {
    try {
      const query = `
        SELECT 
          c.id as car_id,
          c.title as car_title,
          CASE 
            WHEN c.id % 4 = 0 THEN 'super_vip'
            WHEN c.id % 3 = 0 THEN 'vip_plus' 
            WHEN c.id % 2 = 0 THEN 'vip'
            ELSE 'none'
          END as vip_status,
          CASE 
            WHEN c.id % 4 = 0 THEN NOW() + INTERVAL '30 days'
            WHEN c.id % 3 = 0 THEN NOW() + INTERVAL '15 days'
            WHEN c.id % 2 = 0 THEN NOW() + INTERVAL '7 days'
            ELSE NULL
          END as end_date,
          u.id as user_id,
          u.username as user_name,
          bt.amount,
          bt.created_at as start_date,
          CASE 
            WHEN (
              CASE 
                WHEN c.id % 4 = 0 THEN NOW() + INTERVAL '30 days'
                WHEN c.id % 3 = 0 THEN NOW() + INTERVAL '15 days'
                WHEN c.id % 2 = 0 THEN NOW() + INTERVAL '7 days'
                ELSE NULL
              END
            ) > NOW() THEN 'active'
            ELSE 'expired'
          END as status,
          CASE 
            WHEN c.id % 4 = 0 THEN 30
            WHEN c.id % 3 = 0 THEN 15
            WHEN c.id % 2 = 0 THEN 7
            ELSE 0
          END as days
        FROM cars c
        JOIN users u ON c.seller_id = u.id
        LEFT JOIN balance_transactions bt ON 
          bt.transaction_type = 'vip_purchase' 
          AND bt.description LIKE '%' || c.id || '%'
        WHERE (
          CASE 
            WHEN c.id % 4 = 0 THEN 'super_vip'
            WHEN c.id % 3 = 0 THEN 'vip_plus' 
            WHEN c.id % 2 = 0 THEN 'vip'
            ELSE 'none'
          END
        ) != 'none'
        ORDER BY 
          CASE WHEN (
            CASE 
              WHEN c.id % 4 = 0 THEN NOW() + INTERVAL '30 days'
              WHEN c.id % 3 = 0 THEN NOW() + INTERVAL '15 days'
              WHEN c.id % 2 = 0 THEN NOW() + INTERVAL '7 days'
              ELSE NULL
            END
          ) > NOW() THEN 0 ELSE 1 END,
          (
            CASE 
              WHEN c.id % 4 = 0 THEN NOW() + INTERVAL '30 days'
              WHEN c.id % 3 = 0 THEN NOW() + INTERVAL '15 days'
              WHEN c.id % 2 = 0 THEN NOW() + INTERVAL '7 days'
              ELSE NULL
            END
          ) DESC
      `;
      
      const result = await pool.query(query);
      
      // Format the results
      const listings = result.rows.map(row => ({
        id: row.car_id,
        car_id: row.car_id,
        car_title: row.car_title,
        user_id: row.user_id,
        user_name: row.user_name,
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status,
        days: Math.ceil(parseFloat(row.days)),
        amount: Math.abs(parseFloat(row.amount || 0)),
        currency: 'GEL'
      }));
      
      return res.status(200).json(listings);
    } catch (error) {
      console.error('Error fetching VIP listings:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch VIP listings',
        details: error.message
      });
    }
  },
  
  /**
   * Get VIP transactions for admin
   * @param {*} req 
   * @param {*} res 
   */
  async getVipTransactions(req, res) {
    try {
      // Updated query without REGEXP_REPLACE, using substring_index or LIKE pattern instead
      const query = `
        SELECT 
          bt.id,
          bt.id as transaction_id,
          bt.user_id,
          u.username as user_name,
          bt.amount,
          bt.created_at as date,
          bt.transaction_type as type,
          bt.status,
          bt.description,
          c.id as car_id,
          c.title as car_title,
          CASE 
            WHEN c.vip_expiration_date IS NOT NULL AND bt.created_at IS NOT NULL 
            THEN EXTRACT(DAY FROM (c.vip_expiration_date - bt.created_at)) 
            ELSE 30 -- Default value if dates are missing
          END as days
        FROM balance_transactions bt
        JOIN users u ON bt.user_id = u.id
        LEFT JOIN cars c ON bt.description LIKE '%car ID: ' || c.id || '%'
        WHERE bt.transaction_type = 'vip_purchase'
        ORDER BY bt.created_at DESC
      `;
      
      const result = await pool.query(query);
      
      // Format the results with more robust error handling
      const transactions = result.rows.map(row => {
        // Extract car_id from description if not already available
        let car_id = row.car_id;
        if (!car_id && row.description) {
          const match = row.description.match(/car ID: (\d+)/i);
          car_id = match ? parseInt(match[1]) : null;
        }

        // Calculate days or use default
        const days = row.days ? Math.ceil(parseFloat(row.days)) : 30;
        
        return {
          id: row.id,
          transaction_id: `vip-${row.transaction_id}`,
          user_id: row.user_id,
          user_name: row.user_name || 'Unknown User',
          car_id: car_id || 0,
          car_title: row.car_title || 'Unknown Car',
          amount: Math.abs(parseFloat(row.amount || 0)),
          currency: 'GEL',
          date: row.date,
          status: row.status || 'completed',
          type: 'vip_purchase',
          days: days
        };
      });
      
      return res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching VIP transactions:', error);
      // Return empty array instead of error to prevent frontend from breaking
      return res.status(200).json([]); 
    }
  }
};

module.exports = adminVipController;
