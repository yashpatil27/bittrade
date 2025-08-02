-- Migration 007: Change settings value column to support decimal values
-- This allows buy_multiplier and sell_multiplier to have decimal precision

-- Alter the settings table to change value from INT to DECIMAL(10,4)
-- DECIMAL(10,4) allows up to 6 digits before decimal and 4 digits after (e.g., 123456.7890)
ALTER TABLE settings MODIFY COLUMN value DECIMAL(10,4) NOT NULL;

-- Update existing integer values to decimal format
-- This preserves existing data while allowing future decimal values
UPDATE settings SET value = value WHERE `key` IN ('buy_multiplier', 'sell_multiplier', 'loan_interest_rate');

-- Log this migration
INSERT INTO migration_log (migration_file, notes) 
VALUES ('007_settings_decimal_values.sql', 'Changed settings.value column from INT to DECIMAL(10,4) to support decimal multipliers');

-- Example of new decimal values that are now possible:
-- UPDATE settings SET value = 91.50 WHERE `key` = 'buy_multiplier';
-- UPDATE settings SET value = 88.25 WHERE `key` = 'sell_multiplier';
