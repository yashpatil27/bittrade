import React, { useState, useEffect } from 'react';
import { AreaChart, Area, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ChartData {
  timestamp: string;
  price: number;
  date: string;
  time: string;
}

interface ApiChartData {
  timeframe: string;
  price_data: Array<{ timestamp: string; price: number }>;
  price_change_pct: string | null;
  data_points_count: number;
  last_updated: string;
}

interface BitcoinChartProps {
  className?: string;
}

const BitcoinChart: React.FC<BitcoinChartProps> = ({ className = "" }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('90d');
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);

  const tabs = [
    { id: '1d', label: '1D', apiTimeframe: '1d' },
    { id: '7d', label: '1W', apiTimeframe: '7d' },
    { id: '30d', label: '1M', apiTimeframe: '30d' },
    { id: '90d', label: '3M', apiTimeframe: '90d' },
    { id: '365d', label: '1Y', apiTimeframe: '365d' }
  ];

  useEffect(() => {
    const loadBitcoinData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch data from API
        const response = await fetch(`http://localhost:3001/api/bitcoin/chart/${selectedTab}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch chart data: ${response.status}`);
        }

        const apiData: ApiChartData = await response.json();
        
        // Transform the data for the chart
        const formattedData: ChartData[] = apiData.price_data.map((item) => {
          const date = new Date(item.timestamp);
          return {
            timestamp: item.timestamp,
            price: item.price,
            date: date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            }),
            time: date.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          };
        });

        setChartData(formattedData);

        // Use API price change if available, otherwise calculate manually
        if (apiData.price_change_pct !== null) {
          const apiChangePercent = parseFloat(apiData.price_change_pct);
          setPriceChangePercent(apiChangePercent);
        } else {
          // Fallback: calculate manually if API doesn't have price change
          if (formattedData.length > 0) {
            const firstPrice = formattedData[0].price;
            const lastPrice = formattedData[formattedData.length - 1].price;
            const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
            setPriceChangePercent(changePercent);
          }
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred loading chart data');
      } finally {
        setLoading(false);
      }
    };

    loadBitcoinData();
  }, [selectedTab]);

  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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

  if (loading) {
    return (
      <div className={`bg-black rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Bitcoin Price</h3>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-20 h-6 bg-gray-700 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex bg-gray-800 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className="px-3 py-1 text-sm font-light text-gray-400 rounded-md"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-48 bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-black rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Bitcoin Price</h3>
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-gray-400 text-xs mt-1">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const isPositive = priceChangePercent >= 0;

  return (
    <div className={`bg-black rounded-lg p-1 ${className}`}>
      {/* Header */}
      <div className="mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Bitcoin Price</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xl font-semibold text-white">
              {formatPrice(currentPrice)}
            </span>
            <div className={`${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <span className="text-xs font-light">
                {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#a5b4fc" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.05} />
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
              stroke="#a5b4fc"
              strokeWidth={2}
              fill="url(#colorGradient)"
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: '#a5b4fc',
                stroke: '#1f2937',
                strokeWidth: 2
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
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

export default BitcoinChart;
