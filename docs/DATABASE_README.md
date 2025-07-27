# BitTrade Database Documentation

## Overview

This document provides a thorough overview of the BitTrade database schema, detailing the various tables, relationships, and constraints designed to support a cryptocurrency trading platform. It aims to facilitate effective database management, ensure data integrity, and optimize queries.

## Database Structure

### Database Name: `bittrade`

**Database Type**: MySQL

## Tables and Schemas

### 1. Users Table
**Table Name**: `users`

This table manages user accounts with balance segregation and ensures unique email addresses.

**Schema:**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT false,
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
```

### 2. Transactions Table
**Table Name**: `transactions`

This table captures all transaction types, supporting extensive cryptocurrency trading activity and history.

**Schema:**
```sql
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
  btc_amount BIGINT NOT NULL DEFAULT 0,  -- BTC amount in satoshis
  inr_amount INT NOT NULL DEFAULT 0,     -- INR amount in rupees
  execution_price INT,                   -- Execution price (INR per BTC) - for limit orders: target price, for market orders: actual price
  parent_id INT,                         -- For DCA installments or related transactions
  loan_id INT,                          -- Reference to loan for loan transactions
  scheduled_at TIMESTAMP,               -- When transaction should execute
  executed_at TIMESTAMP,                -- When transaction was executed
  expires_at TIMESTAMP,                 -- When transaction expires
  cancelled_at TIMESTAMP,
  cancellation_reason VARCHAR(255) NULL,
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
```

### 3. Active Plans Table
**Table Name**: `active_plans`

This table records recurring operations such as Dollar-Cost Averaging (DCA).

**Schema:**
```sql
CREATE TABLE active_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  plan_type ENUM('DCA_BUY', 'DCA_SELL') NOT NULL,
  status ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  frequency ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY') NOT NULL,
  amount_per_execution INT NOT NULL,     -- INR amount per execution (rupees)
  next_execution_at TIMESTAMP NOT NULL,
  total_executions INT DEFAULT 0,
  remaining_executions INT,              -- NULL for unlimited
  max_price INT,                        -- Max price per BTC (optional)
  min_price INT,                        -- Min price per BTC (optional)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_active_plans_execution (status, next_execution_at)
);
```

### 4. Loans Table
**Table Name**: `loans`

This table supports overcollateralized loan management for users, vital for margin trading and leverage features.

**Schema:**
```sql
CREATE TABLE loans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  btc_collateral_amount BIGINT NOT NULL,        -- BTC locked as collateral (satoshis)
  inr_borrowed_amount INT NOT NULL,             -- INR borrowed (rupees)
  ltv_ratio DECIMAL(5,2) NOT NULL,             -- e.g., 60.00 for 60% LTV
  interest_rate DECIMAL(5,2) NOT NULL,         -- Annual interest rate
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
```

### 5. Settings Table
**Table Name**: `settings`

A generic key-value storage table for application configurations and multipliers.

**Schema:**
```sql
CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  `key` VARCHAR(100) UNIQUE NOT NULL,
  value INT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 6. Bitcoin Data Table
**Table Name**: `bitcoin_data`

This table stores Bitcoin market data updates, supporting analytics and price tracking within the platform.

