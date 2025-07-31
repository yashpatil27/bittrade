#!/usr/bin/env node

/**
 * Apply UTC Timestamp Migration
 * 
 * This script applies the 006_utc_timestamp_migration.sql to convert
 * the database schema from MySQL CURRENT_TIMESTAMP defaults to NOT NULL
 * columns that will be populated by JavaScript-generated UTC timestamps.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const config = require('../server/config/config');

async function applyMigration() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(config.database);
    console.log('✅ Database connected successfully');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/006_utc_timestamp_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded:', migrationPath);
    
    // Check if migration was already applied
    try {
      const [existing] = await connection.execute(
        "SELECT id FROM migration_log WHERE migration_file = '006_utc_timestamp_migration.sql'"
      );
      
      if (existing.length > 0) {
        console.log('⚠️  Migration already applied. Skipping...');
        return;
      }
    } catch (error) {
      console.log('ℹ️  Migration log table might not exist yet, proceeding...');
    }
    
    // Split SQL into individual statements (excluding empty lines and comments)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        // Remove empty statements and comment-only statements
        if (stmt.length === 0) return false;
        if (stmt.startsWith('--')) return false;
        // Remove statements that are only comments or whitespace
        const cleanStmt = stmt.replace(/--.*$/gm, '').trim();
        return cleanStmt.length > 0;
      })
      .map(stmt => {
        // Clean up statements by removing comments
        return stmt.replace(/--.*$/gm, '').trim();
      });
    
    console.log(`🚀 Applying ${statements.length} migration statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          console.log(`   ${i + 1}/${statements.length}: Executing statement...`);
          await connection.execute(statement);
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`   ❌ Error executing statement ${i + 1}:`, error.message);
          console.log(`   Statement: ${statement.substring(0, 100)}...`);
          throw error;
        }
      }
    }
    
    console.log('✅ UTC timestamp migration applied successfully!');
    console.log('');
    console.log('📝 What was changed:');
    console.log('   • All TIMESTAMP columns changed from DEFAULT CURRENT_TIMESTAMP to NOT NULL');
    console.log('   • Application will now use JavaScript-generated UTC timestamps');
    console.log('   • Existing timestamps remain unchanged');
    console.log('   • All new records will use consistent UTC timestamps');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔗 Database connection closed');
    }
  }
}

// Main execution
if (require.main === module) {
  applyMigration().catch(console.error);
}

module.exports = applyMigration;
