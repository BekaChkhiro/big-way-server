/**
 * Migration script to add payment_provider column to balance_transactions table
 */
require('dotenv').config();
const { Pool } = require('pg');

// Create a new pool instance using DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addPaymentProviderColumn() {
  try {
    // Check if column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'balance_transactions' 
      AND column_name = 'payment_provider';
    `;
    
    const columnCheck = await pool.query(checkColumnQuery);
    
    // Add the column if it doesn't exist
    if (columnCheck.rows.length === 0) {
      console.log('Adding payment_provider column to balance_transactions table...');
      
      const addColumnQuery = `
        ALTER TABLE balance_transactions 
        ADD COLUMN payment_provider VARCHAR(50) DEFAULT 'flitt';
      `;
      
      await pool.query(addColumnQuery);
      console.log('Successfully added payment_provider column.');
    } else {
      console.log('payment_provider column already exists in balance_transactions table.');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Execute the migration
addPaymentProviderColumn();
