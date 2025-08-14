-- Migration: Drop unused columns and bitcoin_sentiment table
-- File: 007_drop_unused_columns.sql
-- Description: Remove unused columns from users, transactions, bitcoin_data tables and drop bitcoin_sentiment table
-- Created: 2025-08-13

-- Verify current row counts and data before making changes
SELECT 'users table info:' as info;
SELECT COUNT(*) as total_rows FROM users;

SELECT 'transactions table info:' as info;
SELECT COUNT(*) as total_rows FROM transactions;

SELECT 'bitcoin_data table info:' as info;
SELECT COUNT(*) as total_rows FROM bitcoin_data;

SELECT 'bitcoin_sentiment table info:' as info;
SELECT COUNT(*) as total_rows FROM bitcoin_sentiment;

-- Check for any non-NULL values in columns we're about to drop
SELECT 'Checking for non-NULL values in columns to be dropped:' as info;

-- Users table loan-related columns (should all be 0/NULL)
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN collateral_btc != 0 THEN 1 END) as non_zero_collateral,
  COUNT(CASE WHEN borrowed_inr != 0 THEN 1 END) as non_zero_borrowed,
  COUNT(CASE WHEN interest_accrued != 0 THEN 1 END) as non_zero_interest
FROM users;

-- Transactions table columns (should all be NULL)
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN loan_id IS NOT NULL THEN 1 END) as non_null_loan_id,
  COUNT(CASE WHEN cancellation_reason IS NOT NULL THEN 1 END) as non_null_cancel_reason,
  COUNT(CASE WHEN cancelled_at IS NOT NULL THEN 1 END) as non_null_cancelled_at
FROM transactions;

-- Bitcoin data columns - check for NULL values
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN market_cap_usd IS NOT NULL THEN 1 END) as has_market_cap,
  COUNT(CASE WHEN volume_24h_usd IS NOT NULL THEN 1 END) as has_volume,
  COUNT(CASE WHEN high_24h_usd IS NOT NULL THEN 1 END) as has_high,
  COUNT(CASE WHEN ath_usd IS NOT NULL THEN 1 END) as has_ath,
  COUNT(CASE WHEN ath_date IS NOT NULL THEN 1 END) as has_ath_date,
  COUNT(CASE WHEN ath_change_pct IS NOT NULL THEN 1 END) as has_ath_change
FROM bitcoin_data;

-- Start dropping unused columns
SELECT 'Starting column drops...' as info;

-- 1. Drop columns from users table
ALTER TABLE users 
  DROP COLUMN collateral_btc,
  DROP COLUMN borrowed_inr,
  DROP COLUMN interest_accrued;

-- 2. Drop columns from transactions table
-- First drop the index on loan_id
DROP INDEX idx_transactions_loan_id ON transactions;

ALTER TABLE transactions 
  DROP COLUMN loan_id,
  DROP COLUMN cancellation_reason,
  DROP COLUMN cancelled_at;

-- 3. Drop columns from bitcoin_data table
ALTER TABLE bitcoin_data 
  DROP COLUMN market_cap_usd,
  DROP COLUMN volume_24h_usd,
  DROP COLUMN high_24h_usd,
  DROP COLUMN ath_usd,
  DROP COLUMN ath_date,
  DROP COLUMN ath_change_pct;

-- 4. Drop the entire bitcoin_sentiment table
DROP TABLE bitcoin_sentiment;

-- Verify the changes
SELECT 'Verifying changes...' as info;

-- Show remaining columns in modified tables
SELECT 'users table columns:' as info;
DESCRIBE users;

SELECT 'transactions table columns:' as info;
DESCRIBE transactions;

SELECT 'bitcoin_data table columns:' as info;
DESCRIBE bitcoin_data;

-- Verify bitcoin_sentiment table is gone
SELECT 'Current tables (bitcoin_sentiment should be gone):' as info;
SHOW TABLES;

SELECT 'Migration completed successfully!' as info;
