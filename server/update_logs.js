const fs = require('fs');
const path = require('path');

// Read the server.js file
const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// Define replacements for common patterns
const replacements = [
  // WebSocket logs
  [/console\.log\(`📡 Client connected: \${socket\.id}\`\);/, "logger.websocket('connect', `client connected: ${socket.id}`);"],
  [/console\.log\(`📡 Client disconnected: \${socket\.id} \(\${reason}\)\`\);/, "logger.websocket('disconnect', `client disconnected: ${socket.id} (${reason})`);"],
  [/console\.log\(`🔐 User authenticated: \${decoded\.email} \(\${socket\.id}\)\`\);/, "logger.auth('authenticated', decoded.id, decoded.email);"],
  [/console\.error\(`📡 Socket error for \${socket\.id}:`, error\);/, "logger.error('Socket error', error, 'WS');"],
  [/console\.log\(`🔄 Sent cached Bitcoin price to \${socket\.id}: \$\${bitcoinData\.btc_usd_price}\`\);/, "logger.bitcoin('price_sent', bitcoinData.btc_usd_price, `to ${socket.id}`);"],
  
  // Balance logs
  [/console\.log\('🔍 Balance request - req\.user:', req\.user\);/, "logger.debug('Balance request received', { component: 'API', user: req.user.id });"],
  [/console\.log\('🔍 Balance request - userId:', userId\);/, "// userId already logged above"],
  [/console\.error\('❌ UserId is undefined in balance request'\);/, "logger.error('UserId is undefined in balance request', null, 'API');"],
  [/console\.log\('💾 Balance served from Redis cache:', redisKey\);/, "logger.cache('SERVE', redisKey, true);"],
  [/console\.error\('Redis error, falling back to database:', redisError\);/, "logger.warn('Redis error, falling back to database', 'CACHE');"],
  [/console\.log\('💾 Balance cached in Redis:', redisKey\);/, "logger.cache('STORE', redisKey);"],
  [/console\.error\('Error caching balance in Redis:', redisError\);/, "logger.error('Error caching balance in Redis', redisError, 'CACHE');"],
  
  // Transaction logs
  [/console\.log\(`💳 Sending \${transactionData\.length} transactions for user \${userId}\`\);/, "logger.info(`Sending ${transactionData.length} transactions`, 'WS');"],
  [/console\.log\(`💾 Transaction data cached in Redis: \${redisKey}\`\);/, "logger.cache('STORE', redisKey);"],
  [/console\.error\('Error caching transaction data in Redis:', redisError\);/, "logger.error('Error caching transaction data', redisError, 'CACHE');"],
  
  // WebSocket update logs
  [/console\.log\(`🔍 Sending balance update for userId: \${userId}\`\);/, "logger.debug('Sending balance update', { component: 'WS', user: userId });"],
  [/console\.log\(`❌ User \${userId} not found for balance update\`\);/, "logger.warn(`User ${userId} not found for balance update`, 'WS');"],
  [/console\.log\(`💰 Sending balance update for user \${userId}:`, balanceData\);/, "logger.info('Sending balance update', 'WS');"],
  [/console\.log\(`💾 Balance cache updated in Redis: \${redisKey}\`\);/, "logger.cache('UPDATE', redisKey);"],
  [/console\.error\('Error updating balance cache in Redis:', redisError\);/, "logger.error('Error updating balance cache', redisError, 'CACHE');"],
  [/console\.log\(`📡 Balance update sent to \${userSocketSet\.size} client\(s\) for user \${userId}\`\);/, "logger.websocket('balance_update', `sent to ${userSocketSet.size} clients`, userId);"],
  [/console\.log\(`⚠️  No active connections for user \${userId}\`\);/, "logger.debug(`No active connections for user ${userId}`, { component: 'WS' });"],
  [/console\.error\(`Error sending balance update for user \${userId}:`, error\);/, "logger.error(`Error sending balance update for user ${userId}`, error, 'WS');"],
  
  // More transaction logs
  [/console\.error\('❌ sendUserTransactionUpdate: userId is undefined'\);/, "logger.error('sendUserTransactionUpdate: userId is undefined', null, 'WS');"],
  [/console\.log\(`🔍 Sending transaction update for userId: \${userId}\`\);/, "logger.debug('Sending transaction update', { component: 'WS', user: userId });"],
  [/console\.log\(`📡 Transaction update sent to \${userSocketSet\.size} client\(s\) for user \${userId}\`\);/, "logger.websocket('transaction_update', `sent to ${userSocketSet.size} clients`, userId);"],
  [/console\.error\(`Error sending transaction update for user \${userId}:`, error\);/, "logger.error(`Error sending transaction update for user ${userId}`, error, 'WS');"],
  
  // DCA logs  
  [/console\.error\('❌ sendUserDCAPlansUpdate: userId is undefined'\);/, "logger.error('sendUserDCAPlansUpdate: userId is undefined', null, 'WS');"],
  [/console\.log\(`🔍 Sending DCA plans update for userId: \${userId}\`\);/, "logger.debug('Sending DCA plans update', { component: 'WS', user: userId });"],
  [/console\.log\(`📋 Sending \${allPlansCount\[0\]\.total_count} DCA plans for user \${userId} \(\${activePlans} active, \${pausedPlans} paused\)\`\);/, "logger.info(`Sending ${allPlansCount[0].total_count} DCA plans`, 'WS');"],
  [/console\.log\(`💾 DCA plans data cached in Redis: \${redisKey}\`\);/, "logger.cache('STORE', redisKey);"],
  [/console\.error\('Error caching DCA plans data in Redis:', redisError\);/, "logger.error('Error caching DCA plans data', redisError, 'CACHE');"],
  [/console\.log\(`📡 DCA plans update sent to \${userSocketSet\.size} client\(s\) for user \${userId}\`\);/, "logger.websocket('dca_plans_update', `sent to ${userSocketSet.size} clients`, userId);"],
  [/console\.error\(`Error sending DCA plans update for user \${userId}:`, error\);/, "logger.error(`Error sending DCA plans update for user ${userId}`, error, 'WS');"],
  
  // Admin logs
  [/console\.log\('🔍 Sending admin transaction update'\);/, "logger.debug('Sending admin transaction update', { component: 'WS' });"],
  [/console\.log\(`📊 Sending \${transactions\.length} admin transactions\`\);/, "logger.info(`Sending ${transactions.length} admin transactions`, 'WS');"],
  [/console\.log\(`📡 Admin transaction update sent to \${socketSet\.size} client\(s\) for admin \${userId}\`\);/, "logger.websocket('admin_transaction_update', `sent to ${socketSet.size} clients`, userId);"],
  [/console\.error\(`Error checking admin status for user \${userId}:`, error\);/, "logger.error(`Error checking admin status for user ${userId}`, error, 'WS');"],
  [/console\.error\('Error sending admin transaction update:', error\);/, "logger.error('Error sending admin transaction update', error, 'WS');"],
  
  // More admin logs
  [/console\.log\('🔍 Sending admin DCA plans update to all admin users'\);/, "logger.debug('Sending admin DCA plans update', { component: 'WS' });"],
  [/console\.log\(`📋 Sending \${plansWithPerformance\.length} DCA plans to admin users\`\);/, "logger.info(`Sending ${plansWithPerformance.length} DCA plans to admins`, 'WS');"],
  [/console\.log\(`📡 Admin DCA plans update sent to \${socketSet\.size} client\(s\) for admin \${userId}\`\);/, "logger.websocket('admin_dca_plans_update', `sent to ${socketSet.size} clients`, userId);"],
  [/console\.error\('Error sending admin DCA plans update:', error\);/, "logger.error('Error sending admin DCA plans update', error, 'WS');"],
  
  // User admin logs
  [/console\.log\('🔍 Sending admin user update to all admin users'\);/, "logger.debug('Sending admin user update', { component: 'WS' });"],
  [/console\.log\(`📊 Sending \${users\.length} users to admin clients\`\);/, "logger.info(`Sending ${users.length} users to admin clients`, 'WS');"],
  [/console\.log\(`📡 Admin user update sent to \${socketSet\.size} client\(s\) for admin \${userId}\`\);/, "logger.websocket('admin_user_update', `sent to ${socketSet.size} clients`, userId);"],
  [/console\.error\('Error sending admin user update:', error\);/, "logger.error('Error sending admin user update', error, 'WS');"],
  
  // Error logs
  [/console\.error\(`Error fetching performance for plan \${plan\.id}:`, error\);/, "logger.error(`Error fetching performance for plan ${plan.id}`, error, 'DB');"],
  [/console\.error\('Error fetching transactions:', error\);/, "logger.error('Error fetching transactions', error, 'API');"],
  [/console\.error\('Error creating order:', error\);/, "logger.error('Error creating order', error, 'API');"],
  [/console\.error\('Error fetching DCA plans:', error\);/, "logger.error('Error fetching DCA plans', error, 'API');"],
  [/console\.error\('Error creating DCA plan:', error\);/, "logger.error('Error creating DCA plan', error, 'API');"],
  [/console\.error\('Error updating DCA plan status:', error\);/, "logger.error('Error updating DCA plan status', error, 'API');"],
  [/console\.error\('Error deleting DCA plan:', error\);/, "logger.error('Error deleting DCA plan', error, 'API');"],
  [/console\.error\('Error cancelling limit order:', error\);/, "logger.error('Error cancelling limit order', error, 'API');"],
  [/console\.error\('Error executing trade:', error\);/, "logger.error('Error executing trade', error, 'API');"],
  [/console\.error\('Error executing send transaction:', error\);/, "logger.error('Error executing send transaction', error, 'API');"],
  [/console\.error\('Error fetching balance:', error\);/, "logger.error('Error fetching balance', error, 'API');"],
  [/console\.error\(err\.stack\);/, "logger.error('Application error', err);"],
  
  // Server startup logs
  [/console\.log\(`🚀 BitTrade API Server running on port \${PORT}\`\);/, "logger.server(`BitTrade API Server running on port ${PORT}`);"],
  [/console\.log\(`📱 Server accessible at:`\);/, "logger.info('Server accessible at:');"],
  [/console\.log\(`\[SERVER\]    - http:\/\/localhost:\${PORT}\`\);/, "logger.info(`  http://localhost:${PORT}`);"],
  [/console\.log\(`\[SERVER\]    - http:\/\/0\.0\.0\.0:\${PORT}\`\);/, "logger.info(`  http://0.0.0.0:${PORT}`);"],
  [/console\.log\(`\[SERVER\]    - http:\/\/\${networkIP}:\${PORT}\`\);/, "logger.info(`  http://${networkIP}:${PORT}`);"],
  [/console\.log\(`\[SERVER\] 🏥 Health check: http:\/\/localhost:\${PORT}\/api\/health\`\);/, "logger.info(`Health check: http://localhost:${PORT}/api/health`);"],
  [/console\.log\(`🌐 WebSocket server ready for real-time data broadcasting\`\);/, "logger.websocket('server_ready', 'WebSocket server ready for broadcasting');"],
  [/console\.log\(`📡 WebSocket 'btc_price_update' broadcasts enabled\`\);/, "logger.websocket('broadcasts_enabled', 'btc_price_update events enabled');"],
  [/console\.log\(`📡 Connected clients: \${io\.engine\.clientsCount}\`\);/, "logger.websocket('clients_connected', `${io.engine.clientsCount} clients connected`);"],
  
  // Shutdown logs
  [/console\.log\('\\n🛑 Shutting down server\.\.\.'\);/, "logger.server('Shutting down server...');"],
  [/console\.error\('Uncaught Exception:', err\);/, "logger.error('Uncaught Exception', err);"],
  [/console\.error\('Unhandled Rejection:', err\);/, "logger.error('Unhandled Rejection', err);"],
  [/startAllServices\(\)\.catch\(console\.error\);/, "startAllServices().catch(err => logger.error('Failed to start services', err));"],
  
  // Remaining verbose logs
  [/console\.log\(`✅ LIMIT order created:`, \{[\s\S]*?\}\);/, "logger.success('Limit order created', 'ORDER');"],
  [/console\.log\(`✅ DCA plan resumed with new execution time:`, \{[\s\S]*?\}\);/, "logger.success('DCA plan resumed', 'DCA');"],
  [/console\.log\(`✅ DCA plan paused:`, \{[\s\S]*?\}\);/, "logger.success('DCA plan paused', 'DCA');"],
  [/console\.log\(`✅ DCA plan deleted:`, \{[\s\S]*?\}\);/, "logger.success('DCA plan deleted', 'DCA');"],
  [/console\.log\(`💰 Released ₹\${transaction\.inr_amount} from cancelled limit buy order \(User \${userId}\)\`\);/, "logger.info('Released funds from cancelled buy order', 'ORDER');"],
  [/console\.log\(`₿ Released \${transaction\.btc_amount} satoshis from cancelled limit sell order \(User \${userId}\)\`\);/, "logger.info('Released funds from cancelled sell order', 'ORDER');"],
  [/console\.log\('🔄 Refreshed pending limit orders cache after cancellation'\);/, "logger.info('Refreshed pending limit orders cache', 'CACHE');"],
  [/console\.error\('Error refreshing limit orders cache:', redisError\);/, "logger.error('Error refreshing limit orders cache', redisError, 'CACHE');"],
  [/console\.log\('💾 Cleared user caches after order cancellation'\);/, "logger.cache('CLEAR', 'user_caches');"],
  [/console\.error\('Error clearing user caches:', error\);/, "logger.error('Error clearing user caches', error, 'CACHE');"],
  [/console\.log\(`✅ LIMIT order cancelled:`, \{[\s\S]*?\}\);/, "logger.success('Limit order cancelled', 'ORDER');"],
  [/console\.error\('Redis error, falling back to database for price:', redisError\);/, "logger.warn('Redis error, falling back to database for price', 'CACHE');"],
  [/console\.log\('💾 Cleared user caches after trade execution'\);/, "logger.cache('CLEAR', 'user_caches');"],
  [/console\.error\('Error clearing user caches:', error\);/, "logger.error('Error clearing user caches', error, 'CACHE');"],
  [/console\.log\(`✅ MARKET \${action\.toUpperCase\(\)} executed:`, \{[\s\S]*?\}\);/, "logger.success(`Market ${action} executed`, 'TRADE');"],
  [/console\.log\('💾 Cleared user caches after send transaction'\);/, "logger.cache('CLEAR', 'user_caches');"],
  [/console\.log\(`✅ SEND transaction executed:`, \{[\s\S]*?\}\);/, "logger.success('Send transaction executed', 'TRANSFER');"]
];

// Apply all replacements
replacements.forEach(([search, replace]) => {
  content = content.replace(search, replace);
});

// Write the updated content back to the file
fs.writeFileSync(serverPath, content, 'utf8');

console.log('✅ Updated all console.log statements in server.js');
