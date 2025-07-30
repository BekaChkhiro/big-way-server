const { pg: pool } = require('../../config/db.config');

/**
 * Auto-renewal service for cars and parts
 * Handles automatic refreshing of created_at dates for listings with active auto-renewal
 */
class AutoRenewalService {
  /**
   * Process auto-renewal for all eligible cars
   * Updates created_at date and tracks renewal usage
   */
  async processCarAutoRenewals() {
    try {
      console.log('Starting car auto-renewal processing...');
      
      // Debug: First check all cars with auto-renewal enabled
      const debugQuery = `
        SELECT 
          id, 
          title,
          auto_renewal_enabled,
          auto_renewal_expiration_date,
          auto_renewal_last_processed,
          auto_renewal_days,
          NOW() as current_time,
          CASE 
            WHEN auto_renewal_expiration_date IS NULL THEN 'No expiration date'
            WHEN auto_renewal_expiration_date <= NOW() THEN 'EXPIRED - auto-renewal disabled'
            WHEN auto_renewal_last_processed IS NULL THEN 'Never processed - ELIGIBLE'
            WHEN auto_renewal_last_processed::date < CURRENT_DATE THEN 'Not processed today - ELIGIBLE'
            ELSE 'Already processed today'
          END as eligibility_status
        FROM cars 
        WHERE auto_renewal_enabled = TRUE
        ORDER BY id
      `;
      
      const debugResult = await pool.query(debugQuery);
      console.log('=== AUTO-RENEWAL DEBUG INFO ===');
      console.log(`Total cars with auto_renewal_enabled = TRUE: ${debugResult.rows.length}`);
      
      if (debugResult.rows.length > 0) {
        console.log('Auto-renewal enabled cars:');
        debugResult.rows.forEach(car => {
          console.log(`- Car #${car.id}: ${car.title}`);
          console.log(`  Expiration: ${car.auto_renewal_expiration_date}`);
          console.log(`  Last processed: ${car.auto_renewal_last_processed || 'Never'}`);
          console.log(`  Renewal days: ${car.auto_renewal_days}`);
          console.log(`  Status: ${car.eligibility_status}`);
          console.log('');
        });
      }
      
      // Get all cars eligible for auto-renewal
      // Update created_at daily (every 24 hours) for active auto-renewals
      const query = `
        SELECT 
          id, 
          title,
          seller_id,
          created_at,
          auto_renewal_days,
          auto_renewal_expiration_date,
          auto_renewal_last_processed,
          auto_renewal_remaining_days
        FROM cars 
        WHERE auto_renewal_enabled = TRUE 
          AND (auto_renewal_expiration_date IS NULL OR auto_renewal_expiration_date > NOW())
          AND (
            auto_renewal_last_processed IS NULL 
            OR auto_renewal_last_processed::date < CURRENT_DATE
          )
        ORDER BY auto_renewal_last_processed ASC NULLS FIRST
      `;
      
      const result = await pool.query(query);
      const carsToRenew = result.rows;
      
      console.log(`Found ${carsToRenew.length} cars eligible for auto-renewal`);
      
      if (carsToRenew.length === 0) {
        return { success: true, renewed: 0, message: 'No cars eligible for renewal' };
      }
      
      let renewedCount = 0;
      const renewalResults = [];
      
      for (const car of carsToRenew) {
        try {
          console.log(`Processing car #${car.id}: ${car.title}`);
          console.log(`Current created_at: ${car.created_at}`);
          console.log(`Last processed: ${car.auto_renewal_last_processed || 'Never'}`);
          
          await pool.query('BEGIN');
          
          // First, let's check if the function exists
          const functionCheck = await pool.query(`
            SELECT EXISTS (
              SELECT 1 FROM pg_proc 
              WHERE proname = 'calculate_auto_renewal_remaining_days'
            );
          `);
          console.log('Function exists:', functionCheck.rows[0].exists);
          
          // Update the car's created_at date to current timestamp (without function first)
          const updateQuery = `
            UPDATE cars 
            SET 
              created_at = NOW(),
              auto_renewal_last_processed = NOW()
            WHERE id = $1
            RETURNING created_at, auto_renewal_last_processed, auto_renewal_remaining_days
          `;
          
          console.log(`Executing update query for car #${car.id}`);
          const updateResult = await pool.query(updateQuery, [car.id]);
          console.log('Update result rows:', updateResult.rowCount);
          
          if (updateResult.rows.length === 0) {
            throw new Error(`No rows updated for car #${car.id}`);
          }
          
          const updatedCar = updateResult.rows[0];
          console.log(`Updated car #${car.id}:`);
          console.log(`  New created_at: ${updatedCar.created_at}`);
          console.log(`  Last processed: ${updatedCar.auto_renewal_last_processed}`);
          console.log(`  Remaining days: ${updatedCar.auto_renewal_remaining_days}`);
          
          // Record the auto-renewal transaction for tracking
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
            car.seller_id,
            0, // No cost for auto-renewal processing
            'auto_renewal_car',
            `Auto-renewal processed for car "${car.title}" (ID: ${car.id}). Car refreshed on ${updatedCar.created_at.toISOString()}. Remaining auto-renewal days: ${updatedCar.auto_renewal_remaining_days}`,
            'completed',
            car.id
          ]);
          
          await pool.query('COMMIT');
          console.log('Transaction committed for car #' + car.id);
          
          // Verify the update by querying the database again
          const verifyQuery = `SELECT id, created_at, auto_renewal_last_processed FROM cars WHERE id = $1`;
          const verifyResult = await pool.query(verifyQuery, [car.id]);
          const verifiedCar = verifyResult.rows[0];
          console.log(`Verification query for car #${car.id}:`);
          console.log(`  DB created_at: ${verifiedCar.created_at}`);
          console.log(`  DB last_processed: ${verifiedCar.auto_renewal_last_processed}`);
          
          renewedCount++;
          renewalResults.push({
            carId: car.id,
            title: car.title,
            oldCreatedAt: car.created_at,
            newCreatedAt: updatedCar.created_at,
            verifiedCreatedAt: verifiedCar.created_at,
            remainingDays: updatedCar.auto_renewal_remaining_days
          });
          
          console.log(`✓ Renewed car ${car.id}: "${car.title}" - Remaining days: ${updatedCar.auto_renewal_remaining_days}`);
          
        } catch (error) {
          await pool.query('ROLLBACK');
          console.error(`✗ Failed to renew car ${car.id}:`, error.message);
          renewalResults.push({
            carId: car.id,
            title: car.title,
            error: error.message
          });
        }
      }
      
