#!/usr/bin/env node
/**
 * Script to empty the transactions table
 * This will remove all transaction records from the database
 */

const mysql = require('mysql2/promise');
const config = require('./config/config');

async function emptyTransactionsTable() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    // Create database connection
    connection = await mysql.createConnection(config.database);
    
    console.log('✅ Connected to database');
    
    // Get current count
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM transactions');
    const currentCount = countResult[0].count;
    
    console.log(`📊 Current transactions count: ${currentCount}`);
    
    if (currentCount === 0) {
      console.log('ℹ️  Transactions table is already empty');
      return;
    }
    
    // Confirm deletion
    console.log('⚠️  About to delete all transactions...');
    
    // Empty the transactions table
    const [result] = await connection.execute('DELETE FROM transactions');
    
    console.log(`✅ Successfully deleted ${result.affectedRows} transactions`);
    
    // Reset auto-increment counter
    await connection.execute('ALTER TABLE transactions AUTO_INCREMENT = 1');
    console.log('✅ Reset auto-increment counter');
    
    // Verify table is empty
    const [verifyResult] = await connection.execute('SELECT COUNT(*) as count FROM transactions');
    const finalCount = verifyResult[0].count;
    
    console.log(`📊 Final transactions count: ${finalCount}`);
    
    if (finalCount === 0) {
      console.log('🎉 Transactions table successfully emptied!');
    } else {
      console.log('❌ Warning: Table may not be completely empty');
    }
    
  } catch (error) {
    console.error('❌ Error emptying transactions table:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  emptyTransactionsTable().then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = emptyTransactionsTable;
