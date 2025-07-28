-- Create balance_transactions table
-- This table tracks all balance-related transactions for users

CREATE TABLE IF NOT EXISTS balance_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'vip_purchase', 'car_vip_purchase', 'part_vip_purchase', etc.
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    external_reference VARCHAR(255), -- Reference to external payment system
    payment_data JSONB, -- Store payment-related data
    payment_provider VARCHAR(50) DEFAULT 'flitt', -- 'flitt', 'bog', 'manual', etc.
    reference_id INTEGER, -- Reference to related entity (car_id, part_id, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user_id ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_type ON balance_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_status ON balance_transactions(status);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_created_at ON balance_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_reference ON balance_transactions(reference_id, transaction_type);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_balance_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_balance_transactions_updated_at
    BEFORE UPDATE ON balance_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_balance_transactions_updated_at();