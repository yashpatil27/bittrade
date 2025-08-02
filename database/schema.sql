-- ₿itTrade Database Schema v2.1
-- Comprehensive schema for limit orders, DCA, and overcollateralized loans
-- MySQL Implementation
-- Updated to reflect current database structure

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
  collateral_btc BIGINT DEFAULT 0,       -- BTC locked as loan collateral (satoshis)
  borrowed_inr INT DEFAULT 0,            -- Total INR borrowed against collateral (rupees)
  interest_accrued INT DEFAULT 0,        -- Accumulated loan interest (rupees)
  
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
    'LOAN_CREATE', 'LOAN_BORROW', 'LOAN_REPAY', 'LOAN_ADD_COLLATERAL', 'LIQUIDATION', 
    'PARTIAL_LIQUIDATION', 'FULL_LIQUIDATION',
    'INTEREST_ACCRUAL',
    'DEPOSIT_INR', 'WITHDRAW_INR', 'DEPOSIT_BTC', 'WITHDRAW_BTC'
  ) NOT NULL,
  status ENUM('PENDING', 'EXECUTED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  
  -- Amount fields
  btc_amount BIGINT NOT NULL DEFAULT 0,  -- BTC amount in satoshis
  inr_amount INT NOT NULL DEFAULT 0,     -- INR amount in rupees
  execution_price INT,                   -- Execution price (INR per BTC) - for limit orders: target price, for market orders: actual price
  
  -- Relationships
  parent_id INT,                         -- For DCA installments or related transactions
  loan_id INT,                          -- Reference to loan for loan transactions
  dca_plan_id INT,                      -- Reference to DCA plan for DCA transactions
  
  -- Scheduling
  scheduled_at TIMESTAMP,               -- When transaction should execute
  executed_at TIMESTAMP,                -- When transaction was executed
  expires_at TIMESTAMP,                 -- When transaction expires
  cancelled_at TIMESTAMP,
  cancellation_reason VARCHAR(255) NULL,

  -- Metadata
  notes TEXT,                           -- Additional transaction details
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES transactions(id) ON DELETE SET NULL,
  INDEX idx_user_transactions (user_id, created_at DESC),
  INDEX idx_status_scheduled (status, scheduled_at),
  INDEX idx_type_status (type, status),
  INDEX idx_transactions_loan_id (loan_id),
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

-- Loans table (Overcollateralized loan management)
CREATE TABLE loans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  
  -- Loan amounts
  btc_collateral_amount BIGINT NOT NULL,        -- BTC locked as collateral (satoshis)
  inr_borrowed_amount INT NOT NULL,             -- INR borrowed (rupees)
  ltv_ratio DECIMAL(5,2) NOT NULL,             -- e.g., 60.00 for 60% LTV
  interest_rate DECIMAL(5,2) NOT NULL,         -- Annual interest rate
  
  -- Risk management
  liquidation_price DECIMAL(10,2),             -- BTC price triggering liquidation
  
  status ENUM('ACTIVE', 'REPAID', 'LIQUIDATED') NOT NULL DEFAULT 'ACTIVE',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  repaid_at TIMESTAMP,
  liquidated_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_loans_status (status),
  INDEX idx_loans_user (user_id),
  INDEX idx_loans_liquidation (status, liquidation_price),
  INDEX idx_loans_ltv_ratio (ltv_ratio)
);


-- Settings table (updated to support decimal values)
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  `key` VARCHAR(100) UNIQUE NOT NULL,
  value DECIMAL(10,4) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bitcoin data table (cleaned up)
CREATE TABLE bitcoin_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Price Data (Updated every 30 seconds)
  btc_usd_price INT NOT NULL,
  
  -- Market Data
  market_cap_usd BIGINT UNSIGNED NULL,
  volume_24h_usd BIGINT UNSIGNED NULL,
  high_24h_usd INT DEFAULT NULL,
  
  -- All-Time Records
  ath_usd INT DEFAULT NULL,
  ath_date DATE NULL,
  ath_change_pct DECIMAL(8,2) DEFAULT NULL,
  
  -- Timestamps
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bitcoin sentiment table (unchanged)
CREATE TABLE bitcoin_sentiment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  fear_greed_value TINYINT UNSIGNED NULL,
  fear_greed_classification ENUM('Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed') NULL,
  
  data_date DATE NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_date (data_date)
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
('sell_multiplier', 88.0000), -- USDINR rate for converting BTCUSD to BTCINR for SELL Transactions
('loan_interest_rate', 15.0000);

-- Create additional indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_settings_key ON settings(`key`);

-- Bitcoin data indexes
CREATE INDEX idx_bitcoin_data_last_updated ON bitcoin_data(last_updated);
CREATE INDEX idx_bitcoin_data_btc_usd_price ON bitcoin_data(btc_usd_price);
CREATE INDEX idx_bitcoin_data_created_at ON bitcoin_data(created_at);

-- Bitcoin sentiment indexes
CREATE INDEX idx_bitcoin_sentiment_data_date ON bitcoin_sentiment(data_date);

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
-- This schema reflects the current database structure as of January 2025:
-- 
-- STRUCTURAL CHANGES APPLIED:
-- - operations table renamed to transactions (from migration 004)
-- - price_change_pct column added to bitcoin_chart_data (from migration add_price_change_pct)
-- - dca_plan_id column added to transactions table
-- - active_plans table uses separate amount_per_execution_inr and amount_per_execution_btc columns
-- - settings.value column changed from INT to DECIMAL(10,4) to support decimal multipliers (migration 007)
-- 
-- TIMESTAMP COLUMNS:
-- - All timestamp columns use DEFAULT CURRENT_TIMESTAMP (NOT the UTC_TIMESTAMP migration)
-- - Migration 006 (UTC timestamps) was NOT applied to the current database
-- 
-- MIGRATION STATUS:
-- - No formal migrations have been logged in migration_log table
-- - Database structure evolved manually without migration tracking
-- ========================================================================