      console.log(`Car auto-renewal processing complete. Renewed: ${renewedCount}/${carsToRenew.length}`);
      
      return {
        success: true,
        renewed: renewedCount,
        total: carsToRenew.length,
        results: renewalResults
      };
      
    } catch (error) {
      console.error('Error in car auto-renewal processing:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Process auto-renewal for all eligible parts
   * Updates created_at date and tracks renewal usage
   */
  async processPartAutoRenewals() {
    try {
      console.log('Starting part auto-renewal processing...');
      
      // Debug: First check all parts with auto-renewal enabled
      const debugQuery = `
        SELECT 
          id, 
          title,
          auto_renewal_enabled,
          auto_renewal_expiration_date,
          auto_renewal_last_processed,
          auto_renewal_days,
          NOW() as current_time,
          CASE 
            WHEN auto_renewal_expiration_date IS NULL THEN 'No expiration date'
            WHEN auto_renewal_expiration_date <= NOW() THEN 'EXPIRED - auto-renewal disabled'
            WHEN auto_renewal_last_processed IS NULL THEN 'Never processed - ELIGIBLE'
            WHEN auto_renewal_last_processed::date < CURRENT_DATE THEN 'Not processed today - ELIGIBLE'
            ELSE 'Already processed today'
          END as eligibility_status
        FROM parts 
        WHERE auto_renewal_enabled = TRUE
        ORDER BY id
      `;
      
      const debugResult = await pool.query(debugQuery);
      console.log('=== PARTS AUTO-RENEWAL DEBUG INFO ===');
      console.log(`Total parts with auto_renewal_enabled = TRUE: ${debugResult.rows.length}`);
      
      if (debugResult.rows.length > 0) {
        console.log('Auto-renewal enabled parts:');
        debugResult.rows.forEach(part => {
          console.log(`- Part #${part.id}: ${part.title}`);
          console.log(`  Expiration: ${part.auto_renewal_expiration_date}`);
          console.log(`  Last processed: ${part.auto_renewal_last_processed || 'Never'}`);
          console.log(`  Renewal days: ${part.auto_renewal_days}`);
          console.log(`  Status: ${part.eligibility_status}`);
          console.log('');
        });
      }
      
      // Get all parts eligible for auto-renewal
      // Update created_at daily (every 24 hours) for active auto-renewals
      const query = `
        SELECT 
          id, 
          title,
          seller_id,
          created_at,
          auto_renewal_days,
          auto_renewal_expiration_date,
          auto_renewal_last_processed,
          auto_renewal_remaining_days
        FROM parts 
        WHERE auto_renewal_enabled = TRUE 
          AND (auto_renewal_expiration_date IS NULL OR auto_renewal_expiration_date > NOW())
          AND (
            auto_renewal_last_processed IS NULL 
            OR auto_renewal_last_processed::date < CURRENT_DATE
          )
        ORDER BY auto_renewal_last_processed ASC NULLS FIRST
      `;
      
      const result = await pool.query(query);
      const partsToRenew = result.rows;
      
      console.log(`Found ${partsToRenew.length} parts eligible for auto-renewal`);
      
      if (partsToRenew.length === 0) {
        return { success: true, renewed: 0, message: 'No parts eligible for renewal' };
      }
      
      let renewedCount = 0;
      const renewalResults = [];
      
      for (const part of partsToRenew) {
        try {
          console.log(`Processing part #${part.id}: ${part.title}`);
          console.log(`Current created_at: ${part.created_at}`);
          console.log(`Last processed: ${part.auto_renewal_last_processed || 'Never'}`);
          
          await pool.query('BEGIN');
          
          // Update the part's created_at date to current timestamp (without function first)
          const updateQuery = `
            UPDATE parts 
            SET 
              created_at = NOW(),
              auto_renewal_last_processed = NOW()
            WHERE id = $1
            RETURNING created_at, auto_renewal_last_processed, auto_renewal_remaining_days
          `;
          
          console.log(`Executing update query for part #${part.id}`);
          const updateResult = await pool.query(updateQuery, [part.id]);
          console.log('Update result rows:', updateResult.rowCount);
          
          if (updateResult.rows.length === 0) {
            throw new Error(`No rows updated for part #${part.id}`);
          }
          
          const updatedPart = updateResult.rows[0];
          console.log(`Updated part #${part.id}:`);
          console.log(`  New created_at: ${updatedPart.created_at}`);
          console.log(`  Last processed: ${updatedPart.auto_renewal_last_processed}`);
          console.log(`  Remaining days: ${updatedPart.auto_renewal_remaining_days}`);
          
          // Record the auto-renewal transaction for tracking
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
            part.seller_id,
            0, // No cost for auto-renewal processing
            'auto_renewal_part',
            `Auto-renewal processed for part "${part.title}" (ID: ${part.id}). Part refreshed on ${updatedPart.created_at.toISOString()}. Remaining auto-renewal days: ${updatedPart.auto_renewal_remaining_days}`,
            'completed',
            part.id
          ]);
          
          await pool.query('COMMIT');
          console.log('Transaction committed for part #' + part.id);
          
          // Verify the update by querying the database again
          const verifyQuery = `SELECT id, created_at, auto_renewal_last_processed FROM parts WHERE id = $1`;
          const verifyResult = await pool.query(verifyQuery, [part.id]);
          const verifiedPart = verifyResult.rows[0];
          console.log(`Verification query for part #${part.id}:`);
          console.log(`  DB created_at: ${verifiedPart.created_at}`);
          console.log(`  DB last_processed: ${verifiedPart.auto_renewal_last_processed}`);
          
          renewedCount++;
          renewalResults.push({
            partId: part.id,
            title: part.title,
            oldCreatedAt: part.created_at,
            newCreatedAt: updatedPart.created_at,
            verifiedCreatedAt: verifiedPart.created_at,
            remainingDays: updatedPart.auto_renewal_remaining_days
          });
          
          console.log(`✓ Renewed part ${part.id}: "${part.title}" - Remaining days: ${updatedPart.auto_renewal_remaining_days}`);
          
        } catch (error) {
          await pool.query('ROLLBACK');
          console.error(`✗ Failed to renew part ${part.id}:`, error.message);
          renewalResults.push({
            partId: part.id,
            title: part.title,
            error: error.message
          });
        }
      }
      
      console.log(`Part auto-renewal processing complete. Renewed: ${renewedCount}/${partsToRenew.length}`);
      
      return {
        success: true,
        renewed: renewedCount,
        total: partsToRenew.length,
        results: renewalResults
      };
      
    } catch (error) {
      console.error('Error in part auto-renewal processing:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Process all auto-renewals (both cars and parts)
   */
  async processAllAutoRenewals() {
    console.log('=== Starting Auto-Renewal Processing ===');
    const startTime = new Date();
    
    const carResults = await this.processCarAutoRenewals();
    const partResults = await this.processPartAutoRenewals();
    
    const endTime = new Date();
    const duration = endTime - startTime;
    
    const summary = {
      timestamp: startTime.toISOString(),
      duration: `${duration}ms`,
      cars: {
        renewed: carResults.renewed || 0,
        total: carResults.total || 0,
        success: carResults.success
      },
      parts: {
        renewed: partResults.renewed || 0,
        total: partResults.total || 0,
        success: partResults.success
      },
      totalRenewed: (carResults.renewed || 0) + (partResults.renewed || 0)
    };
    
    console.log('=== Auto-Renewal Processing Complete ===');
    console.log('Summary:', JSON.stringify(summary, null, 2));
    
    return summary;
  }
  
  /**
   * Get auto-renewal statistics
   */
  async getAutoRenewalStats() {
    try {
      const statsQuery = `
        SELECT 
          'cars' as type,
          COUNT(*) as total_with_auto_renewal,
          COUNT(*) FILTER (WHERE auto_renewal_enabled = TRUE AND auto_renewal_expiration_date > NOW()) as active_auto_renewals,
          COUNT(*) FILTER (WHERE auto_renewal_enabled = TRUE AND auto_renewal_expiration_date <= NOW()) as expired_auto_renewals
        FROM cars
        WHERE auto_renewal_enabled = TRUE
        
        UNION ALL
        
        SELECT 
          'parts' as type,
          COUNT(*) as total_with_auto_renewal,
          COUNT(*) FILTER (WHERE auto_renewal_enabled = TRUE AND auto_renewal_expiration_date > NOW()) as active_auto_renewals,
          COUNT(*) FILTER (WHERE auto_renewal_enabled = TRUE AND auto_renewal_expiration_date <= NOW()) as expired_auto_renewals
        FROM parts
        WHERE auto_renewal_enabled = TRUE
      `;
      
      const result = await pool.query(statsQuery);
      
      return {
        success: true,
        stats: result.rows
      };
      
    } catch (error) {
      console.error('Error getting auto-renewal stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Disable expired auto-renewals
   */
  async disableExpiredAutoRenewals() {
    try {
      console.log('Disabling expired auto-renewals...');
      
      // Disable expired car auto-renewals
      const carUpdateQuery = `
        UPDATE cars 
        SET 
          auto_renewal_enabled = FALSE,
          auto_renewal_remaining_days = 0
        WHERE auto_renewal_enabled = TRUE 
          AND auto_renewal_expiration_date <= NOW()
        RETURNING id, title
      `;
      
      const carResult = await pool.query(carUpdateQuery);
      
      // Disable expired part auto-renewals
      const partUpdateQuery = `
        UPDATE parts 
        SET 
          auto_renewal_enabled = FALSE,
          auto_renewal_remaining_days = 0
        WHERE auto_renewal_enabled = TRUE 
          AND auto_renewal_expiration_date <= NOW()
        RETURNING id, title
      `;
      
      const partResult = await pool.query(partUpdateQuery);
      
      console.log(`Disabled ${carResult.rowCount} expired car auto-renewals`);
      console.log(`Disabled ${partResult.rowCount} expired part auto-renewals`);
      
      return {
        success: true,
        disabledCars: carResult.rowCount,
        disabledParts: partResult.rowCount,
        total: carResult.rowCount + partResult.rowCount
      };
      
    } catch (error) {
      console.error('Error disabling expired auto-renewals:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AutoRenewalService();