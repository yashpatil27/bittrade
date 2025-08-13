-- ₿itTrade Database Schema v2.3 (CLEANED)
-- Lean and focused schema for limit orders and DCA
-- MySQL Implementation
-- Major cleanup completed - removed 13+ unused columns and 2 empty tables

-- Create database
CREATE DATABASE IF NOT EXISTS bittrade;
USE bittrade;

-- Users table (Enhanced with balance segregation)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  
  -- Balance segregation (INR amounts in rupees, BTC amounts in satoshis)
  available_inr INT DEFAULT 0,           -- Liquid INR balance (rupees)
  available_btc BIGINT DEFAULT 0,        -- Liquid BTC balance (satoshis)
  reserved_inr INT DEFAULT 0,            -- INR locked in pending orders (rupees)
  reserved_btc BIGINT DEFAULT 0,         -- BTC locked in pending orders (satoshis)
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Transactions table (Unified activity log for all transactions)
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type ENUM(
    'MARKET_BUY', 'MARKET_SELL', 
    'LIMIT_BUY', 'LIMIT_SELL', 
    'DCA_BUY', 'DCA_SELL', 
    'DEPOSIT_INR', 'WITHDRAW_INR', 
    'DEPOSIT_BTC', 'WITHDRAW_BTC'
  ) NOT NULL,
  status ENUM('PENDING', 'EXECUTED') NOT NULL DEFAULT 'PENDING',
  
  -- Amount fields
  btc_amount BIGINT NOT NULL DEFAULT 0,  -- BTC amount in satoshis
  inr_amount INT NOT NULL DEFAULT 0,     -- INR amount in rupees
  execution_price INT,                   -- Execution price (INR per BTC) - for limit orders: target price, for market orders: actual price
  
  -- Relationships
  parent_id INT,                         -- For DCA installments or related transactions
  dca_plan_id INT,                       -- Reference to DCA plan for DCA transactions
  
  -- Scheduling
  scheduled_at TIMESTAMP,                -- When transaction should execute
  executed_at TIMESTAMP,                 -- When transaction was executed
  expires_at TIMESTAMP,                  -- When transaction expires

  -- Metadata
  notes TEXT,                            -- Additional transaction details
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES transactions(id) ON DELETE SET NULL,
  INDEX idx_user_transactions (user_id, created_at DESC),
  INDEX idx_status_scheduled (status, scheduled_at),
  INDEX idx_type_status (type, status),
  INDEX idx_transactions_created_at (created_at DESC)
);

-- Active Plans table (For recurring operations like DCA)
CREATE TABLE active_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  plan_type ENUM('DCA_BUY', 'DCA_SELL') NOT NULL,
  status ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  
  -- Plan configuration
  frequency ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY') NOT NULL,
  amount_per_execution_inr INT,          -- INR amount per execution (rupees)
  amount_per_execution_btc BIGINT,       -- BTC amount per execution (satoshis)
  next_execution_at TIMESTAMP NOT NULL,
  
  -- Execution tracking
  total_executions INT DEFAULT 0,
  remaining_executions INT,              -- NULL for unlimited
  max_price INT,                        -- Max price per BTC (optional)
  min_price INT,                        -- Min price per BTC (optional)
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_active_plans_execution (status, next_execution_at)
);


-- Settings table (updated to support decimal values)
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  `key` VARCHAR(100) UNIQUE NOT NULL,
  value DECIMAL(10,4) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bitcoin data table (lean and focused)
CREATE TABLE bitcoin_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Price Data (Updated every 30 seconds)
  btc_usd_price INT NOT NULL,
  
  -- Timestamps
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Bitcoin chart data table
CREATE TABLE bitcoin_chart_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  timeframe ENUM('1d', '7d', '30d', '90d', '365d') NOT NULL,
  price_data JSON NOT NULL,
  data_points_count INT UNSIGNED NOT NULL,
  price_change_pct DECIMAL(8,2) DEFAULT NULL,
  
  date_from TIMESTAMP NOT NULL,
  date_to TIMESTAMP NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (`key`, value) VALUES 
('buy_multiplier', 91.0000), -- USDINR rate for converting BTCUSD to BTCINR for BUY Transactions
('sell_multiplier', 88.0000); -- USDINR rate for converting BTCUSD to BTCINR for SELL Transactions

-- Create additional indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_settings_key ON settings(`key`);

-- Bitcoin data indexes
CREATE INDEX idx_bitcoin_data_last_updated ON bitcoin_data(last_updated);
CREATE INDEX idx_bitcoin_data_btc_usd_price ON bitcoin_data(btc_usd_price);
CREATE INDEX idx_bitcoin_data_created_at ON bitcoin_data(created_at);


-- Bitcoin chart data indexes
CREATE INDEX idx_bitcoin_chart_data_timeframe ON bitcoin_chart_data(timeframe);
CREATE INDEX idx_bitcoin_chart_data_timeframe_updated ON bitcoin_chart_data(timeframe, last_updated DESC);
CREATE INDEX idx_bitcoin_chart_data_last_updated ON bitcoin_chart_data(last_updated DESC);

-- Migration log table
CREATE TABLE migration_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  migration_file VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  INDEX idx_migration_log_file (migration_file),
  INDEX idx_migration_log_applied_at (applied_at)
);

-- ========================================================================
-- CURRENT DATABASE STATE SUMMARY
-- ========================================================================
-- This schema reflects the current CLEANED database structure as of August 2025:
-- 
-- MAJOR CLEANUP APPLIED:
-- - loans table: COMPLETELY DROPPED (migration 006_drop_loans_table.sql)
-- - bitcoin_sentiment table: COMPLETELY DROPPED (migration 007_drop_unused_columns.sql)
-- - Removed 3 loan-related columns from users table: collateral_btc, borrowed_inr, interest_accrued
-- - Removed 3 unused columns from transactions table: loan_id, cancellation_reason, cancelled_at
-- - Removed 6 unused columns from bitcoin_data table: market_cap_usd, volume_24h_usd, high_24h_usd, ath_usd, ath_date, ath_change_pct
-- - Removed loan_interest_rate setting
-- 
-- REMAINING STRUCTURE:
-- - 7 lean tables (down from 9)
-- - users: only essential balance and auth fields
-- - transactions: core transaction data only
-- - active_plans: DCA functionality
-- - settings: exchange rate multipliers only
-- - bitcoin_data: just price and timestamps
-- - bitcoin_chart_data: chart data
-- - migration_log: tracks applied migrations
-- 
-- MIGRATION STATUS:
-- - migration 006: loans table dropped
-- - migration 007: unused columns and bitcoin_sentiment table dropped
-- - All migrations properly logged in migration_log table
-- 
-- BENEFITS OF CLEANUP:
-- - Removed 13+ unused columns and 2 empty tables
-- - Significantly reduced schema complexity
-- - Improved query performance
-- - Cleaner, focused database design
-- ========================================================================

