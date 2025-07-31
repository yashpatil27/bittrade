const mysql = require('mysql2/promise');
const config = require('../config/config');

class DCAExecutionService {
  constructor() {
    this.db = null;
    this.isRunning = false;
    this.currentTimeout = null;
    this.settings = { buy_multiplier: 91, sell_multiplier: 88 }; // Default settings
  }

  async start() {
    if (this.isRunning) {
      console.log('DCA Execution Service is already running');
      return;
    }

    try {
      // Initialize database connection
      this.db = await mysql.createConnection(config.database);
      console.log('DCA Execution Service: Database connected');
      
      this.isRunning = true;
      console.log('🔄 DCA Execution Service started');
      
      // Load settings from database
      await this.loadSettings();
      
      // Start the scheduling loop
      await this.scheduleNextExecution();
      
    } catch (error) {
      console.error('Failed to start DCA Execution Service:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Clear any pending timeout
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    
    // Close database connection
    if (this.db) {
      await this.db.end();
      this.db = null;
    }
    
    console.log('🛑 DCA Execution Service stopped');
  }

  async scheduleNextExecution() {
    // Get next execution time from all ACTIVE plans
    const [rows] = await this.db.execute(
      'SELECT MIN(next_execution_at) as next_execution FROM active_plans WHERE status = ?',
      ['ACTIVE']
    );
    
    const nextExecution = rows[0]?.next_execution;
    const now = new Date();
    
    let timeoutMs;
    if (!nextExecution) {
      // No active plans, check again in 1 hour
      timeoutMs = 60 * 60 * 1000; // 1 hour
    } else {
      const timeUntilExecution = new Date(nextExecution).getTime() - now.getTime();
      // Cap at 1 hour maximum
      timeoutMs = Math.min(Math.max(timeUntilExecution, 0), 60 * 60 * 1000);
    }
    
    this.currentTimeout = setTimeout(async () => {
      await this.executeDuePlans();
      await this.scheduleNextExecution(); // Reschedule
    }, timeoutMs);
  }

  async executeDuePlans() {
    const [plans] = await this.db.execute(
      'SELECT id, user_id, plan_type, frequency, amount_per_execution, max_price, min_price \
       FROM active_plans WHERE next_execution_at <= UTC_TIMESTAMP() AND status = ?',
      ['ACTIVE']
    );
    
    console.log(`📊 Found ${plans.length} DCA plans due for execution`);
    
    for (const plan of plans) {
      try {
        console.log(`🔄 Executing DCA plan ${plan.id} for user ${plan.user_id}`);
        
        // Execute the actual trade
        const tradeResult = await this.executeTrade(plan);
        
        if (tradeResult.success) {
          // Update next execution time only if trade was successful
          await this.updateNextExecutionTime(plan);
          
          // Notify user about execution
          await this.sendUserTransactionUpdate(plan.user_id);
          await this.sendUserBalanceUpdate(plan.user_id);
          
          console.log(`✅ DCA plan ${plan.id} executed successfully`);
        } else {
          console.log(`❌ DCA plan ${plan.id} execution failed: ${tradeResult.error}`);
        }
  
      } catch (error) {
        console.error(`Failed to execute DCA plan ${plan.id} for user ${plan.user_id}:`, error);
        // Optional: Could pause the plan on persistent failure
        // await this.db.execute('UPDATE active_plans SET status = "PAUSED" WHERE id = ?', [plan.id]);
      }
    }
  }

  async updateNextExecutionTime(plan) {
    let nextExecutionSQL;
    switch (plan.frequency) {
      case 'HOURLY':
        nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR)';
        break;
      case 'DAILY':
        nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY)';
        break;
      case 'WEEKLY':
        nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 WEEK)';
        break;
      case 'MONTHLY':
        nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 MONTH)';
        break;
      default:
        nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR)'; // Default to 1 hour
    }

    await this.db.execute(
      `UPDATE active_plans SET next_execution_at = ${nextExecutionSQL}, remaining_executions = remaining_executions - 1 \
       WHERE id = ? AND (remaining_executions > 0 OR remaining_executions IS NULL)`,
      [plan.id]
    );

    console.log(`Next execution time updated for plan ${plan.id}`);
  }

  async sendUserTransactionUpdate(userId) {
    console.log(`Placeholder: Send transaction update to user ${userId}`);
  }

  async executeTrade(plan) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      await connection.beginTransaction();
      
      // Get current user balance
      const [userRows] = await connection.execute(
        'SELECT available_inr, available_btc FROM users WHERE id = ?',
        [plan.user_id]
      );
      
      if (userRows.length === 0) {
        await connection.rollback();
        return { success: false, error: 'User not found' };
      }
      
      const user = userRows[0];
      
      // Get current Bitcoin price
      const [priceRows] = await connection.execute(
        'SELECT btc_usd_price FROM bitcoin_data ORDER BY id DESC LIMIT 1'
      );
      
      if (priceRows.length === 0) {
        await connection.rollback();
        return { success: false, error: 'Bitcoin price data not available' };
      }
      
      const btcUsdPrice = priceRows[0].btc_usd_price;
      const { buy_rate_inr, sell_rate_inr } = this.calculateRates(btcUsdPrice);
      const currentPrice = (plan.plan_type === 'DCA_BUY') ? buy_rate_inr : sell_rate_inr;
      
      // Check price limits if set
      if (plan.max_price && currentPrice > plan.max_price) {
        await connection.rollback();
        return { success: false, error: `Price ${currentPrice} exceeds max price ${plan.max_price}` };
      }
      
      if (plan.min_price && currentPrice < plan.min_price) {
        await connection.rollback();
        return { success: false, error: `Price ${currentPrice} below min price ${plan.min_price}` };
      }
      
      if (plan.plan_type === 'DCA_BUY') {
        // Check if user has sufficient INR balance
        if (user.available_inr < plan.amount_per_execution) {
          await connection.rollback();
          return { 
            success: false, 
            error: `Insufficient INR balance. Available: ₹${user.available_inr}, Required: ₹${plan.amount_per_execution}` 
          };
        }
        
        // Calculate BTC amount (price is in paise, amount is in paise)
        // BTC amount in satoshis = (INR amount in paise * 100,000,000) / (price in paise)
        const btcAmountSatoshis = Math.floor((plan.amount_per_execution * 100000000) / currentPrice);
        
        // Update user balances
        await connection.execute(
          'UPDATE users SET available_inr = available_inr - ?, available_btc = available_btc + ? WHERE id = ?',
          [plan.amount_per_execution, btcAmountSatoshis, plan.user_id]
        );
        
        // Create transaction record
        await connection.execute(
          `INSERT INTO transactions (
            user_id, type, inr_amount, btc_amount, execution_price, 
            status, executed_at, dca_plan_id
          ) VALUES (?, 'DCA_BUY', ?, ?, ?, 'EXECUTED', UTC_TIMESTAMP(), ?)`,
          [plan.user_id, plan.amount_per_execution, btcAmountSatoshis, currentPrice, plan.id]
        );
        
        await connection.commit();
        
        console.log(`💰 DCA BUY executed: User ${plan.user_id} bought ${btcAmountSatoshis} satoshis for ₹${plan.amount_per_execution} at ₹${currentPrice}/BTC`);
        
        return { success: true, btcAmount: btcAmountSatoshis, price: currentPrice };
        
      } else if (plan.plan_type === 'DCA_SELL') {
        // Calculate BTC amount to sell for the target INR amount
        const btcAmountSatoshis = Math.floor((plan.amount_per_execution * 100000000) / currentPrice);
        
        // Check if user has sufficient BTC balance
        if (user.available_btc < btcAmountSatoshis) {
          await connection.rollback();
          return { 
            success: false, 
            error: `Insufficient BTC balance. Available: ${user.available_btc} satoshis, Required: ${btcAmountSatoshis} satoshis` 
          };
        }
        
        // Update user balances
        await connection.execute(
          'UPDATE users SET available_btc = available_btc - ?, available_inr = available_inr + ? WHERE id = ?',
          [btcAmountSatoshis, plan.amount_per_execution, plan.user_id]
        );
        
        // Create transaction record
        await connection.execute(
          `INSERT INTO transactions (
            user_id, type, inr_amount, btc_amount, execution_price, 
            status, executed_at, dca_plan_id
          ) VALUES (?, 'DCA_SELL', ?, ?, ?, 'EXECUTED', UTC_TIMESTAMP(), ?)`,
          [plan.user_id, plan.amount_per_execution, btcAmountSatoshis, currentPrice, plan.id]
        );
        
        await connection.commit();
        
        console.log(`💰 DCA SELL executed: User ${plan.user_id} sold ${btcAmountSatoshis} satoshis for ₹${plan.amount_per_execution} at ₹${currentPrice}/BTC`);
        
        return { success: true, btcAmount: btcAmountSatoshis, price: currentPrice };
      }
      
    } catch (error) {
      await connection.rollback();
      console.error('Trade execution error:', error);
      return { success: false, error: error.message };
    } finally {
      await connection.end();
    }
  }

  async sendUserTransactionUpdate(userId) {
    // Use global broadcast functions if available
    if (global.sendUserTransactionUpdate) {
      await global.sendUserTransactionUpdate(userId);
    } else {
      console.log(`📨 Send transaction update to user ${userId}`);
    }
  }

  async sendUserBalanceUpdate(userId) {
    // Use global broadcast functions if available
    if (global.sendUserBalanceUpdate) {
      await global.sendUserBalanceUpdate(userId);
    } else {
      console.log(`📨 Send balance update to user ${userId}`);
    }
  }

  // Load settings from database
  async loadSettings() {
    try {
      const [rows] = await this.db.execute(
        'SELECT `key`, value FROM settings WHERE `key` IN (?, ?)',
        ['buy_multiplier', 'sell_multiplier']
      );
      
      rows.forEach(row => {
        this.settings[row.key] = row.value;
      });
      
      console.log('DCA Execution Service - Settings loaded:', this.settings);
    } catch (error) {
      console.error('Error loading settings for DCA service:', error);
    }
  }

  // Calculate buy and sell rates in INR
  // buy_rate_inr = btc_usd_price * settings.buy_multiplier
  // sell_rate_inr = btc_usd_price * settings.sell_multiplier
  calculateRates(btcUsdPrice) {
    return {
      btc_usd_price: btcUsdPrice,
      buy_rate_inr: Math.round(btcUsdPrice * this.settings.buy_multiplier),
      sell_rate_inr: Math.round(btcUsdPrice * this.settings.sell_multiplier)
    };
  }
}

module.exports = DCAExecutionService;

