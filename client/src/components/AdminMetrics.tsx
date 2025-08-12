import React from 'react';
import { TrendingUp, BarChart3, ShoppingCart, TrendingDown, Repeat, Calculator, ArrowDownToLine, ArrowUpFromLine, Coins, Banknote } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { formatBitcoinForDisplay, formatRupeesForDisplay } from '../utils/formatters';

interface AdminMetricsProps {
  className?: string;
}

const AdminMetrics: React.FC<AdminMetricsProps> = ({ className = '' }) => {
  const { adminMetrics, loading, errors, refetchAdminMetrics } = usePortfolio();

  const metricsCards = [
    {
      title: 'Total Trades',
      value: adminMetrics?.total_trades || 0,
      icon: BarChart3,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      format: 'number'
    },
    {
      title: 'Total Volume',
      value: adminMetrics?.total_volume || 0,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      format: 'currency'
    },
    {
      title: 'Buy Volume',
      value: adminMetrics?.buy_volume || 0,
      icon: ShoppingCart,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      format: 'currency'
    },
    {
      title: 'Sell Volume',
      value: adminMetrics?.sell_volume || 0,
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      format: 'currency'
    },
    {
      title: 'Active DCA Plans',
      value: adminMetrics?.active_dca_plans || 0,
      icon: Repeat,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      format: 'number'
    },
    {
      title: 'Avg Daily DCA',
      value: adminMetrics?.avg_daily_dca_amount || 0,
      icon: Calculator,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      format: 'currency'
    },
    {
      title: 'Cash Deposits',
      value: adminMetrics?.total_cash_deposits || 0,
      icon: ArrowDownToLine,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      format: 'currency'
    },
    {
      title: 'Cash Withdrawals',
      value: adminMetrics?.total_cash_withdrawals || 0,
      icon: ArrowUpFromLine,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      format: 'currency'
    },
    {
      title: 'BTC Deposits',
      value: adminMetrics?.total_bitcoin_deposits || 0,
      icon: Coins,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      format: 'bitcoin'
    },
    {
      title: 'BTC Withdrawals',
      value: adminMetrics?.total_bitcoin_withdrawals || 0,
      icon: Banknote,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      format: 'bitcoin'
    }
  ];

  if (loading.adminMetrics) {
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

  if (errors.adminMetrics) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${className}`}>
        <div className="mb-4">
          <h3 className="text-base font-medium text-white">Platform Metrics</h3>
        </div>
        
        <div className="text-center py-8">
          <p className="text-red-400 text-sm">{errors.adminMetrics}</p>
          <button
            onClick={refetchAdminMetrics}
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
          onClick={refetchAdminMetrics}
          className="text-xs text-gray-400 hover:text-white transition-colors"
          disabled={loading.adminMetrics}
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
