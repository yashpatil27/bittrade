import React, { useState, useEffect } from 'react';
import { Settings, TrendingUp, TrendingDown, Save, RefreshCcw } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';

interface AdminMultiplierProps {
  className?: string;
}

const AdminMultiplier: React.FC<AdminMultiplierProps> = ({ className = '' }) => {
  const { adminSettings, loading, errors, updateAdminSettings, refetchAdminSettings } = usePortfolio();
  const [saving, setSaving] = useState(false);
  const [buyMultiplier, setBuyMultiplier] = useState('');
  const [sellMultiplier, setSellMultiplier] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form values from context data
  useEffect(() => {
    if (adminSettings) {
      setBuyMultiplier(adminSettings.buy_multiplier?.value?.toString() || '');
      setSellMultiplier(adminSettings.sell_multiplier?.value?.toString() || '');
    }
  }, [adminSettings]);

  // Check for changes
  useEffect(() => {
    if (adminSettings) {
      const currentBuy = adminSettings.buy_multiplier?.value?.toString() || '';
      const currentSell = adminSettings.sell_multiplier?.value?.toString() || '';
      setHasChanges(buyMultiplier !== currentBuy || sellMultiplier !== currentSell);
    }
  }, [buyMultiplier, sellMultiplier, adminSettings]);

  const handleSave = async () => {
    if (saving) return;

    const buyValue = parseFloat(buyMultiplier);
    const sellValue = parseFloat(sellMultiplier);

    if (isNaN(buyValue) || buyValue <= 0) {
      // Handle validation error through context if possible
      return;
    }

    if (isNaN(sellValue) || sellValue <= 0) {
      // Handle validation error through context if possible
      return;
    }

    try {
      setSaving(true);
      await updateAdminSettings({
        buy_multiplier: buyValue,
        sell_multiplier: sellValue
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (adminSettings) {
      setBuyMultiplier(adminSettings.buy_multiplier?.value?.toString() || '');
      setSellMultiplier(adminSettings.sell_multiplier?.value?.toString() || '');
    }
  };

  if (loading.adminSettings) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${className}`}>
        <div className="mb-4">
          <h3 className="text-base font-medium text-white flex items-center gap-2">
            <Settings className="w-4 h-4" />
            USD-INR Multipliers
          </h3>
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="w-20 h-4 bg-gray-700 rounded animate-pulse"></div>
                <div className="w-12 h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="w-full h-10 bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (errors.adminSettings && !adminSettings) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${className}`}>
        <div className="mb-4">
          <h3 className="text-base font-medium text-white flex items-center gap-2">
            <Settings className="w-4 h-4" />
            USD-INR Multipliers
          </h3>
        </div>
        
        <div className="text-center py-8">
          <p className="text-red-400 text-sm mb-2">{errors.adminSettings}</p>
          <button
            onClick={refetchAdminSettings}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-medium text-white flex items-center gap-2">
          <Settings className="w-4 h-4" />
          USD-INR Multipliers
        </h3>
        <button
          onClick={refetchAdminSettings}
          disabled={loading.adminSettings}
          className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCcw className={`w-3 h-3 ${loading.adminSettings ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {errors.adminSettings && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{errors.adminSettings}</p>
        </div>
      )}
      
      <div className="space-y-4">
        {/* Buy Multiplier */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-3 h-3 text-green-400" />
              </div>
              <span className="text-sm font-medium text-white">Buy Multiplier</span>
            </div>
            <span className="text-xs text-gray-400">
              Current: {adminSettings?.buy_multiplier?.value || 'N/A'}
            </span>
          </div>
          <input
            type="number"
            step="0.01"
            min="0"
            value={buyMultiplier}
            onChange={(e) => setBuyMultiplier(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
            placeholder="Enter buy multiplier"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used for converting BTC-USD to BTC-INR for buy orders
          </p>
        </div>

        {/* Sell Multiplier */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-500/10 rounded-lg">
                <TrendingDown className="w-3 h-3 text-red-400" />
              </div>
              <span className="text-sm font-medium text-white">Sell Multiplier</span>
            </div>
            <span className="text-xs text-gray-400">
              Current: {adminSettings?.sell_multiplier?.value || 'N/A'}
            </span>
          </div>
          <input
            type="number"
            step="0.01"
            min="0"
            value={sellMultiplier}
            onChange={(e) => setSellMultiplier(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors"
            placeholder="Enter sell multiplier"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used for converting BTC-USD to BTC-INR for sell orders
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="flex-1 btn-strike-primary rounded-lg flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span className="font-medium">{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
        
        <button
          onClick={handleReset}
          disabled={!hasChanges || saving}
          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          Reset
        </button>
      </div>

      {/* Last Updated Info */}
      {adminSettings && (
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="text-xs text-gray-500">
            <div>Buy: Last updated {new Date(adminSettings.buy_multiplier?.updated_at).toLocaleString()}</div>
            <div>Sell: Last updated {new Date(adminSettings.sell_multiplier?.updated_at).toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMultiplier;
