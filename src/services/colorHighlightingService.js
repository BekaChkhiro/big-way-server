const { pg: pool } = require('../../config/db.config');

/**
 * Color highlighting service for cars and parts
 * Handles expiration of color highlighting services and cleanup
 */
class ColorHighlightingService {
  /**
   * Get color highlighting statistics
   */
  async getColorHighlightingStats() {
    try {
      const statsQuery = `
        SELECT 
          'cars' as type,
          COUNT(*) as total_with_color_highlighting,
          COUNT(*) FILTER (WHERE color_highlighting_enabled = TRUE AND color_highlighting_expiration_date > NOW()) as active_color_highlighting,
          COUNT(*) FILTER (WHERE color_highlighting_enabled = TRUE AND color_highlighting_expiration_date <= NOW()) as expired_color_highlighting
        FROM cars
        WHERE color_highlighting_enabled = TRUE
        
        UNION ALL
        
        SELECT 
          'parts' as type,
          COUNT(*) as total_with_color_highlighting,
          COUNT(*) FILTER (WHERE color_highlighting_enabled = TRUE AND color_highlighting_expiration_date > NOW()) as active_color_highlighting,
          COUNT(*) FILTER (WHERE color_highlighting_enabled = TRUE AND color_highlighting_expiration_date <= NOW()) as expired_color_highlighting
        FROM parts
        WHERE color_highlighting_enabled = TRUE
      `;
      
      const result = await pool.query(statsQuery);
      
      return {
        success: true,
        stats: result.rows
      };
      
    } catch (error) {
      console.error('Error getting color highlighting stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Disable expired color highlighting services
   */
  async disableExpiredColorHighlighting() {
    try {
      console.log('Disabling expired color highlighting services...');
      
      // Disable expired car color highlighting
      const carUpdateQuery = `
        UPDATE cars 
        SET 
          color_highlighting_enabled = FALSE,
          color_highlighting_remaining_days = 0
        WHERE color_highlighting_enabled = TRUE 
          AND color_highlighting_expiration_date <= NOW()
        RETURNING id, title
      `;
      
      const carResult = await pool.query(carUpdateQuery);
      
      // Disable expired part color highlighting
      const partUpdateQuery = `
        UPDATE parts 
        SET 
          color_highlighting_enabled = FALSE,
          color_highlighting_remaining_days = 0
        WHERE color_highlighting_enabled = TRUE 
          AND color_highlighting_expiration_date <= NOW()
        RETURNING id, title
      `;
      
      const partResult = await pool.query(partUpdateQuery);
      
      // Log the expired services for tracking
      if (carResult.rowCount > 0 || partResult.rowCount > 0) {
        try {
          // Record expiration transactions for cars
          for (const car of carResult.rows) {
            const transactionQuery = `
              INSERT INTO balance_transactions (
                user_id, 
                amount, 
                transaction_type, 
                description, 
                status, 
                reference_id
              )
              SELECT 
                seller_id,
                0,
                'color_highlighting_expired',
                $1,
                'completed',
                $2
              FROM cars 
              WHERE id = $2
            `;
            
            await pool.query(transactionQuery, [
              `Color highlighting expired for car "${car.title}" (ID: ${car.id})`,
              car.id
            ]);
          }
          
          // Record expiration transactions for parts
          for (const part of partResult.rows) {
            const transactionQuery = `
              INSERT INTO balance_transactions (
                user_id, 
                amount, 
                transaction_type, 
                description, 
                status, 
                reference_id
              )
              SELECT 
                seller_id,
                0,
                'color_highlighting_expired',
                $1,
                'completed',
                $2
              FROM parts 
              WHERE id = $2
            `;
            
            await pool.query(transactionQuery, [
              `Color highlighting expired for part "${part.title}" (ID: ${part.id})`,
              part.id
            ]);
          }
        } catch (transactionError) {
          console.warn('Warning: Failed to log some expiration transactions:', transactionError.message);
        }
      }
      
      console.log(`Disabled ${carResult.rowCount} expired car color highlighting services`);
      console.log(`Disabled ${partResult.rowCount} expired part color highlighting services`);
      
      return {
        success: true,
        disabledCars: carResult.rowCount,
        disabledParts: partResult.rowCount,
        total: carResult.rowCount + partResult.rowCount,
        expiredCars: carResult.rows,
        expiredParts: partResult.rows
      };
      
    } catch (error) {
      console.error('Error disabling expired color highlighting:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update remaining days for all active color highlighting services
   */
  async updateRemainingDays() {
    try {
      console.log('Updating remaining days for color highlighting services...');
      
      // Update cars
      const carUpdateQuery = `
        UPDATE cars 
        SET color_highlighting_remaining_days = calculate_color_highlighting_remaining_days(color_highlighting_expiration_date)
        WHERE color_highlighting_enabled = TRUE 
          AND color_highlighting_expiration_date IS NOT NULL
      `;
      
      const carResult = await pool.query(carUpdateQuery);
      
      // Update parts
      const partUpdateQuery = `
        UPDATE parts 
        SET color_highlighting_remaining_days = calculate_color_highlighting_remaining_days(color_highlighting_expiration_date)
        WHERE color_highlighting_enabled = TRUE 
          AND color_highlighting_expiration_date IS NOT NULL
      `;
      
      const partResult = await pool.query(partUpdateQuery);
      
      console.log(`Updated remaining days for ${carResult.rowCount} cars and ${partResult.rowCount} parts`);
      
      return {
        success: true,
        updatedCars: carResult.rowCount,
        updatedParts: partResult.rowCount,
        total: carResult.rowCount + partResult.rowCount
      };
      
    } catch (error) {
      console.error('Error updating remaining days:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get active color highlighting listings
   */
  async getActiveColorHighlightedListings(limit = 50) {
    try {
      const query = `
        SELECT 
          'car' as type,
          id,
          title,
          color_highlighting_expiration_date,
          color_highlighting_remaining_days,
          created_at
        FROM cars 
        WHERE color_highlighting_enabled = TRUE 
          AND color_highlighting_expiration_date > NOW()
        
        UNION ALL
        
        SELECT 
          'part' as type,
          id,
          title,
          color_highlighting_expiration_date,
          color_highlighting_remaining_days,
          created_at
        FROM parts 
        WHERE color_highlighting_enabled = TRUE 
          AND color_highlighting_expiration_date > NOW()
        
        ORDER BY color_highlighting_expiration_date ASC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      
      return {
        success: true,
        listings: result.rows,
        count: result.rows.length
      };
      
    } catch (error) {
      console.error('Error getting active color highlighted listings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Set color highlighting for a specific listing
   */
  async setColorHighlighting(type, id, days, userId) {
    try {
      const tableName = type === 'car' ? 'cars' : 'parts';
      
      // Calculate expiration date
      const expirationDate = new Date();
      expirationDate.setHours(23, 59, 59, 999);
      expirationDate.setDate(expirationDate.getDate() + days);
      
      const updateQuery = `
        UPDATE ${tableName}
        SET 
          color_highlighting_enabled = TRUE,
          color_highlighting_expiration_date = $1,
          color_highlighting_total_days = $2,
          color_highlighting_remaining_days = $3
        WHERE id = $4 AND seller_id = $5
        RETURNING id, title, color_highlighting_expiration_date
      `;
      
      const result = await pool.query(updateQuery, [
        expirationDate.toISOString(),
        days,
        days,
        id,
        userId
      ]);
      
      if (result.rowCount === 0) {
        return {
          success: false,
          error: `${type.charAt(0).toUpperCase() + type.slice(1)} not found or not owned by user`
        };
      }
      
      // Record transaction
      const transactionQuery = `
        INSERT INTO balance_transactions (
          user_id, 
          amount, 
          transaction_type, 
          description, 
          status, 
          reference_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      await pool.query(transactionQuery, [
        userId,
        0, // No additional charge if already paid
        `color_highlighting_${type}`,
        `Color highlighting activated for ${type} "${result.rows[0].title}" (ID: ${id}). Duration: ${days} days`,
        'completed',
        id
      ]);
      
      return {
        success: true,
        listing: result.rows[0]
      };
      
    } catch (error) {
      console.error('Error setting color highlighting:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Process all color highlighting maintenance tasks
   */
  async processColorHighlightingMaintenance() {
    console.log('=== Starting Color Highlighting Maintenance ===');
    const startTime = new Date();
    
    // Update remaining days
    const updateResult = await this.updateRemainingDays();
    
    // Disable expired services
    const disableResult = await this.disableExpiredColorHighlighting();
    
    // Get current statistics
    const statsResult = await this.getColorHighlightingStats();
    
    const endTime = new Date();
    const duration = endTime - startTime;
    
    const summary = {
      timestamp: startTime.toISOString(),
      duration: `${duration}ms`,
      remainingDaysUpdate: {
        success: updateResult.success,
        updatedCars: updateResult.updatedCars || 0,
        updatedParts: updateResult.updatedParts || 0,
        total: updateResult.total || 0
      },
      expiredDisabling: {
        success: disableResult.success,
        disabledCars: disableResult.disabledCars || 0,
        disabledParts: disableResult.disabledParts || 0,
        total: disableResult.total || 0
      },
      currentStats: statsResult.success ? statsResult.stats : []
    };
    
    console.log('=== Color Highlighting Maintenance Complete ===');
    console.log('Summary:', JSON.stringify(summary, null, 2));
    
    return summary;
  }
}

module.exports = new ColorHighlightingService();