const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '', // Update if you have a password
  database: 'bittrade',
  timezone: 'Z'
};

async function debugPortfolio() {
  const db = await mysql.createConnection(config);
  
  try {
    // Get transactions for user_id 1
    const [transactions] = await db.execute(
      'SELECT id, type, btc_amount, inr_amount, execution_price, created_at, executed_at FROM transactions WHERE user_id = 1 ORDER BY created_at ASC'
    );
    
    console.log('📊 Transactions found:', transactions.length);
    transactions.forEach(tx => {
      const btcAmount = tx.btc_amount / 100000000; // Convert satoshis to BTC
      console.log(`${tx.type}: ₹${tx.inr_amount} → ₿${btcAmount.toFixed(8)} at ${tx.created_at}`);
    });
    
    // Get Bitcoin price data (latest)
    const [priceData] = await db.execute(
      'SELECT btc_usd_price FROM bitcoin_data ORDER BY created_at DESC LIMIT 1'
    );
    
    const currentBtcPrice = priceData[0]?.btc_usd_price || 0;
    console.log(`\n💰 Current BTC Price: $${currentBtcPrice}`);
    
    // Calculate total BTC holdings
    let totalBTC = 0;
    
    transactions.forEach(transaction => {
      switch (transaction.type) {
        case 'MARKET_BUY':
        case 'LIMIT_BUY':
        case 'DCA_BUY':
          totalBTC += transaction.btc_amount || 0;
          break;
        case 'MARKET_SELL':
        case 'LIMIT_SELL':
        case 'DCA_SELL':
          totalBTC -= transaction.btc_amount || 0;
          break;
        case 'DEPOSIT_BTC':
          totalBTC += transaction.btc_amount || 0;
          break;
        case 'WITHDRAW_BTC':
          totalBTC -= transaction.btc_amount || 0;
          break;
      }
    });
    
    const btcBalance = totalBTC / 100000000; // Convert satoshis to BTC
    const usdValue = btcBalance * currentBtcPrice;
    
    console.log(`\n📈 Portfolio Calculation:`);
    console.log(`Total BTC (satoshis): ${totalBTC}`);
    console.log(`Total BTC: ₿${btcBalance.toFixed(8)}`);
    console.log(`USD Value: $${usdValue.toFixed(2)}`);
    
    // Get sample chart data to see what the API returns
    const [chartData] = await db.execute(
      'SELECT price_data FROM bitcoin_chart_data WHERE timeframe = ? ORDER BY last_updated DESC LIMIT 1',
      ['90d']
    );
    
    if (chartData.length > 0) {
      const pricePoints = JSON.parse(chartData[0].price_data);
      console.log(`\n📊 Chart data points: ${pricePoints.length}`);
      console.log(`First price point: $${pricePoints[0]?.price} at ${pricePoints[0]?.timestamp}`);
      console.log(`Last price point: $${pricePoints[pricePoints.length - 1]?.price} at ${pricePoints[pricePoints.length - 1]?.timestamp}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.end();
  }
}

debugPortfolio();
