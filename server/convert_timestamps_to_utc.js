const mysql = require('mysql2/promise');
const config = require('./config/config');

async function convertTimestampsToUTC() {
  let db;
  
  try {
    db = await mysql.createConnection(config.database);
    console.log('🔌 Connected to database');
    
    // First, let's see what we have
    const [existing] = await db.execute(`
      SELECT id, created_at, executed_at, status 
      FROM transactions 
      ORDER BY created_at DESC
    `);
    
    console.log(`\n📊 Found ${existing.length} transactions to analyze:`);
    
    existing.forEach(row => {
      console.log(`   ID ${row.id}: created_at=${row.created_at}, executed_at=${row.executed_at}, status=${row.status}`);
    });
    
    if (existing.length === 0) {
      console.log('ℹ️  No transactions found to convert');
      return;
    }
    
    // The existing transactions may have been stored in local time
    // Since MySQL DATETIME fields don't store timezone info, we need to assume
    // they were stored in the server's local timezone and convert them
    
    console.log('\n🔄 Converting timestamps to UTC...');
    
    // Note: This conversion assumes the original timestamps were stored in 
    // the server's local timezone (PDT/PST in this case, which is UTC-7 or UTC-8)
    // We'll add 7 hours (PDT offset) to convert to UTC
    
    // First update created_at timestamps
    const [updateCreated] = await db.execute(`
      UPDATE transactions 
      SET created_at = DATE_ADD(created_at, INTERVAL 7 HOUR)
      WHERE created_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${updateCreated.affectedRows} created_at timestamps`);
    
    // Then update executed_at timestamps
    const [updateExecuted] = await db.execute(`
      UPDATE transactions 
      SET executed_at = DATE_ADD(executed_at, INTERVAL 7 HOUR)
      WHERE executed_at IS NOT NULL
    `);
    
    console.log(`✅ Updated ${updateExecuted.affectedRows} executed_at timestamps`);
    
    // Show the updated timestamps
    const [updated] = await db.execute(`
      SELECT id, created_at, executed_at, status 
      FROM transactions 
      ORDER BY created_at DESC
    `);
    
    console.log(`\n📊 Updated transactions:`);
    updated.forEach(row => {
      console.log(`   ID ${row.id}: created_at=${row.created_at}, executed_at=${row.executed_at}, status=${row.status}`);
    });
    
    console.log('\n✅ Timestamp conversion completed!');
    console.log('ℹ️  All timestamps should now be in UTC format');
    
  } catch (error) {
    console.error('❌ Error converting timestamps:', error);
  } finally {
    if (db) {
      await db.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the conversion
if (require.main === module) {
  convertTimestampsToUTC().catch(console.error);
}

module.exports = convertTimestampsToUTC;
