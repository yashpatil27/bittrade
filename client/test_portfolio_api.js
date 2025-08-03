const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bittrade',
  timezone: 'Z'
};

// Simulate the calculateBitcoinValue function from PortfolioChart
function calculateBitcoinValue(transactions, bitcoinPrices) {
  if (bitcoinPrices.length === 0) return [];

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.created_at || a.executed_at || '').getTime() - 
    new Date(b.created_at || b.executed_at || '').getTime()
  );

  const chartData = [];
  let currentBTC = 0; // BTC in satoshis
  let processedTransactionIds = new Set();

  console.log('\n🔍 Processing chart data points...');

  // Process each Bitcoin price point
  bitcoinPrices.forEach((pricePoint, index) => {
    const priceTimestamp = new Date(pricePoint.timestamp);
    
    // Apply all unprocessed transactions that occurred before or at this timestamp
    sortedTransactions.forEach(transaction => {
      const txTimestamp = new Date(transaction.created_at || transaction.executed_at || '');
      
      // Only process transactions that:
      // 1. Occurred before or at this price point
      // 2. Haven't been processed yet
      if (txTimestamp <= priceTimestamp && !processedTransactionIds.has(transaction.id)) {
        processedTransactionIds.add(transaction.id);
        
        const oldBTC = currentBTC;
        
        // Only track Bitcoin-related transactions
        switch (transaction.type) {
          case 'MARKET_BUY':
          case 'LIMIT_BUY':
          case 'DCA_BUY':
            currentBTC += transaction.btc_amount || 0;
            break;
          case 'MARKET_SELL':
          case 'LIMIT_SELL':
          case 'DCA_SELL':
            currentBTC -= transaction.btc_amount || 0;
            break;
          case 'DEPOSIT_BTC':
            currentBTC += transaction.btc_amount || 0;
            break;
          case 'WITHDRAW_BTC':
            currentBTC -= transaction.btc_amount || 0;
            break;
        }
        
        if (oldBTC !== currentBTC) {
          console.log(`  📋 Processed ${transaction.type}: ${transaction.btc_amount} satoshis | New balance: ${currentBTC} satoshis`);
        }
      }
    });

    // Convert BTC satoshis to actual BTC and calculate USD value
    const btcAmount = currentBTC / 100000000; // Convert satoshis to BTC
    const btcValue = btcAmount * pricePoint.price;

    if (index < 5 || index >= bitcoinPrices.length - 5) { // Log first and last 5 points
      console.log(`  📊 Point ${index}: ₿${btcAmount.toFixed(8)} × $${pricePoint.price} = $${btcValue.toFixed(2)} (${pricePoint.timestamp})`);
    }

    const date = new Date(pricePoint.timestamp);
    chartData.push({
      timestamp: pricePoint.timestamp,
      btcValue,
      btcBalance: btcAmount,
      btcPrice: pricePoint.price,
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    });
  });

  return chartData;
}

async function testPortfolioAPI() {
  const db = await mysql.createConnection(config);
  
  try {
    // Simulate fetching transactions (like the API does)
    const [transactionsResult] = await db.execute(
      'SELECT * FROM transactions WHERE user_id = 1 ORDER BY created_at DESC LIMIT 1000'
    );
    
    console.log('📊 Transactions loaded:', transactionsResult.length);
    
    // Simulate fetching Bitcoin price data for 90d timeframe
    const [chartResult] = await db.execute(
      'SELECT CAST(price_data AS CHAR) as price_data FROM bitcoin_chart_data WHERE timeframe = ? ORDER BY last_updated DESC LIMIT 1',
      ['90d']
    );
    
    if (chartResult.length === 0) {
      console.log('❌ No chart data found');
      return;
    }
    
    let bitcoinPrices;
    try {
      const rawData = chartResult[0].price_data;
      console.log('📊 Raw price data type:', typeof rawData);
      console.log('📊 Raw price data sample:', rawData.substring(0, 200));
      bitcoinPrices = JSON.parse(rawData);
    } catch (error) {
      console.log('❌ Error parsing price data:', error.message);
      return;
    }
    
    console.log('📊 Bitcoin prices loaded:', bitcoinPrices.length);
    console.log('🕒 Price range:', bitcoinPrices[0]?.timestamp, 'to', bitcoinPrices[bitcoinPrices.length - 1]?.timestamp);
    
    // Calculate Bitcoin holdings value over time (same logic as PortfolioChart)
    const bitcoinData = calculateBitcoinValue(transactionsResult, bitcoinPrices);
    console.log('📊 Bitcoin Holdings Chart - Data calculated:', bitcoinData.length);
    
    if (bitcoinData.length > 0) {
      const firstValue = bitcoinData[0].btcValue;
      const lastValue = bitcoinData[bitcoinData.length - 1].btcValue;
      const changePercent = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
      
      console.log('\n📈 Portfolio Summary:');
      console.log(`Current value: $${lastValue.toFixed(2)}`);
      console.log(`Change: ${changePercent.toFixed(2)}%`);
      console.log(`BTC balance: ₿${bitcoinData[bitcoinData.length - 1].btcBalance.toFixed(8)}`);
    } else {
      console.log('❌ No chart data calculated');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.end();
  }
}

testPortfolioAPI();
