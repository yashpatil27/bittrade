-- Migration to convert TIMESTAMP columns from CURRENT_TIMESTAMP defaults to NOT NULL
-- This migration supports the switch to JavaScript-generated UTC timestamps

-- Users table
ALTER TABLE users 
  MODIFY COLUMN created_at TIMESTAMP NOT NULL,
  MODIFY COLUMN updated_at TIMESTAMP NOT NULL;

-- Transactions table
ALTER TABLE transactions 
  MODIFY COLUMN created_at TIMESTAMP NOT NULL;

-- Active Plans table  
ALTER TABLE active_plans 
  MODIFY COLUMN created_at TIMESTAMP NOT NULL;

-- Loans table
ALTER TABLE loans 
  MODIFY COLUMN created_at TIMESTAMP NOT NULL;

-- Settings table
ALTER TABLE settings 
  MODIFY COLUMN updated_at TIMESTAMP NOT NULL;

-- Bitcoin data table
ALTER TABLE bitcoin_data 
  MODIFY COLUMN last_updated TIMESTAMP NOT NULL,
  MODIFY COLUMN created_at TIMESTAMP NOT NULL;

-- Bitcoin sentiment table
ALTER TABLE bitcoin_sentiment 
  MODIFY COLUMN last_updated TIMESTAMP NOT NULL;

-- Bitcoin chart data table
ALTER TABLE bitcoin_chart_data 
  MODIFY COLUMN last_updated TIMESTAMP NOT NULL;

-- Migration log table
ALTER TABLE migration_log 
  MODIFY COLUMN applied_at TIMESTAMP NOT NULL;

-- Update settings table updated_at timestamp for existing records
UPDATE settings SET updated_at = UTC_TIMESTAMP() WHERE updated_at IS NULL;

-- Insert migration record
INSERT INTO migration_log (migration_file, applied_at, notes) 
VALUES ('006_utc_timestamp_migration.sql', UTC_TIMESTAMP(), 'Converted TIMESTAMP columns to NOT NULL for JavaScript UTC timestamp handling');
