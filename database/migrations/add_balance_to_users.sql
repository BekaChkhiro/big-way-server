-- Add balance column to users table
-- This migration adds the balance functionality to the users table

-- Add balance column with default value of 0.00
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00;

-- Add constraint to ensure balance cannot be negative
ALTER TABLE users ADD CONSTRAINT check_balance_non_negative CHECK (balance >= 0);

-- Create index on balance column for better query performance
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance);

-- Update existing users to have 0 balance if the column was just added
UPDATE users SET balance = 0.00 WHERE balance IS NULL;