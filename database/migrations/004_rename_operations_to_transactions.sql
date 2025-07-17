-- Migration: Rename operations table to transactions
-- Date: 2025-07-17
-- Description: Rename the operations table to transactions for better clarity

-- Rename the table
RENAME TABLE operations TO transactions;

-- Update foreign key references if any exist
-- Note: The self-referencing foreign key (parent_id) will be automatically updated

-- Log this migration
INSERT INTO migration_log (migration_file, notes) 
VALUES ('004_rename_operations_to_transactions.sql', 'Renamed operations table to transactions for better clarity');
