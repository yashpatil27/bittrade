// Quick database connection test with automatic cleanup
const mysql = require('mysql2/promise');
const config = require('../server/config/config');

async function testConnection() {
  let connection;
  try {
    connection = await mysql.createConnection(config.database);
    console.log('SUCCESS');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.log('FAILED: ' + err.message);
    if (connection) {
      try { await connection.end(); } catch(e) {}
    }
    process.exit(1);
  }
}

// Set timeout to prevent hanging
setTimeout(() => {
  console.log('TIMEOUT');
  process.exit(1);
}, 5000);

testConnection();
