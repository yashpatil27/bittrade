const mysql = require('mysql2/promise');
const config = require('../config/config');

class DCAExecutionService {
  constructor() {
    this.db = null;
    this.isRunning = false;
    this.currentTimeout = null;
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
    
    for (const plan of plans) {
      try {
        // Implement the DCA transaction logic here
        // Check balances, price limits, and then execute trades
  
        // Simulate the transaction creation
        // await this.executeTrade(plan);
  
        // Update next execution time
        await this.updateNextExecutionTime(plan);
  
        // Notify user about execution
        await this.sendUserTransactionUpdate(plan.user_id);
        await this.sendUserBalanceUpdate(plan.user_id);
  
      } catch (error) {
        console.error(`Failed to execute DCA plan ${plan.id} for user ${plan.user_id}:`, error);
        // Optional: Pause the plan on persistent failure
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

  async sendUserBalanceUpdate(userId) {
    console.log(`Placeholder: Send balance update to user ${userId}`);
  }
}

module.exports = DCAExecutionService;