**Schema:**
```sql
CREATE TABLE bitcoin_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  btc_usd_price INT NOT NULL,
  market_cap_usd BIGINT UNSIGNED NULL,
  volume_24h_usd BIGINT UNSIGNED NULL,
  high_24h_usd INT DEFAULT NULL,
  ath_usd INT DEFAULT NULL,
  ath_date DATE NULL,
  ath_change_pct DECIMAL(8,2) DEFAULT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. Bitcoin Sentiment Table
**Table Name**: `bitcoin_sentiment`

This table captures sentiment data, providing an indication of market conditions.

**Schema:**
```sql
CREATE TABLE bitcoin_sentiment (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fear_greed_value TINYINT UNSIGNED NULL,
  fear_greed_classification ENUM('Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed') NULL,
  data_date DATE NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_date (data_date)
);
```

### 8. Bitcoin Chart Data Table
**Table Name**: `bitcoin_chart_data`

This table maintains historical price data across various timeframes for charting.

**Schema:**
```sql
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
```

### 9. Migration Log Table
**Table Name**: `migration_log`

This table logs every applied migration, ensuring tracking of schema changes over time.

**Schema:**
```sql
CREATE TABLE migration_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  migration_file VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  INDEX idx_migration_log_file (migration_file),
  INDEX idx_migration_log_applied_at (applied_at)
);
```

## Key Relationships

- **Foreign Key Relations**:
  - Users and Transactions
  - Users and Active Plans
  - Users and Loans

- **Indices**:
  - Time-based indices on key transaction timestamps for performance boosts
  - Relation-awareness with foreign key constraints

## Index Implementation

**Example Index Definition**:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_active_plans_execution (status, next_execution_at);
CREATE INDEX idx_loans_user (user_id);
CREATE INDEX idx_bitcoin_data_last_updated ON bitcoin_data(last_updated);
```

## Optimization Strategies

### Query Performance
- **Index Usage**: Frequent queries should leverage indices to speed up search operations.
- **Joins Consideration**: Ensure joins are executed on indexed columns.
- **Query Caching**: Enable query caching for repeated queries under a load.

### Schema Normalization
- **Third Normal Form**: Ensure tables are designed adhering to 3NF for clean schema and performance.
- **Data Integrity Constraints**: Ensure foreign keys and data types are correctly constrained and validated where possible.

## Data Types and Precision

### Currency Handling
The database uses precise integer storage for all currency values:

- **INR (Indian Rupees)**: Stored as `INT` representing paise (1 rupee = 100 paise)
  - Example: ₹1,000.50 is stored as 100050
  - Range: -2,147,483,648 to 2,147,483,647 (approximately -21.4M to 21.4M rupees)

