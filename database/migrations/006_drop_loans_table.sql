-- Migration: Drop unused loans table
-- File: 006_drop_loans_table.sql
-- Description: Remove the empty loans table as lending functionality is not implemented
-- Created: 2025-08-13

-- Verify the loans table is empty (should return 0)
SELECT COUNT(*) as loan_count FROM loans;

-- Check if any transactions reference loans (should return 0 since loan_id is always NULL)
SELECT COUNT(*) as transactions_with_loans FROM transactions WHERE loan_id IS NOT NULL;

-- Verify there are no foreign key constraints to the loans table
-- (Analysis shows there are none, but good to double-check)
SELECT CONSTRAINT_NAME, COLUMN_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'transactions' 
  AND COLUMN_NAME = 'loan_id' 
  AND REFERENCED_TABLE_NAME = 'loans';

-- Drop the loans table (safe since it's empty and has no foreign key references)
DROP TABLE loans;

-- Verify the table was dropped
SHOW TABLES LIKE 'loans';

-- Optional: Log this migration
-- INSERT INTO migration_log (migration_file, notes) 
-- VALUES ('006_drop_loans_table.sql', 'Dropped empty loans table and related foreign key constraint');
