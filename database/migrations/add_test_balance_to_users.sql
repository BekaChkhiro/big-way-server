-- Add test balance to users for testing VIP purchases
-- This script gives some users a balance to test VIP functionality

-- Give first 5 users a balance of 100 GEL for testing
UPDATE users 
SET balance = 100.00 
WHERE id IN (SELECT id FROM users ORDER BY id LIMIT 5);

-- Insert corresponding balance transactions for the test balances
INSERT INTO balance_transactions (user_id, amount, transaction_type, description, status)
SELECT 
    id as user_id,
    100.00 as amount,
    'deposit' as transaction_type,
    'Test balance for VIP functionality testing' as description,
    'completed' as status
FROM users 
WHERE id IN (SELECT id FROM users ORDER BY id LIMIT 5);