- **BTC (Bitcoin)**: Stored as `BIGINT` representing satoshis (1 BTC = 100,000,000 satoshis)
  - Example: 0.00001 BTC is stored as 1000
  - Range: -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 satoshis
  - Maximum: ~92.2 billion BTC (well beyond Bitcoin's 21M supply limit)

### Price Precision
- **Bitcoin USD Price**: Stored as `INT` representing whole dollars
- **Execution Price**: Stored as `INT` representing INR per BTC (serves as both target price for limit orders and actual execution price)
- **Interest Rates/LTV**: Stored as `DECIMAL(5,2)` for percentage values (e.g., 15.50%)

## Default Data

### Settings Table Initial Values
```sql
INSERT INTO settings (`key`, value) VALUES 
('buy_multiplier', 91),   -- USDINR rate for converting BTCUSD to BTCINR for BUY transactions
('sell_multiplier', 88),  -- USDINR rate for converting BTCUSD to BTCINR for SELL transactions
('loan_interest_rate', 15.00);  -- Annual interest rate for loans
```

## Database Migrations

### Migration Files
The following migration files exist in the `/database/migrations/` directory:

1. **003_drop_unused_bitcoin_data_columns.sql**
   - Removes deprecated columns from bitcoin_data table
   - Optimizes table structure for current requirements

2. **004_rename_operations_to_transactions.sql**
   - Renames operations table to transactions
   - Updates related indexes and constraints

3. **005_remove_limit_price_column.sql**
   - Removes redundant limit_price column from transactions table
   - Simplifies schema by using execution_price for both target and actual prices
   - Optimizes limit order handling

4. **add_price_change_pct_to_chart_data.sql**
   - Adds price_change_pct column to bitcoin_chart_data table
   - Enables percentage change calculations for chart displays

### Running Migrations
```sql
-- Apply migration and log it
SOURCE /path/to/migration/file.sql;
INSERT INTO migration_log (migration_file, notes) 
VALUES ('migration_name.sql', 'Description of changes');
```

## Database Seeding

### Admin User Creation
```sql
-- Create admin user with initial balance
-- File: database/seed_admin.sql
INSERT INTO users (email, name, password_hash, is_admin, available_inr, available_btc) 
VALUES (
  'admin@bittrade.com', 
  'Admin User', 
  '$2b$12$hashedpassword', 
  true, 
  1000000,  -- 10,000 INR initial balance
  100000000 -- 1 BTC initial balance
);
```

### Balance Updates
```sql
-- Update admin balances
-- File: database/update_admin_balances.sql
UPDATE users SET 
  available_inr = 5000000,   -- 50,000 INR
  available_btc = 500000000  -- 5 BTC
WHERE is_admin = true;
```

## Query Examples

### User Queries

#### Get User Balance
```sql
SELECT 
  available_inr / 100 as available_rupees,
  available_btc / 100000000.0 as available_btc_decimal,
  reserved_inr / 100 as reserved_rupees,
  reserved_btc / 100000000.0 as reserved_btc_decimal,
  collateral_btc / 100000000.0 as collateral_btc_decimal,
  borrowed_inr / 100 as borrowed_rupees,
  interest_accrued / 100 as interest_rupees
FROM users 
WHERE id = ?;
```

#### Get User Transaction History
```sql
SELECT 
  id,
  type,
  status,
  btc_amount / 100000000.0 as btc_amount_decimal,
  inr_amount / 100 as inr_amount_rupees,
  execution_price,
  created_at,
  executed_at
FROM transactions 
WHERE user_id = ? 
ORDER BY 
  CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END,
  COALESCE(executed_at, created_at) DESC
LIMIT 50;
```

### Market Data Queries

#### Get Current Bitcoin Price with Rates
```sql
SELECT 
  bd.btc_usd_price,
  bd.btc_usd_price * s1.value as buy_rate_inr,
  bd.btc_usd_price * s2.value as sell_rate_inr,
  bd.market_cap_usd,
  bd.volume_24h_usd,
  bd.last_updated
FROM bitcoin_data bd
CROSS JOIN settings s1 ON s1.key = 'buy_multiplier'
CROSS JOIN settings s2 ON s2.key = 'sell_multiplier'
ORDER BY bd.created_at DESC 
LIMIT 1;
```

#### Get Chart Data
```sql
SELECT 
  timeframe,
  JSON_EXTRACT(price_data, '$') as price_points,
  data_points_count,
  price_change_pct,
  date_from,
  date_to,
  last_updated
FROM bitcoin_chart_data 
WHERE timeframe = '1d' 
ORDER BY last_updated DESC 
LIMIT 1;
```

### Trading Queries

#### Execute Trade Transaction
```sql
-- Start transaction
START TRANSACTION;

-- Create transaction record
INSERT INTO transactions (
  user_id, type, status, btc_amount, inr_amount, execution_price, executed_at
) VALUES (
  ?, 'MARKET_BUY', 'EXECUTED', ?, ?, ?, NOW()
);

-- Update user balance (buy order)
UPDATE users SET 
  available_inr = available_inr - ?,
  available_btc = available_btc + ?
WHERE id = ? AND available_inr >= ?;

-- Commit if all operations succeed
COMMIT;
```

### Analytical Queries

#### User Trading Statistics
```sql
SELECT 
  u.name,
  u.email,
  COUNT(t.id) as total_transactions,
  SUM(CASE WHEN t.type LIKE '%BUY' THEN 1 ELSE 0 END) as buy_count,
  SUM(CASE WHEN t.type LIKE '%SELL' THEN 1 ELSE 0 END) as sell_count,
  SUM(t.inr_amount) / 100 as total_inr_volume,
  SUM(t.btc_amount) / 100000000.0 as total_btc_volume
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id AND t.status = 'EXECUTED'
GROUP BY u.id, u.name, u.email
ORDER BY total_inr_volume DESC;
```

#### Daily Trading Volume
```sql
SELECT 
  DATE(executed_at) as trade_date,
  COUNT(*) as transaction_count,
  SUM(inr_amount) / 100 as total_inr_volume,
  SUM(btc_amount) / 100000000.0 as total_btc_volume,
  AVG(execution_price) as avg_execution_price
FROM transactions 
WHERE status = 'EXECUTED' 
  AND executed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(executed_at)
ORDER BY trade_date DESC;
```

## Performance Optimization

### Index Strategy

#### Critical Indexes
```sql
-- User authentication (most frequent)
CREATE INDEX idx_users_email ON users(email);

-- Transaction queries (high frequency)
CREATE INDEX idx_user_transactions ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_status_type ON transactions(status, type);
CREATE INDEX idx_transactions_executed_at ON transactions(executed_at DESC);

-- Market data queries (real-time)
CREATE INDEX idx_bitcoin_data_created_at ON bitcoin_data(created_at DESC);
CREATE INDEX idx_bitcoin_chart_timeframe_updated ON bitcoin_chart_data(timeframe, last_updated DESC);

-- Loan management
CREATE INDEX idx_loans_user_status ON loans(user_id, status);
CREATE INDEX idx_loans_liquidation_price ON loans(liquidation_price, status);
```

#### Composite Indexes
```sql
-- For complex WHERE clauses
CREATE INDEX idx_transactions_user_status_type ON transactions(user_id, status, type);
CREATE INDEX idx_transactions_user_created_executed ON transactions(user_id, created_at, executed_at);
```

### Query Optimization Tips

1. **Use LIMIT wisely**: Always use LIMIT for large result sets
2. **Index Column Order**: Put most selective columns first in composite indexes
3. **Avoid SELECT ***: Select only needed columns
4. **Use EXISTS instead of IN**: For better performance with subqueries
5. **Partition Large Tables**: Consider partitioning by date for transaction history

## Data Integrity Constraints

### Business Logic Constraints
```sql
-- Ensure positive balances (add check constraints)
ALTER TABLE users ADD CONSTRAINT chk_positive_balances 
CHECK (available_inr >= 0 AND available_btc >= 0);

-- Ensure valid transaction amounts
ALTER TABLE transactions ADD CONSTRAINT chk_positive_amounts 
CHECK (btc_amount >= 0 AND inr_amount >= 0);

-- Ensure valid LTV ratios
ALTER TABLE loans ADD CONSTRAINT chk_valid_ltv 
CHECK (ltv_ratio > 0 AND ltv_ratio <= 100);
```

### Foreign Key Cascades
```sql
-- User deletion cascades to related data
ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE loans 
ADD CONSTRAINT fk_loans_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

## Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
# backup_bittrade.sh

DB_NAME="bittrade"
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/bittrade_${DATE}.sql"

# Create backup
mysqldump --single-transaction --routines --triggers \
  --user=backup_user --password=backup_password \
  $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "bittrade_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Cron Job Setup
```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * /path/to/backup_bittrade.sh
```

### Point-in-Time Recovery Setup
```sql
-- Enable binary logging for point-in-time recovery
-- Add to my.cnf:
# log-bin=mysql-bin
# binlog_format=ROW
# expire_logs_days=7
```

### Recovery Examples
```bash
# Full restore from backup
mysql -u root -p bittrade < bittrade_20240720_020000.sql

# Point-in-time recovery
mysqlbinlog --start-datetime="2024-07-20 02:00:00" \
            --stop-datetime="2024-07-20 14:30:00" \
            mysql-bin.000001 | mysql -u root -p bittrade
```

## Monitoring and Maintenance

### Performance Monitoring Queries
```sql
-- Check table sizes
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
  table_rows
FROM information_schema.TABLES 
WHERE table_schema = 'bittrade' 
ORDER BY (data_length + index_length) DESC;

-- Check slow queries
SELECT 
  query_time,
  lock_time,
  rows_sent,
  rows_examined,
  sql_text
FROM mysql.slow_log 
ORDER BY query_time DESC 
LIMIT 10;

-- Index usage statistics
SELECT 
  object_schema,
  object_name,
  index_name,
  count_read,
  count_write,
  count_read + count_write as total_usage
FROM performance_schema.table_io_waits_summary_by_index_usage 
WHERE object_schema = 'bittrade'
ORDER BY total_usage DESC;
```

### Maintenance Tasks
```sql
-- Analyze tables for better query plans
ANALYZE TABLE users, transactions, bitcoin_data;

-- Optimize tables to reclaim space
OPTIMIZE TABLE transactions;

-- Check table integrity
CHECK TABLE users, transactions, loans;

-- Update table statistics
ANALYZE TABLE users, transactions, bitcoin_data, bitcoin_chart_data;
```

## Security Considerations

### Database User Privileges
```sql
-- Create application user with minimal privileges
CREATE USER 'bittrade_app'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON bittrade.* TO 'bittrade_app'@'localhost';

-- Create backup user with read-only access
CREATE USER 'bittrade_backup'@'localhost' IDENTIFIED BY 'backup_password';
GRANT SELECT, LOCK TABLES ON bittrade.* TO 'bittrade_backup'@'localhost';

-- Create analytics user with read-only access
CREATE USER 'bittrade_analytics'@'localhost' IDENTIFIED BY 'analytics_password';
GRANT SELECT ON bittrade.* TO 'bittrade_analytics'@'localhost';
```

### Encryption and Security
```sql
-- Enable SSL connections
-- Add to my.cnf:
# ssl-ca=ca-cert.pem
# ssl-cert=server-cert.pem
# ssl-key=server-key.pem

-- Require SSL for sensitive users
ALTER USER 'bittrade_app'@'localhost' REQUIRE SSL;
```

### Audit Logging
```sql
-- Enable audit logging (MySQL Enterprise)
-- Add to my.cnf:
# plugin-load=audit_log.so
# audit_log_file=audit.log
# audit_log_policy=ALL
```

## Troubleshooting

### Common Issues

#### Connection Issues
```sql
-- Check current connections
SHOW PROCESSLIST;

-- Check connection limits
SHOW VARIABLES LIKE 'max_connections';

-- Check connection usage
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Threads_connected';
```

#### Performance Issues
```sql
-- Check for long-running queries
SELECT 
  id,
  user,
  host,
  db,
  command,
  time,
  state,
  info
FROM information_schema.processlist 
WHERE command != 'Sleep' AND time > 10
ORDER BY time DESC;

-- Check for lock waits
SELECT 
  waiting_pid,
  waiting_query,
  blocking_pid,
  blocking_query
FROM sys.innodb_lock_waits;
```

#### Storage Issues
```sql
-- Check database size
SELECT 
  table_schema,
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) AS db_size_mb
FROM information_schema.tables 
WHERE table_schema = 'bittrade'
GROUP BY table_schema;

-- Check available disk space
SHOW VARIABLES LIKE 'datadir';
-- Then use system command: df -h /path/to/datadir
```

## Best Practices

### Development
1. **Use Transactions**: Always wrap related operations in transactions
2. **Validate Input**: Validate all input data before database operations
3. **Use Prepared Statements**: Prevent SQL injection attacks
4. **Handle Errors Gracefully**: Implement proper error handling and rollback
5. **Test with Real Data**: Use production-like data volumes for testing

### Production
1. **Regular Backups**: Automated daily backups with verification
2. **Monitor Performance**: Set up alerts for slow queries and high load
3. **Update Statistics**: Regular ANALYZE TABLE operations
4. **Archive Old Data**: Implement data archiving for transaction history
5. **Security Updates**: Keep MySQL version updated with security patches

### Schema Changes
1. **Version Control**: Track all schema changes in version control
2. **Migration Scripts**: Use migration scripts for schema updates
3. **Backward Compatibility**: Ensure changes don't break existing code
4. **Test Thoroughly**: Test migrations on copy of production data
5. **Document Changes**: Update documentation for all schema modifications
