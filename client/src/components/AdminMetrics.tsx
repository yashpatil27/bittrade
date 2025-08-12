import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, BarChart3, ShoppingCart, TrendingDown, Repeat, Calculator, ArrowDownToLine, ArrowUpFromLine, Coins, Banknote } from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatBitcoinForDisplay, formatRupeesForDisplay } from '../utils/formatters';

interface AdminMetricsData {
  total_trades: number;
  total_volume: number;
  buy_volume: number;
  sell_volume: number;
  active_dca_plans: number;
  avg_daily_dca_amount: number;
  total_cash_deposits: number;
  total_cash_withdrawals: number;
  total_bitcoin_deposits: number;
  total_bitcoin_withdrawals: number;
}

interface AdminMetricsProps {
  className?: string;
}

const AdminMetrics: React.FC<AdminMetricsProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<AdminMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchMetrics = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/api/admin/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const metricsCards = [
    {
      title: 'Total Trades',
      value: metrics?.total_trades || 0,
      icon: BarChart3,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      format: 'number'
    },
    {
      title: 'Total Volume',
      value: metrics?.total_volume || 0,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      format: 'currency'
    },
    {
      title: 'Buy Volume',
      value: metrics?.buy_volume || 0,
      icon: ShoppingCart,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      format: 'currency'
    },
    {
      title: 'Sell Volume',
      value: metrics?.sell_volume || 0,
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      format: 'currency'
    },
    {
      title: 'Active DCA Plans',
      value: metrics?.active_dca_plans || 0,
      icon: Repeat,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      format: 'number'
    },
    {
      title: 'Avg Daily DCA',
      value: metrics?.avg_daily_dca_amount || 0,
      icon: Calculator,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      format: 'currency'
    },
    {
      title: 'Cash Deposits',
      value: metrics?.total_cash_deposits || 0,
      icon: ArrowDownToLine,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      format: 'currency'
    },
    {
      title: 'Cash Withdrawals',
      value: metrics?.total_cash_withdrawals || 0,
      icon: ArrowUpFromLine,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      format: 'currency'
    },
    {
      title: 'BTC Deposits',
      value: metrics?.total_bitcoin_deposits || 0,
      icon: Coins,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      format: 'bitcoin'
    },
    {
      title: 'BTC Withdrawals',
      value: metrics?.total_bitcoin_withdrawals || 0,
      icon: Banknote,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      format: 'bitcoin'
    }
  ];

  if (loading) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${className}`}>
        <div className="mb-4">
          <h3 className="text-base font-medium text-white">Platform Metrics</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="w-12 h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="w-16 h-3 bg-gray-700 rounded animate-pulse mb-1"></div>
              <div className="w-20 h-6 bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${className}`}>
        <div className="mb-4">
          <h3 className="text-base font-medium text-white">Platform Metrics</h3>
        </div>
        
        <div className="text-center py-8">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchMetrics}
            className="mt-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatValue = (value: number, format: string) => {
    if (format === 'currency') {
      return (
        <span className="text-lg font-bold text-white">
          {formatRupeesForDisplay(value)}
        </span>
      );
    } else if (format === 'bitcoin') {
      return (
        <span className="text-lg font-bold text-white">
          {formatBitcoinForDisplay(value)}
        </span>
      );
    } else {
      return (
        <span className="text-lg font-bold text-white">
          {value.toLocaleString()}
        </span>
      );
    }
  };

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-medium text-white">Platform Metrics</h3>
        <button
          onClick={fetchMetrics}
          className="text-xs text-gray-400 hover:text-white transition-colors"
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {metricsCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div key={index} className="bg-gray-800/50 rounded-lg p-3 transition-all duration-200 hover:bg-gray-800/70">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 ${card.bgColor} rounded-lg`}>
                  <IconComponent className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className="text-right">
                  {formatValue(card.value, card.format)}
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium">{card.title}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminMetrics;
