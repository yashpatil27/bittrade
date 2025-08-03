import React, { useState, useEffect } from 'react';
import { AreaChart, Area, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { AnimateUSD } from './AnimateNumberFlow';
import { getApiUrl } from '../utils/api';
import { Transaction } from '../types';

interface ChartData {
  timestamp: string;
  btcValue: number;
  btcBalance: number;
  btcPrice: number;
  date: string;
  time: string;
}

interface BitcoinPriceData {
  timestamp: string;
  price: number;
}

interface PortfolioChartProps {
  className?: string;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ className = "" }) => {
  const { user, token } = useAuth();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('90d');
  const [portfolioChange, setPortfolioChange] = useState<number>(0);
  const [currentPortfolioValue, setCurrentPortfolioValue] = useState<number>(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const tabs = [
    { id: '7d', label: '1W', apiTimeframe: '7d' },
    { id: '30d', label: '1M', apiTimeframe: '30d' },
    { id: '90d', label: '3M', apiTimeframe: '90d' },
    { id: '365d', label: '1Y', apiTimeframe: '365d' }
  ];

  useEffect(() => {
    if (!user || !token) return;
    
    const loadPortfolioData = async () => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        } else {
          setTransitioning(true);
        }
        setError(null);

        // Fetch user transactions
        const transactionsResponse = await fetch(`${getApiUrl()}/api/transactions?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!transactionsResponse.ok) {
          throw new Error('Failed to fetch transactions');
        }

        const transactionsData = await transactionsResponse.json();
        const transactions: Transaction[] = transactionsData.transactions || [];
        console.log('📊 Portfolio Chart - Transactions loaded:', transactions.length);

        // Fetch Bitcoin price data for the selected timeframe
        const priceResponse = await fetch(`${getApiUrl()}/api/bitcoin/chart/${selectedTab}`);
        
        if (!priceResponse.ok) {
          throw new Error('Failed to fetch Bitcoin price data');
        }

        const priceData = await priceResponse.json();
        const bitcoinPrices: BitcoinPriceData[] = priceData.price_data || [];
        console.log('📊 Portfolio Chart - Bitcoin prices loaded:', bitcoinPrices.length);

        // Calculate Bitcoin holdings value over time
        const bitcoinData = calculateBitcoinValue(transactions, bitcoinPrices);
        console.log('📊 Bitcoin Holdings Chart - Data calculated:', bitcoinData.length);
        
        setChartData(bitcoinData);

        // Calculate Bitcoin value change percentage
        if (bitcoinData.length > 1) {
          const firstValue = bitcoinData[0].btcValue;
          const lastValue = bitcoinData[bitcoinData.length - 1].btcValue;
          const changePercent = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
          setPortfolioChange(changePercent);
          setCurrentPortfolioValue(lastValue);
        } else if (bitcoinData.length === 1) {
          setCurrentPortfolioValue(bitcoinData[0].btcValue);
          setPortfolioChange(0);
        } else {
          setCurrentPortfolioValue(0);
          setPortfolioChange(0);
        }

        if (isInitialLoad) {
          setIsInitialLoad(false);
        }

        setTimeout(() => {
          setTransitioning(false);
        }, 50);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred loading portfolio data');
      } finally {
        setLoading(false);
      }
    };

    loadPortfolioData();
  }, [selectedTab, user, token, isInitialLoad]);

  const calculateBitcoinValue = (transactions: Transaction[], bitcoinPrices: BitcoinPriceData[]): ChartData[] => {
    if (bitcoinPrices.length === 0) return [];

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.created_at || a.executed_at || '').getTime() - 
      new Date(b.created_at || b.executed_at || '').getTime()
    );

    const chartData: ChartData[] = [];
    let currentBTC = 0; // BTC in satoshis
    let processedTransactionIds = new Set<string>();

    // Process each Bitcoin price point
    bitcoinPrices.forEach((pricePoint) => {
      const priceTimestamp = new Date(pricePoint.timestamp);
      
      // Apply all unprocessed transactions that occurred before or at this timestamp
      sortedTransactions.forEach(transaction => {
        const txTimestamp = new Date(transaction.created_at || transaction.executed_at || '');
        
        // Only process transactions that:
        // 1. Occurred before or at this price point
        // 2. Haven't been processed yet
        if (txTimestamp <= priceTimestamp && !processedTransactionIds.has(transaction.id)) {
          processedTransactionIds.add(transaction.id);
          
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
        }
      });

      // Convert BTC satoshis to actual BTC and calculate USD value
      const btcAmount = currentBTC / 100000000; // Convert satoshis to BTC
      const btcValue = btcAmount * pricePoint.price;

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

    // Handle any remaining unprocessed transactions (those that occurred after the last price point)
    const lastPricePoint = bitcoinPrices[bitcoinPrices.length - 1];
    const lastPriceTimestamp = new Date(lastPricePoint.timestamp);
    
    const remainingTransactions = sortedTransactions.filter(transaction => {
      const txTimestamp = new Date(transaction.created_at || transaction.executed_at || '');
      return txTimestamp > lastPriceTimestamp && !processedTransactionIds.has(transaction.id);
    });

    if (remainingTransactions.length > 0) {
      console.log(`📊 Found ${remainingTransactions.length} transactions after last price point, using latest price $${lastPricePoint.price}`);
      
      // Process remaining transactions
      remainingTransactions.forEach(transaction => {
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
      });

      // Add a final data point with the updated balance using the last available price
      const finalBtcAmount = currentBTC / 100000000;
      const finalBtcValue = finalBtcAmount * lastPricePoint.price;
      
      // Use current timestamp for the final point
      const now = new Date();
      chartData.push({
        timestamp: now.toISOString(),
        btcValue: finalBtcValue,
        btcBalance: finalBtcAmount,
        btcPrice: lastPricePoint.price,
        date: now.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        time: now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      });
      
      console.log(`📊 Added final data point: ₿${finalBtcAmount.toFixed(8)} × $${lastPricePoint.price} = $${finalBtcValue.toFixed(2)}`);
    }

    return chartData;
  };

  const formatTooltipValue = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-light">{formatTooltipValue(payload[0].value)}</p>
          <div className="text-gray-400 text-sm space-y-1">
            <p>BTC: {data.btcBalance.toFixed(8)}</p>
            <p>BTC Price: {formatTooltipValue(data.btcPrice)}</p>
            <p>{data.date} at {data.time}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`bg-black rounded-lg p-1 ${className}`}>
        {/* Header */}
        <div className="mb-3">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Bitcoin Holdings</h3>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-24 h-6 bg-gray-700 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-48 bg-gray-800 rounded-lg animate-pulse"></div>
        
        {/* Tab Navigation */}
        <div className="mt-2 flex justify-center">
          <div className="flex bg-gray-800 rounded-lg p-1 w-full max-w-md">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className="flex-1 py-1 text-xs font-light text-gray-400 rounded-md"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-black rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Bitcoin Holdings</h3>
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mt-1">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  const isPositive = portfolioChange >= 0;
  const hasChartData = chartData.length > 0;

  return (
    <div className={`bg-black rounded-lg p-1 ${className}`}>
      {/* Header */}
      <div className="mb-3">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Bitcoin Holdings</h3>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xl font-semibold text-white">
              <AnimateUSD 
                value={currentPortfolioValue}
                className="justify-center text-xl font-semibold text-white"
              />
            </span>
            {hasChartData && (
              <div className={`${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                <span className="text-xs font-light">
                  {isPositive ? '+' : ''}{portfolioChange.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 relative">
        {hasChartData ? (
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            transitioning ? 'opacity-50' : 'opacity-100'
          }`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-color)" stopOpacity={0.3} />
                    <stop offset="50%" stopColor="var(--brand-color)" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="var(--brand-color)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <YAxis 
                  hide={true}
                  domain={['dataMin - 1000', 'dataMax + 1000']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="btcValue"
                  stroke="rgb(255, 212, 212)"
                  strokeWidth={2}
                  fill="url(#portfolioGradient)"
                  dot={false}
                  activeDot={{ 
                    r: 4, 
                    fill: 'rgb(255, 212, 212)',
                    stroke: '#1f2937',
                    strokeWidth: 2
                  }}
                  animationDuration={isInitialLoad ? 0 : 800}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 rounded-lg">
            <div className="text-center">
              <p className="text-gray-400 text-sm">No transaction history yet</p>
              <p className="text-gray-500 text-xs mt-1">Your portfolio chart will appear here after your first transaction</p>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mt-2 flex justify-center">
        <div className="flex bg-gray-800 rounded-lg p-1 w-full max-w-md">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex-1 py-1 text-xs font-light rounded-md transition-colors ${
                selectedTab === tab.id
                  ? 'text-brand'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioChart;
