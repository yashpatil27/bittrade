import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useWebSocketEvent } from './WebSocketContext';
import { getApiUrl } from '../utils/api';

// Price update data from WebSocket
interface PriceUpdateData {
  btc_usd_price: number;
  buy_rate_inr: number;
  sell_rate_inr: number;
  timestamp: string;
}

// Bitcoin price API response
interface MarketRatesResponse {
  btc_usd_price: number;
  buy_rate_inr: number;
  sell_rate_inr: number;
  timestamp: string;
  cached?: boolean;
}


// Chart data structures
interface ChartDataPoint {
  timestamp: string;
  price: number;
  date: string;
  time: string;
}

interface ApiChartResponse {
  timeframe: string;
  price_data: Array<{ timestamp: string; price: number }>;
  price_change_pct: string | null;
  data_points_count: number;
  last_updated: string;
}

// Chart data by timeframe
interface ChartDataCache {
  [timeframe: string]: {
    data: ChartDataPoint[];
    priceChangePercent: number;
    lastUpdated: string;
    loading: boolean;
    error: string | null;
  };
}

interface PriceContextType {
  // Current prices and rates
  btcUsdPrice: number | null;
  buyRateInr: number | null;
  sellRateInr: number | null;
  lastUpdated: string | null;
  
  // Loading states
  pricesLoading: boolean;
  pricesError: string | null;
  
  // Chart data management
  chartData: ChartDataCache;
  currentChartTimeframe: string;
  
  // Actions
  refetchPrices: () => Promise<void>;
  fetchChartData: (timeframe: string) => Promise<void>;
  setCurrentChartTimeframe: (timeframe: string) => void;
  
  // Computed values
  isConnected: boolean;
  hasValidPrices: boolean;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

interface PriceProviderProps {
  children: ReactNode;
}

export const PriceProvider: React.FC<PriceProviderProps> = ({ children }) => {
  // Current price data state
  const [btcUsdPrice, setBtcUsdPrice] = useState<number | null>(null);
  const [buyRateInr, setBuyRateInr] = useState<number | null>(null);
  const [sellRateInr, setSellRateInr] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Loading states
  const [pricesLoading, setPricesLoading] = useState(true);
  const [pricesError, setPricesError] = useState<string | null>(null);
  
  // Chart data state
  const [chartData, setChartData] = useState<ChartDataCache>({});
  const [currentChartTimeframe, setCurrentChartTimeframe] = useState('90d');

  // Fetch bitcoin prices from API
  const fetchMarketRates = useCallback(async () => {
    setPricesLoading(true);
    setPricesError(null);

    try {
      const response = await fetch(`${getApiUrl()}/api/market-rates`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch market rates: ${response.status}`);
      }

      const data: MarketRatesResponse = await response.json();
      
      setBtcUsdPrice(data.btc_usd_price);
      setBuyRateInr(data.buy_rate_inr);
      setSellRateInr(data.sell_rate_inr);
      setLastUpdated(data.timestamp);
      
      console.log('📊 PriceContext: Fetched bitcoin prices:', data);
    } catch (err) {
      console.error('❌ PriceContext: Failed to fetch bitcoin prices:', err);
      setPricesError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setPricesLoading(false);
    }
  }, []);

  // Fetch chart data for specific timeframe
  const fetchChartData = useCallback(async (timeframe: string) => {
    // Update loading state for this timeframe
    setChartData(prev => ({
      ...prev,
      [timeframe]: {
        ...prev[timeframe],
        loading: true,
        error: null,
      }
    }));

    try {
      const response = await fetch(`${getApiUrl()}/api/bitcoin/chart/${timeframe}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.status}`);
      }

      const apiData: ApiChartResponse = await response.json();
      
      // Transform the data for charts
      const formattedData: ChartDataPoint[] = apiData.price_data.map((item) => {
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

      // Calculate price change percentage
      let priceChangePercent = 0;
      if (apiData.price_change_pct !== null) {
        priceChangePercent = parseFloat(apiData.price_change_pct);
      } else if (formattedData.length > 0) {
        const firstPrice = formattedData[0].price;
        const lastPrice = formattedData[formattedData.length - 1].price;
        priceChangePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
      }

      // Update chart data cache
      setChartData(prev => ({
        ...prev,
        [timeframe]: {
          data: formattedData,
          priceChangePercent,
          lastUpdated: apiData.last_updated,
          loading: false,
          error: null,
        }
      }));

      console.log(`📊 PriceContext: Fetched chart data for ${timeframe}:`, formattedData.length, 'points');
    } catch (err) {
      console.error(`❌ PriceContext: Failed to fetch chart data for ${timeframe}:`, err);
      
      setChartData(prev => ({
        ...prev,
        [timeframe]: {
          ...prev[timeframe],
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch chart data',
        }
      }));
    }
  }, []);

  // Initial data fetch on mount
  useEffect(() => {
    fetchMarketRates();
  }, [fetchMarketRates]);
  
  // Separate effect for chart data to avoid refetching market rates
  useEffect(() => {
    fetchChartData(currentChartTimeframe);
  }, [fetchChartData, currentChartTimeframe]);

  // Handle WebSocket price updates
  useWebSocketEvent<PriceUpdateData>('btc_price_update', (data) => {
    console.log('📊 PriceContext: Received price update via WebSocket:', data);
    
    setBtcUsdPrice(data.btc_usd_price);
    setBuyRateInr(data.buy_rate_inr);
    setSellRateInr(data.sell_rate_inr);
    setLastUpdated(data.timestamp);
    setPricesError(null);
    setPricesLoading(false);
  });

  // Computed values
  const isConnected = btcUsdPrice !== null && buyRateInr !== null && sellRateInr !== null;
  const hasValidPrices = isConnected && !pricesError;

  const value: PriceContextType = {
    // Current prices and rates
    btcUsdPrice,
    buyRateInr,
    sellRateInr,
    lastUpdated,
    
    // Loading states
    pricesLoading,
    pricesError,
    
    // Chart data
    chartData,
    currentChartTimeframe,
    
    // Actions
    refetchPrices: fetchMarketRates,
    fetchChartData,
    setCurrentChartTimeframe,
    
    // Computed values
    isConnected,
    hasValidPrices,
  };

  return (
    <PriceContext.Provider value={value}>
      {children}
    </PriceContext.Provider>
  );
};

// Custom hook to use price context
export const usePrice = (): PriceContextType => {
  const context = useContext(PriceContext);
  if (context === undefined) {
    throw new Error('usePrice must be used within a PriceProvider');
  }
  return context;
};

export default PriceContext;
