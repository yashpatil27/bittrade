#!/usr/bin/env node

// Database Analysis Script
// This script analyzes the BitTrade database to identify:
// 1. Unused columns (never queried in the codebase)
// 2. Columns that are always NULL
// 3. Empty tables

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Set NODE_ENV to development for local analysis
process.env.NODE_ENV = 'development';

// Load environment variables
require('dotenv').config({ path: '.env.development' });

const config = require('./config/config');

// Database schema based on DATABASE_README.md
const tableSchema = {
  users: [
    'id', 'email', 'name', 'password_hash', 'is_admin', 
    'available_inr', 'available_btc', 'reserved_inr', 'reserved_btc',
    'created_at', 'updated_at'
  ],
  transactions: [
    'id', 'user_id', 'type', 'status', 'btc_amount', 'inr_amount',
    'execution_price', 'parent_id', 'dca_plan_id', 'scheduled_at',
    'executed_at', 'expires_at', 'notes', 'created_at'
  ],
  active_plans: [
    'id', 'user_id', 'plan_type', 'status', 'frequency', 
    'amount_per_execution', 'next_execution_at', 'total_executions',
    'remaining_executions', 'max_price', 'min_price',
    'created_at', 'completed_at'
  ],
  loans: [
    'id', 'user_id', 'btc_collateral_amount', 'inr_borrowed_amount',
    'ltv_ratio', 'interest_rate', 'liquidation_price', 'status',
    'created_at', 'repaid_at', 'liquidated_at'
  ],
  settings: [
    'id', 'key', 'value', 'updated_at'
  ],
  bitcoin_data: [
    'id', 'btc_usd_price', 'last_updated', 'created_at'
  ],
  bitcoin_sentiment: [
    'id', 'fear_greed_value', 'fear_greed_classification', 'data_date',
    'last_updated'
  ],
  bitcoin_chart_data: [
    'id', 'timeframe', 'price_data', 'data_points_count',
    'price_change_pct', 'date_from', 'date_to', 'last_updated'
  ],
  migration_log: [
    'id', 'migration_file', 'applied_at', 'notes'
  ]
};

// Columns found in the codebase queries (extracted from manual analysis)
const usedColumns = {
  users: [
    'id', 'email', 'name', 'password_hash', 'is_admin',
    'available_inr', 'available_btc', 'reserved_inr', 'reserved_btc'
  ],
  transactions: [
    'id', 'user_id', 'type', 'status', 'btc_amount', 'inr_amount',
    'execution_price', 'parent_id', 'loan_id', 'created_at',
    'executed_at'
  ],
  active_plans: [
    'id', 'user_id', 'plan_type', 'status', 'frequency',
    'amount_per_execution', 'next_execution_at', 'total_executions',
    'remaining_executions', 'max_price', 'min_price', 'created_at'
  ],
  loans: [
    'id', 'user_id', 'btc_collateral_amount', 'inr_borrowed_amount',
    'ltv_ratio', 'interest_rate', 'liquidation_price', 'status'
  ],
  settings: [
    'key', 'value'
  ],
  bitcoin_data: [
    'btc_usd_price', 'market_cap_usd', 'volume_24h_usd',
    'high_24h_usd', 'ath_usd', 'ath_date', 'ath_change_pct',
    'created_at'
  ],
  bitcoin_sentiment: [
    'fear_greed_value', 'fear_greed_classification', 'data_date'
  ],
  bitcoin_chart_data: [
    'timeframe', 'price_data', 'data_points_count',
    'price_change_pct', 'date_from', 'date_to', 'last_updated'
  ],
  migration_log: [
    'migration_file', 'applied_at', 'notes'
  ]
};

class DatabaseAnalyzer {
  constructor() {
    this.db = null;
  }

