-- Restore admin balance after DCA race condition bug
-- The admin's balance was drained due to multiple simultaneous executions
-- caused by a race condition in the DCA execution service

USE bittrade;

-- Check current admin balance
SELECT 
    'BEFORE RESTORE' as status,
    id, 
    email, 
    available_inr, 
    available_btc,
    ROUND(available_btc / 100000000, 8) as available_btc_formatted
FROM users 
WHERE email = 'admin@bittrade.co.in';

-- Check how much was lost due to the race condition bug
SELECT 
    COUNT(*) as simultaneous_transactions,
    SUM(inr_amount) as total_drained,
    executed_at
FROM transactions 
WHERE user_id = 1 
  AND type = 'DCA_BUY' 
  AND executed_at = '2025-08-02 18:34:53'
GROUP BY executed_at;

-- Restore admin balance to reasonable amount
-- Give back what was lost due to the bug (61 transactions * ₹500 = ₹30,500)
-- Plus some additional buffer for testing
UPDATE users 
SET available_inr = available_inr + 50000  -- Add ₹50,000 back
WHERE email = 'admin@bittrade.co.in' 
  AND is_admin = true;

-- Show updated balance
SELECT 
    'AFTER RESTORE' as status,
    id, 
    email, 
    available_inr, 
    available_btc,
    ROUND(available_btc / 100000000, 8) as available_btc_formatted
FROM users 
WHERE email = 'admin@bittrade.co.in';

SELECT 'Admin balance restored after fixing DCA race condition bug' as message;
