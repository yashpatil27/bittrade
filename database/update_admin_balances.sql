-- Update admin user balances
-- This script updates the admin user's balances if they already exist

USE bittrade;

-- Update admin user balances
UPDATE users 
SET 
    available_inr = 100000,     -- 100,000 rupees
    available_btc = 10000000    -- 10,000,000 satoshis = 0.1 BTC
WHERE 
    email = 'admin@bittrade.co.in' 
    AND is_admin = true;

-- Verify the update
SELECT 
    id, 
    email, 
    name, 
    is_admin, 
    available_inr, 
    available_btc,
    ROUND(available_btc / 100000000, 8) as available_btc_formatted,
    created_at
FROM users 
WHERE email = 'admin@bittrade.co.in';

-- Show balance summary
SELECT 
    'Admin Balance Update' as action,
    CASE 
        WHEN ROW_COUNT() > 0 THEN 'SUCCESS' 
        ELSE 'FAILED - Admin user not found' 
    END as status,
    '₹100,000' as inr_balance,
    '0.1 BTC' as btc_balance;