  async connect() {
    try {
      this.db = await mysql.createConnection(config.database);
      console.log('✅ Connected to database');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    if (this.db) {
      await this.db.end();
      console.log('🔌 Database disconnected');
    }
  }

  async checkTableExists(tableName) {
    try {
      const [rows] = await this.db.execute(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
        [config.database.database || 'bittrade', tableName]
      );
      return rows[0].count > 0;
    } catch (error) {
      console.warn(`⚠️ Could not check if table ${tableName} exists:`, error.message);
      return false;
    }
  }

  async getTableRowCount(tableName) {
    try {
      const [rows] = await this.db.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      return rows[0].count;
    } catch (error) {
      console.warn(`⚠️ Could not get row count for ${tableName}:`, error.message);
      return -1;
    }
  }

  async checkColumnNullCount(tableName, columnName) {
    try {
      const [totalRows] = await this.db.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      const totalCount = totalRows[0].count;
      
      if (totalCount === 0) {
        return { totalCount: 0, nullCount: 0, nonNullCount: 0, percentNull: 0 };
      }

      const [nullRows] = await this.db.execute(
        `SELECT COUNT(*) as count FROM ${tableName} WHERE ${columnName} IS NULL`
      );
      const nullCount = nullRows[0].count;
      const nonNullCount = totalCount - nullCount;
      const percentNull = totalCount > 0 ? (nullCount / totalCount * 100) : 0;

      return {
        totalCount,
        nullCount,
        nonNullCount,
        percentNull: Math.round(percentNull * 100) / 100
      };
    } catch (error) {
      console.warn(`⚠️ Could not check NULL count for ${tableName}.${columnName}:`, error.message);
      return null;
    }
  }

  identifyUnusedColumns() {
    const unusedColumns = {};
    
    for (const [tableName, schemaColumns] of Object.entries(tableSchema)) {
      const usedCols = usedColumns[tableName] || [];
      const unused = schemaColumns.filter(col => !usedCols.includes(col));
      
      if (unused.length > 0) {
        unusedColumns[tableName] = unused;
      }
    }
    
    return unusedColumns;
  }

  async analyzeDatabase() {
    const results = {
      emptyTables: [],
      unusedColumns: {},
      nullOnlyColumns: [],
      highlyNullColumns: [], // > 90% null
      summary: {}
    };

    console.log('\n🔍 BITTRADE DATABASE ANALYSIS');
    console.log('='.repeat(50));

    // 1. Check for empty tables
    console.log('\n📊 Checking table row counts...');
    for (const tableName of Object.keys(tableSchema)) {
      const exists = await this.checkTableExists(tableName);
      if (!exists) {
        console.log(`⚠️ Table ${tableName} does not exist in database`);
        continue;
      }

      const rowCount = await this.getTableRowCount(tableName);
      if (rowCount === 0) {
        results.emptyTables.push(tableName);
        console.log(`📭 EMPTY TABLE: ${tableName}`);
      } else {
        console.log(`📈 ${tableName}: ${rowCount.toLocaleString()} rows`);
      }
    }

    // 2. Identify unused columns (based on code analysis)
    console.log('\n🔍 Identifying unused columns...');
    results.unusedColumns = this.identifyUnusedColumns();
    
    for (const [tableName, columns] of Object.entries(results.unusedColumns)) {
      console.log(`🚫 UNUSED COLUMNS in ${tableName}:`);
      columns.forEach(col => console.log(`   - ${col}`));
    }

    // 3. Check for columns that are always NULL or highly NULL
    console.log('\n🕳️ Checking for NULL-heavy columns...');
    
    for (const [tableName, columns] of Object.entries(tableSchema)) {
      const exists = await this.checkTableExists(tableName);
      if (!exists) continue;

      const rowCount = await this.getTableRowCount(tableName);
      if (rowCount === 0) continue;

      console.log(`\n📋 Analyzing ${tableName}:`);

      for (const columnName of columns) {
        const nullStats = await this.checkColumnNullCount(tableName, columnName);
        if (!nullStats) continue;

        if (nullStats.nullCount === nullStats.totalCount && nullStats.totalCount > 0) {
          // 100% NULL
          results.nullOnlyColumns.push(`${tableName}.${columnName}`);
          console.log(`   ❌ ${columnName}: 100% NULL (${nullStats.totalCount} rows)`);
        } else if (nullStats.percentNull > 90 && nullStats.totalCount > 0) {
          // > 90% NULL
          results.highlyNullColumns.push({
            table: tableName,
            column: columnName,
            percentNull: nullStats.percentNull,
            nullCount: nullStats.nullCount,
            totalCount: nullStats.totalCount
          });
          console.log(`   ⚠️ ${columnName}: ${nullStats.percentNull}% NULL (${nullStats.nullCount}/${nullStats.totalCount})`);
        } else if (nullStats.percentNull > 0) {
          console.log(`   ✅ ${columnName}: ${nullStats.percentNull}% NULL (${nullStats.nullCount}/${nullStats.totalCount})`);
        } else {
          console.log(`   ✅ ${columnName}: No NULLs`);
        }
      }
    }

    // Generate summary
    results.summary = {
      totalTables: Object.keys(tableSchema).length,
      emptyTableCount: results.emptyTables.length,
      tablesWithUnusedColumns: Object.keys(results.unusedColumns).length,
      totalUnusedColumns: Object.values(results.unusedColumns).reduce((sum, cols) => sum + cols.length, 0),
      nullOnlyColumnCount: results.nullOnlyColumns.length,
      highlyNullColumnCount: results.highlyNullColumns.length
    };

    return results;
  }

  printSummaryReport(results) {
    console.log('\n📋 SUMMARY REPORT');
    console.log('='.repeat(50));
    
    console.log(`📊 Total tables analyzed: ${results.summary.totalTables}`);
    console.log(`📭 Empty tables: ${results.summary.emptyTableCount}`);
    console.log(`🚫 Tables with unused columns: ${results.summary.tablesWithUnusedColumns}`);
    console.log(`🔍 Total unused columns: ${results.summary.totalUnusedColumns}`);
    console.log(`❌ Columns that are 100% NULL: ${results.summary.nullOnlyColumnCount}`);
    console.log(`⚠️ Columns that are >90% NULL: ${results.summary.highlyNullColumnCount}`);

    if (results.emptyTables.length > 0) {
      console.log('\n📭 EMPTY TABLES:');
      results.emptyTables.forEach(table => console.log(`   - ${table}`));
    }

    if (results.nullOnlyColumns.length > 0) {
      console.log('\n❌ 100% NULL COLUMNS (can be dropped):');
      results.nullOnlyColumns.forEach(column => console.log(`   - ${column}`));
    }

    if (results.highlyNullColumns.length > 0) {
      console.log('\n⚠️ HIGHLY NULL COLUMNS (>90% NULL):');
      results.highlyNullColumns.forEach(col => 
        console.log(`   - ${col.table}.${col.column} (${col.percentNull}% NULL)`)
      );
    }

    console.log('\n💡 RECOMMENDATIONS:');
    
    if (results.summary.totalUnusedColumns > 0) {
      console.log('   • Consider removing unused columns to reduce schema complexity');
    }
    
    if (results.summary.nullOnlyColumnCount > 0) {
      console.log('   • Drop 100% NULL columns immediately - they serve no purpose');
    }
    
    if (results.summary.highlyNullColumnCount > 0) {
      console.log('   • Review highly NULL columns - consider if they are needed');
    }
    
    if (results.summary.emptyTableCount > 0) {
      console.log('   • Empty tables may be unused or waiting for data');
    }
    
    if (results.summary.totalUnusedColumns === 0 && results.summary.nullOnlyColumnCount === 0 && results.summary.emptyTableCount === 0) {
      console.log('   ✅ Database schema looks lean and well-utilized!');
    }
  }
}

async function main() {
  const analyzer = new DatabaseAnalyzer();
  
  try {
    await analyzer.connect();
    const results = await analyzer.analyzeDatabase();
    analyzer.printSummaryReport(results);
    
    // Save detailed results to file
    const outputPath = path.join(__dirname, 'database_analysis_report.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed report saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    await analyzer.disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Analysis interrupted');
  process.exit(0);
});

// Run the analysis
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabaseAnalyzer;
