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
    // First, clean up old completed plans
    await this.cleanupCompletedPlans();
    
    const [plans] = await this.db.execute(
      'SELECT id, user_id, plan_type, frequency, amount_per_execution_inr, amount_per_execution_btc, max_price, min_price, remaining_executions \
       FROM active_plans WHERE next_execution_at <= UTC_TIMESTAMP() AND status = ?',
      ['ACTIVE']
    );
    
    console.log(`📊 Found ${plans.length} DCA plans due for execution`);
    
    for (const plan of plans) {
      try {
        console.log(`🔄 Executing DCA plan ${plan.id} for user ${plan.user_id}`);
        
        // CRITICAL: Check and atomically update the plan status BEFORE executing trade
        // This prevents race conditions where multiple instances try to execute the same plan
        const shouldExecute = await this.checkAndReservePlanForExecution(plan);
        
        if (!shouldExecute) {
          console.log(`⏭️ DCA plan ${plan.id} already completed or being processed by another instance`);
          continue;
        }
        
        // Execute the actual trade
        const tradeResult = await this.executeTrade(plan);
        
        if (tradeResult.success) {
          // Finalize the execution (update next execution time or mark as completed)
          await this.finalizeExecution(plan);
          
          // Notify user about execution
          await this.sendUserTransactionUpdate(plan.user_id);
          await this.sendUserBalanceUpdate(plan.user_id);
          
          // Notify admin about execution
          await this.sendAdminTransactionUpdate();
          
          // Send admin DCA plans update notification
          if (global.sendAdminDCAPlansUpdate) {
            await global.sendAdminDCAPlansUpdate();
          }
          
          console.log(`✅ DCA plan ${plan.id} executed successfully`);
        } else {
          // If trade failed, revert the reservation
          await this.revertPlanReservation(plan);
          console.log(`❌ DCA plan ${plan.id} execution failed: ${tradeResult.error}`);
        }
  
      } catch (error) {
        console.error(`Failed to execute DCA plan ${plan.id} for user ${plan.user_id}:`, error);
        // Revert reservation on error
        try {
          await this.revertPlanReservation(plan);
        } catch (revertError) {
          console.error(`Failed to revert plan reservation for ${plan.id}:`, revertError);
        }
      }
    }
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
        let inrAmount, btcAmountSatoshis;
        
        // Determine amounts based on what's specified in the plan
        if (plan.amount_per_execution_inr) {
          // INR amount specified - calculate BTC amount
          inrAmount = plan.amount_per_execution_inr;
          btcAmountSatoshis = Math.floor((inrAmount * 100000000) / currentPrice);
          
          // Check if user has sufficient INR balance
          if (user.available_inr < inrAmount) {
            await connection.rollback();
            return { 
              success: false, 
              error: `Insufficient INR balance. Available: ₹${user.available_inr}, Required: ₹${inrAmount}` 
            };
          }
          
        } else if (plan.amount_per_execution_btc) {
          // BTC amount specified - calculate INR amount
          btcAmountSatoshis = plan.amount_per_execution_btc;
          const calculatedInrAmount = (btcAmountSatoshis * currentPrice) / 100000000;
          
          // For DCA BUY: Always round UP to prevent users getting Bitcoin for free
          inrAmount = Math.ceil(calculatedInrAmount);
          // Ensure minimum charge of ₹1 for any BTC purchase to prevent free Bitcoin
          if (inrAmount === 0) {
            inrAmount = 1;
          }
          
          // Check if user has sufficient INR balance
          if (user.available_inr < inrAmount) {
            await connection.rollback();
            return { 
              success: false, 
              error: `Insufficient INR balance. Available: ₹${user.available_inr}, Required: ₹${inrAmount} (for ${btcAmountSatoshis} satoshis)` 
            };
          }
          
        } else {
          await connection.rollback();
          return { success: false, error: 'No amount specified in DCA plan' };
        }
        
        // Update user balances
        await connection.execute(
          'UPDATE users SET available_inr = available_inr - ?, available_btc = available_btc + ? WHERE id = ?',
          [inrAmount, btcAmountSatoshis, plan.user_id]
        );
        
        // Create transaction record
        await connection.execute(
          `INSERT INTO transactions (
            user_id, type, inr_amount, btc_amount, execution_price, 
            status, executed_at, dca_plan_id
          ) VALUES (?, 'DCA_BUY', ?, ?, ?, 'EXECUTED', UTC_TIMESTAMP(), ?)`,
          [plan.user_id, inrAmount, btcAmountSatoshis, currentPrice, plan.id]
        );
        
        await connection.commit();
        
        console.log(`💰 DCA BUY executed: User ${plan.user_id} bought ${btcAmountSatoshis} satoshis for ₹${inrAmount} at ₹${currentPrice}/BTC`);
        
        return { success: true, inrAmount, btcAmount: btcAmountSatoshis, price: currentPrice };
        
      } else if (plan.plan_type === 'DCA_SELL') {
        let inrAmount, btcAmountSatoshis;
        
        // Determine amounts based on what's specified in the plan
        if (plan.amount_per_execution_btc) {
          // BTC amount specified - calculate INR amount
          btcAmountSatoshis = plan.amount_per_execution_btc;
          inrAmount = Math.floor((btcAmountSatoshis * currentPrice) / 100000000);
          
          // Check if user has sufficient BTC balance
          if (user.available_btc < btcAmountSatoshis) {
            await connection.rollback();
            return { 
              success: false, 
              error: `Insufficient BTC balance. Available: ${user.available_btc} satoshis, Required: ${btcAmountSatoshis} satoshis` 
            };
          }
          
        } else if (plan.amount_per_execution_inr) {
          // INR amount specified - calculate BTC amount
          inrAmount = plan.amount_per_execution_inr;
          btcAmountSatoshis = Math.floor((inrAmount * 100000000) / currentPrice);
          
          // Check if user has sufficient BTC balance
          if (user.available_btc < btcAmountSatoshis) {
            await connection.rollback();
            return { 
              success: false, 
              error: `Insufficient BTC balance. Available: ${user.available_btc} satoshis, Required: ${btcAmountSatoshis} satoshis (for ₹${inrAmount})` 
            };
          }
          
        } else {
          await connection.rollback();
          return { success: false, error: 'No amount specified in DCA plan' };
        }
        
        // Update user balances
        await connection.execute(
          'UPDATE users SET available_btc = available_btc - ?, available_inr = available_inr + ? WHERE id = ?',
          [btcAmountSatoshis, inrAmount, plan.user_id]
        );
        
        // Create transaction record
        await connection.execute(
          `INSERT INTO transactions (
            user_id, type, inr_amount, btc_amount, execution_price, 
            status, executed_at, dca_plan_id
          ) VALUES (?, 'DCA_SELL', ?, ?, ?, 'EXECUTED', UTC_TIMESTAMP(), ?)`,
          [plan.user_id, inrAmount, btcAmountSatoshis, currentPrice, plan.id]
        );
        
        await connection.commit();
        
        console.log(`💰 DCA SELL executed: User ${plan.user_id} sold ${btcAmountSatoshis} satoshis for ₹${inrAmount} at ₹${currentPrice}/BTC`);
        
        return { success: true, inrAmount, btcAmount: btcAmountSatoshis, price: currentPrice };
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

  async sendAdminTransactionUpdate() {
    // Use global broadcast functions if available
    if (global.sendAdminTransactionUpdate) {
      await global.sendAdminTransactionUpdate();
    } else {
      console.log(`📨 Send admin transaction update`);
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

  // Atomically check and reserve a plan for execution to prevent race conditions
  async checkAndReservePlanForExecution(plan) {
    try {
      // Use atomic UPDATE with WHERE conditions to reserve the plan
      // This will only succeed if the plan is still ACTIVE and ready for execution
      const [result] = await this.db.execute(
        `UPDATE active_plans 
         SET next_execution_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 SECOND)
         WHERE id = ? 
           AND status = 'ACTIVE' 
           AND next_execution_at <= UTC_TIMESTAMP()
           AND (remaining_executions IS NULL OR remaining_executions > 0)`,
        [plan.id]
      );
      
      // If affectedRows is 0, the plan was already processed by another instance
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error reserving plan ${plan.id}:`, error);
      return false;
    }
  }
  
  // Finalize the execution by updating next execution time or completing the plan
  async finalizeExecution(plan) {
    try {
      // Get current remaining executions
      const [currentPlanRows] = await this.db.execute(
        'SELECT remaining_executions FROM active_plans WHERE id = ?',
        [plan.id]
      );
      
      if (currentPlanRows.length === 0) {
        console.log(`Plan ${plan.id} not found during finalization`);
        return;
      }
      
      const currentRemainingExecutions = currentPlanRows[0].remaining_executions;
      
      // For unlimited plans (remaining_executions IS NULL), just update next execution time
      if (currentRemainingExecutions === null) {
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
            nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR)';
        }
        
        await this.db.execute(
          `UPDATE active_plans SET next_execution_at = ${nextExecutionSQL} WHERE id = ?`,
          [plan.id]
        );
        
        console.log(`Next execution scheduled for unlimited plan ${plan.id}`);
        return;
      }
      
      // For limited plans, check if this was the final execution
      if (currentRemainingExecutions === 1) {
        // This was the final execution, mark as completed
        await this.db.execute(
          `UPDATE active_plans SET 
             status = 'COMPLETED', 
             remaining_executions = 0, 
             completed_at = UTC_TIMESTAMP()
           WHERE id = ?`,
          [plan.id]
        );
        
        console.log(`✅ DCA plan ${plan.id} completed after final execution`);
        return;
      }
      
      // Otherwise, decrement remaining executions and update next execution time
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
          nextExecutionSQL = 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR)';
      }
      
      await this.db.execute(
        `UPDATE active_plans SET 
           next_execution_at = ${nextExecutionSQL}, 
           remaining_executions = remaining_executions - 1 
         WHERE id = ?`,
        [plan.id]
      );
      
      console.log(`Next execution scheduled for plan ${plan.id}. Remaining: ${currentRemainingExecutions - 1}`);
      
    } catch (error) {
      console.error(`Error finalizing execution for plan ${plan.id}:`, error);
    }
  }
  
  // Revert plan reservation if trade execution fails
  async revertPlanReservation(plan) {
    try {
      // Reset the next execution time back to what it should be
      let nextExecutionSQL;
      switch (plan.frequency) {
        case 'HOURLY':
          nextExecutionSQL = 'UTC_TIMESTAMP()';
          break;
        case 'DAILY':
          nextExecutionSQL = 'UTC_TIMESTAMP()';
          break;
        case 'WEEKLY':
          nextExecutionSQL = 'UTC_TIMESTAMP()';
          break;
        case 'MONTHLY':
          nextExecutionSQL = 'UTC_TIMESTAMP()';
          break;
        default:
          nextExecutionSQL = 'UTC_TIMESTAMP()';
      }
      
      await this.db.execute(
        `UPDATE active_plans SET next_execution_at = ${nextExecutionSQL} WHERE id = ?`,
        [plan.id]
      );
      
      console.log(`Reverted reservation for plan ${plan.id}`);
    } catch (error) {
      console.error(`Error reverting reservation for plan ${plan.id}:`, error);
    }
  }

  // Clean up completed plans that have been sitting in database for more than a week
  async cleanupCompletedPlans() {
    try {
      // Delete completed plans that were completed more than 7 days ago
      const [result] = await this.db.execute(
        `DELETE FROM active_plans 
         WHERE status = 'COMPLETED' 
           AND completed_at IS NOT NULL 
           AND completed_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)`,
        []
      );
      
      if (result.affectedRows > 0) {
        console.log(`🧹 Cleaned up ${result.affectedRows} completed DCA plan(s) older than 7 days`);
      }
      
    } catch (error) {
      console.error('Error cleaning up completed DCA plans:', error);
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

