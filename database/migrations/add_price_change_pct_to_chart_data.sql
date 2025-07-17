-- Migration: Add price_change_pct to bitcoin_chart_data table
-- Date: 2025-01-17
-- Description: Add price_change_pct column to store calculated price changes for each timeframe

USE bittrade;

-- Add the new column to existing bitcoin_chart_data table
ALTER TABLE bitcoin_chart_data 
ADD COLUMN price_change_pct DECIMAL(8,2) DEFAULT NULL 
AFTER data_points_count;

-- Log this migration
INSERT INTO migration_log (migration_file, notes) 
VALUES ('add_price_change_pct_to_chart_data.sql', 'Added price_change_pct column to bitcoin_chart_data table');

-- Verify the column was added
DESCRIBE bitcoin_chart_data;
