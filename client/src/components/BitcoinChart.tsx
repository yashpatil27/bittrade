import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { usePrice } from '../context/PriceContext';
import { AnimateUSD } from './AnimateNumberFlow';

interface BitcoinChartProps {
  className?: string;
}

const BitcoinChart: React.FC<BitcoinChartProps> = ({ className = "" }) => {
  const [transitioning, setTransitioning] = useState(false);
  
  // Use centralized price context
  const {
    btcUsdPrice,
    chartData,
    currentChartTimeframe,
    setCurrentChartTimeframe,
    fetchChartData
  } = usePrice();
  
  // Get current chart data for selected timeframe
  const currentChart = chartData[currentChartTimeframe];
  const loading = currentChart?.loading ?? true;
  const error = currentChart?.error ?? null;
  const priceChangePercent = currentChart?.priceChangePercent ?? 0;
  const formattedChartData = currentChart?.data ?? [];
  
  // Check if we have any data to show
  const hasData = formattedChartData.length > 0;

  const tabs = [
    { id: '1d', label: '1D' },
    { id: '7d', label: '1W' },
    { id: '30d', label: '1M' },
    { id: '90d', label: '3M' },
    { id: '365d', label: '1Y' }
  ];

  // Handle tab changes
  const handleTabChange = async (tabId: string) => {
    if (tabId === currentChartTimeframe) return;
    
    // Set timeframe first (this will update the UI immediately)
    setCurrentChartTimeframe(tabId);
    
    // Only fetch data if we don't have it cached
    if (!chartData[tabId] || chartData[tabId].error) {
      // Show transitioning state for smooth UX only when fetching new data
      setTransitioning(true);
      
      await fetchChartData(tabId);
      
      // Reset transitioning state after animation
      setTimeout(() => {
        setTransitioning(false);
      }, 300);
    }
  };

  const formatTooltipPrice = (value: number): string => {
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
          <p className="text-white font-light">{formatTooltipPrice(payload[0].value)}</p>
          <p className="text-gray-400 text-sm">{data.date} at {data.time}</p>
        </div>
      );
    }
    return null;
  };

  // Only show loading state if we have no data at all
  if (loading && !hasData) {
    return (
      <div className={`bg-black rounded-lg p-1 ${className}`}>
        {/* Header */}
        <div className="mb-3">
          <div className="text-center">
            {/* Main Price Display Skeleton */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-40 h-12 bg-gray-700 rounded animate-pulse"></div>
            </div>
            
            {/* Sub Amount Display Skeleton */}
            <div className="flex items-center justify-center gap-2">
              <div className="w-20 h-4 bg-gray-700 rounded animate-pulse"></div>
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
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mt-1">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  // Use live price from WebSocket if available, otherwise use chart data
  const currentPrice = btcUsdPrice || (formattedChartData.length > 0 ? formattedChartData[formattedChartData.length - 1].price : 0);
  
  // Calculate real-time price change if we have live price
  const realTimePriceChange = btcUsdPrice && formattedChartData.length > 0 
    ? ((btcUsdPrice - formattedChartData[0].price) / formattedChartData[0].price) * 100
    : priceChangePercent;
  
  const displayPriceChange = btcUsdPrice ? realTimePriceChange : priceChangePercent;
  const isRealTimePositive = displayPriceChange >= 0;

  return (
    <div className={`bg-black rounded-lg p-1 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <div className="text-center">
          {/* Main Price Display */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-white text-4xl font-normal">
              <AnimateUSD 
                value={currentPrice}
                className="justify-center text-white text-4xl font-normal"
              />
            </span>
          </div>
          
          {/* Sub Amount Display - Price Change % */}
          <div className="flex items-center justify-center gap-2">
            <span className={`text-sm font-normal ${
              isRealTimePositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isRealTimePositive ? '+' : ''}{displayPriceChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-grow relative min-h-0">
        <div className={`absolute inset-0 transition-opacity duration-200 ${
          transitioning ? 'opacity-70' : 'opacity-100'
        }`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedChartData}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="price"
                stroke="rgb(255, 212, 212)"
                strokeWidth={2}
                fill="url(#colorGradient)"
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: 'rgb(255, 212, 212)',
                  stroke: '#1f2937',
                  strokeWidth: 2
                }}
                animationDuration={transitioning ? 200 : 600}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 mt-2 flex justify-center">
        <div className="flex bg-gray-800 rounded-lg p-1 w-full max-w-md">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-1 text-xs font-light rounded-md transition-colors ${
                currentChartTimeframe === tab.id
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

export default BitcoinChart;
