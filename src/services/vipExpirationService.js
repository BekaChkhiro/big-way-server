const { pg: pool } = require('../../config/db.config');

/**
 * VIP Expiration Service
 * Handles automatic expiration of VIP statuses for cars and parts
 */
class VipExpirationService {
  /**
   * Process expired VIP statuses for cars
   */
  async processExpiredCarVipStatuses() {
    try {
      console.log('Processing expired car VIP statuses...');
      
      // Begin transaction
      await pool.query('BEGIN');
      
      // Get all cars with expired VIP status
      const selectQuery = `
        SELECT id, title, vip_status, vip_expiration_date, seller_id,
               auto_renewal_enabled, auto_renewal_days
        FROM cars
        WHERE vip_status != 'none'
          AND vip_expiration_date IS NOT NULL
          AND vip_expiration_date <= NOW()
        FOR UPDATE
      `;
      
      const expiredCars = await pool.query(selectQuery);
      console.log(`Found ${expiredCars.rows.length} cars with expired VIP status`);
      
      if (expiredCars.rows.length === 0) {
        await pool.query('COMMIT');
        return { success: true, expired: 0, message: 'No expired car VIPs found' };
      }
      
      // Separate cars for auto-renewal and expiration
      const carsToRenew = [];
      const carsToExpire = [];
      
      for (const car of expiredCars.rows) {
        if (car.auto_renewal_enabled) {
          // Check if user has sufficient balance for renewal
          const balanceQuery = `SELECT balance FROM users WHERE id = $1`;
          const balanceResult = await pool.query(balanceQuery, [car.seller_id]);
          
          if (balanceResult.rows.length > 0) {
            // Get VIP pricing
            const pricingQuery = `
              SELECT price FROM vip_pricing 
              WHERE service_type = $1 AND category = 'cars'
              LIMIT 1
            `;
            const pricingResult = await pool.query(pricingQuery, [car.vip_status]);
            
            if (pricingResult.rows.length > 0 && 
                balanceResult.rows[0].balance >= pricingResult.rows[0].price) {
              carsToRenew.push({ ...car, price: pricingResult.rows[0].price });
            } else {
              carsToExpire.push(car);
            }
          } else {
            carsToExpire.push(car);
          }
        } else {
          carsToExpire.push(car);
        }
      }
      
      // Process auto-renewals
      let renewedCount = 0;
      for (const car of carsToRenew) {
        const newExpirationDate = new Date();
        newExpirationDate.setDate(newExpirationDate.getDate() + car.auto_renewal_days);
        
        // Update VIP expiration date
        await pool.query(
          `UPDATE cars 
           SET vip_expiration_date = $1,
               auto_renewal_last_processed = NOW(),
               updated_at = NOW()
           WHERE id = $2`,
          [newExpirationDate, car.id]
        );
        
        // Deduct balance
        await pool.query(
          `UPDATE users SET balance = balance - $1 WHERE id = $2`,
          [car.price, car.seller_id]
        );
        
        // Log transaction
        await pool.query(
          `INSERT INTO balance_transactions 
           (user_id, amount, transaction_type, description, status, reference_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            car.seller_id,
            -car.price,
            'auto_renewal',
            `VIP auto-renewal for car "${car.title}" (ID: ${car.id}) - ${car.vip_status}`,
            'completed',
            car.id
          ]
        );
        
        renewedCount++;
      }
      
      // Process expirations
      let expiredCount = 0;
      if (carsToExpire.length > 0) {
        const carIdsToExpire = carsToExpire.map(car => car.id);
        const updateQuery = `
          UPDATE cars
          SET vip_status = 'none',
              vip_active = FALSE,
              vip_expiration_date = NULL,
              auto_renewal_enabled = FALSE,
              updated_at = NOW()
          WHERE id = ANY($1)
          RETURNING id, title
        `;
        
        const updateResult = await pool.query(updateQuery, [carIdsToExpire]);
        expiredCount = updateResult.rows.length;
        
        // Log transactions for each expired VIP
        for (const car of carsToExpire) {
          await pool.query(
            `INSERT INTO balance_transactions 
             (user_id, amount, transaction_type, description, status, reference_id, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              car.seller_id,
              0,
              'vip_expired',
              `VIP status expired for car "${car.title}" (ID: ${car.id})`,
              'completed',
              car.id
            ]
          );
        }
      }
      
      await pool.query('COMMIT');
      
      console.log(`VIP processing complete: ${renewedCount} renewed, ${expiredCount} expired`);
      
      return {
        success: true,
        expired: expiredCount,
        renewed: renewedCount,
        message: `Processed VIP statuses: ${renewedCount} renewed, ${expiredCount} expired`
      };
      
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error processing expired car VIP statuses:', error);
      throw error;
    }
  }

  /**
   * Process expired VIP statuses for parts
   */
  async processExpiredPartVipStatuses() {
    try {
      console.log('Processing expired part VIP statuses...');
      
      // Begin transaction
      await pool.query('BEGIN');
      
      // Get all parts with expired VIP status
      const selectQuery = `
        SELECT id, title, vip_status, vip_expiration_date, seller_id,
               auto_renewal_enabled, auto_renewal_days
        FROM parts
        WHERE vip_status != 'none'
          AND vip_expiration_date IS NOT NULL
          AND vip_expiration_date <= NOW()
        FOR UPDATE
      `;
      
      const expiredParts = await pool.query(selectQuery);
      console.log(`Found ${expiredParts.rows.length} parts with expired VIP status`);
      
      if (expiredParts.rows.length === 0) {
        await pool.query('COMMIT');
        return { success: true, expired: 0, message: 'No expired part VIPs found' };
      }
      
      // Separate parts for auto-renewal and expiration
      const partsToRenew = [];
      const partsToExpire = [];
      
      for (const part of expiredParts.rows) {
        if (part.auto_renewal_enabled) {
          // Check if user has sufficient balance for renewal
          const balanceQuery = `SELECT balance FROM users WHERE id = $1`;
          const balanceResult = await pool.query(balanceQuery, [part.seller_id]);
          
          if (balanceResult.rows.length > 0) {
            // Get VIP pricing
            const pricingQuery = `
              SELECT price FROM vip_pricing 
              WHERE service_type = $1 AND category = 'parts'
              LIMIT 1
            `;
            const pricingResult = await pool.query(pricingQuery, [part.vip_status]);
            
            if (pricingResult.rows.length > 0 && 
                balanceResult.rows[0].balance >= pricingResult.rows[0].price) {
              partsToRenew.push({ ...part, price: pricingResult.rows[0].price });
            } else {
              partsToExpire.push(part);
            }
          } else {
            partsToExpire.push(part);
          }
        } else {
          partsToExpire.push(part);
        }
      }
      
      // Process auto-renewals
      let renewedCount = 0;
      for (const part of partsToRenew) {
        const newExpirationDate = new Date();
        newExpirationDate.setDate(newExpirationDate.getDate() + part.auto_renewal_days);
        
        // Update VIP expiration date
        await pool.query(
          `UPDATE parts 
           SET vip_expiration_date = $1,
               auto_renewal_last_processed = NOW()
           WHERE id = $2`,
          [newExpirationDate, part.id]
        );
        
        // Deduct balance
        await pool.query(
          `UPDATE users SET balance = balance - $1 WHERE id = $2`,
          [part.price, part.seller_id]
        );
        
        // Log transaction
        await pool.query(
          `INSERT INTO balance_transactions 
           (user_id, amount, transaction_type, description, status, reference_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            part.seller_id,
            -part.price,
            'auto_renewal',
            `VIP auto-renewal for part "${part.title}" (ID: ${part.id}) - ${part.vip_status}`,
            'completed',
            part.id
          ]
        );
        
        renewedCount++;
      }
      
      // Process expirations
      let expiredCount = 0;
      if (partsToExpire.length > 0) {
        const partIdsToExpire = partsToExpire.map(part => part.id);
        const updateQuery = `
          UPDATE parts
          SET vip_status = 'none',
              vip_active = FALSE,
              vip_expiration_date = NULL,
              auto_renewal_enabled = FALSE
          WHERE id = ANY($1)
          RETURNING id, title
        `;
        
        const updateResult = await pool.query(updateQuery, [partIdsToExpire]);
        expiredCount = updateResult.rows.length;
        
        // Log transactions for each expired VIP
        for (const part of partsToExpire) {
          await pool.query(
            `INSERT INTO balance_transactions 
             (user_id, amount, transaction_type, description, status, reference_id, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              part.seller_id,
              0,
              'vip_expired',
              `VIP status expired for part "${part.title}" (ID: ${part.id})`,
              'completed',
              part.id
            ]
          );
        }
      }
      
      await pool.query('COMMIT');
      
      console.log(`VIP processing complete: ${renewedCount} renewed, ${expiredCount} expired`);
      
      return {
        success: true,
        expired: expiredCount,
        renewed: renewedCount,
        message: `Processed VIP statuses: ${renewedCount} renewed, ${expiredCount} expired`
      };
      
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error processing expired part VIP statuses:', error);
      throw error;
    }
  }

  /**
   * Get VIP statistics for cars and parts
   */
  async getVipStatistics() {
    try {
      // Get car VIP statistics
      const carStatsQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE vip_status != 'none' AND (vip_expiration_date IS NULL OR vip_expiration_date > NOW())) as active_vips,
          COUNT(*) FILTER (WHERE vip_status != 'none' AND vip_expiration_date IS NOT NULL AND vip_expiration_date <= NOW()) as expired_vips,
          COUNT(*) FILTER (WHERE vip_status = 'vip' AND (vip_expiration_date IS NULL OR vip_expiration_date > NOW())) as vip_count,
          COUNT(*) FILTER (WHERE vip_status = 'vip_plus' AND (vip_expiration_date IS NULL OR vip_expiration_date > NOW())) as vip_plus_count,
          COUNT(*) FILTER (WHERE vip_status = 'super_vip' AND (vip_expiration_date IS NULL OR vip_expiration_date > NOW())) as super_vip_count
        FROM cars
      `;
      
      const carStats = await pool.query(carStatsQuery);
      
      // Get part VIP statistics
      const partStatsQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE vip_status != 'none' AND (vip_expiration_date IS NULL OR vip_expiration_date > NOW())) as active_vips,
          COUNT(*) FILTER (WHERE vip_status != 'none' AND vip_expiration_date IS NOT NULL AND vip_expiration_date <= NOW()) as expired_vips,
          COUNT(*) FILTER (WHERE vip_status = 'vip' AND (vip_expiration_date IS NULL OR vip_expiration_date > NOW())) as vip_count,
          COUNT(*) FILTER (WHERE vip_status = 'vip_plus' AND (vip_expiration_date IS NULL OR vip_expiration_date > NOW())) as vip_plus_count,
          COUNT(*) FILTER (WHERE vip_status = 'super_vip' AND (vip_expiration_date IS NULL OR vip_expiration_date > NOW())) as super_vip_count
        FROM parts
      `;
      
      const partStats = await pool.query(partStatsQuery);
      
      return {
        success: true,
        cars: {
          active: parseInt(carStats.rows[0].active_vips),
          expired: parseInt(carStats.rows[0].expired_vips),
          byType: {
            vip: parseInt(carStats.rows[0].vip_count),
            vip_plus: parseInt(carStats.rows[0].vip_plus_count),
            super_vip: parseInt(carStats.rows[0].super_vip_count)
          }
        },
        parts: {
          active: parseInt(partStats.rows[0].active_vips),
          expired: parseInt(partStats.rows[0].expired_vips),
          byType: {
            vip: parseInt(partStats.rows[0].vip_count),
            vip_plus: parseInt(partStats.rows[0].vip_plus_count),
            super_vip: parseInt(partStats.rows[0].super_vip_count)
          }
        }
      };
      
    } catch (error) {
      console.error('Error getting VIP statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if VIP auto-renewal is enabled for a listing
   */
  async checkVipAutoRenewal(listingId, listingType = 'car') {
    try {
      const table = listingType === 'car' ? 'cars' : 'parts';
      
      const query = `
        SELECT 
          id,
          auto_renewal_enabled,
          auto_renewal_days,
          vip_status,
          vip_expiration_date,
          seller_id
        FROM ${table}
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [listingId]);
      
      if (result.rows.length === 0) {
        return { exists: false };
      }
      
      const listing = result.rows[0];
      
      return {
        exists: true,
        autoRenewalEnabled: listing.auto_renewal_enabled || false,
        autoRenewalDays: listing.auto_renewal_days || 0,
        currentVipStatus: listing.vip_status,
        expirationDate: listing.vip_expiration_date,
        sellerId: listing.seller_id
      };
      
    } catch (error) {
      console.error('Error checking VIP auto-renewal:', error);
      throw error;
    }
  }
}

module.exports = new VipExpirationService();