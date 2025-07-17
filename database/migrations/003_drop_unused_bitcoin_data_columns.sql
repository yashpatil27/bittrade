-- Drop unused price change columns from bitcoin_data table
-- Migration: 003_drop_unused_bitcoin_data_columns.sql

USE bittrade;

-- Drop the columns that are no longer needed
ALTER TABLE bitcoin_data 
DROP COLUMN price_change_1h_pct,
DROP COLUMN price_change_7d_pct,
DROP COLUMN price_change_30d_pct,
DROP COLUMN price_change_1y_pct,
DROP COLUMN price_change_24h,
DROP COLUMN price_change_24h_pct,
DROP COLUMN low_24h_usd;

-- Log the migration
INSERT INTO migration_log (migration_file, notes) 
VALUES ('003_drop_unused_bitcoin_data_columns.sql', 'Dropped unused price change columns from bitcoin_data table');
