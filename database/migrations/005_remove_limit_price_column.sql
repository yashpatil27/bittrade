-- Migration: Remove limit_price column from transactions table
-- Date: 2025-07-27
-- Description: Remove redundant limit_price column since execution_price serves both purposes
-- For limit orders: execution_price = target_price (initially) and stays same when executed
-- For market orders: execution_price = actual_market_price (always executed immediately)

USE bittrade;

-- Remove the limit_price column since execution_price handles both cases
ALTER TABLE transactions DROP COLUMN limit_price;

-- Log this migration
INSERT INTO migration_log (migration_file, notes) 
VALUES ('005_remove_limit_price_column.sql', 'Removed redundant limit_price column - execution_price now handles both target price for limit orders and actual execution price');
