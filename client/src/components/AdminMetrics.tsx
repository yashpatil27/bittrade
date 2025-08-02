import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, ShoppingCart, TrendingDown, Repeat, Calculator } from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { AnimateINR } from './AnimateNumberFlow';

interface AdminMetrics {
  total_trades: number;
  total_volume: number;
  buy_volume: number;
  sell_volume: number;
  active_dca_plans: number;
  avg_daily_dca_amount: number;
}

interface AdminMetricsProps {
  className?: string;
}

const AdminMetrics: React.FC<AdminMetricsProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchMetrics = async () => {
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
  };

  useEffect(() => {
    fetchMetrics();
  }, [token]);

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
    }
  ];

  if (loading) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${className}`}>
        <div className="mb-4">
          <h3 className="text-base font-medium text-white">Platform Metrics</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
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
      return <AnimateINR value={value} className="text-lg font-bold text-white" />;
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
