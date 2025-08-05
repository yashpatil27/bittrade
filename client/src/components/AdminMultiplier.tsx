import React, { useState, useEffect, useCallback } from 'react';
import { Settings, TrendingUp, TrendingDown, Save, RefreshCcw } from 'lucide-react';
import { getApiUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface MultiplierSettings {
  buy_multiplier: {
    value: number;
    updated_at: string;
  };
  sell_multiplier: {
    value: number;
    updated_at: string;
  };
  loan_interest_rate?: {
    value: number;
    updated_at: string;
  };
}

interface AdminMultiplierProps {
  className?: string;
}

const AdminMultiplier: React.FC<AdminMultiplierProps> = ({ className = '' }) => {
  const [settings, setSettings] = useState<MultiplierSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyMultiplier, setBuyMultiplier] = useState('');
  const [sellMultiplier, setSellMultiplier] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const { token } = useAuth();

  const fetchSettings = useCallback(async () => {
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSettings(data);
      setBuyMultiplier(data.buy_multiplier?.value?.toString() || '');
      setSellMultiplier(data.sell_multiplier?.value?.toString() || '');
      setError(null);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      const currentBuy = settings.buy_multiplier?.value?.toString() || '';
      const currentSell = settings.sell_multiplier?.value?.toString() || '';
      setHasChanges(buyMultiplier !== currentBuy || sellMultiplier !== currentSell);
    }
  }, [buyMultiplier, sellMultiplier, settings]);

  const handleSave = async () => {
    if (!token || saving) return;

    const buyValue = parseFloat(buyMultiplier);
    const sellValue = parseFloat(sellMultiplier);

    if (isNaN(buyValue) || buyValue <= 0) {
      setError('Buy multiplier must be a positive number');
      return;
    }

    if (isNaN(sellValue) || sellValue <= 0) {
      setError('Sell multiplier must be a positive number');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${getApiUrl()}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: {
            buy_multiplier: buyValue,
            sell_multiplier: sellValue
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Refresh settings after successful update
      await fetchSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setBuyMultiplier(settings.buy_multiplier?.value?.toString() || '');
      setSellMultiplier(settings.sell_multiplier?.value?.toString() || '');
    }
  };

  if (loading) {
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

  if (error && !settings) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 ${className}`}>
        <div className="mb-4">
          <h3 className="text-base font-medium text-white flex items-center gap-2">
            <Settings className="w-4 h-4" />
            USD-INR Multipliers
          </h3>
        </div>
        
        <div className="text-center py-8">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <button
            onClick={fetchSettings}
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
          onClick={fetchSettings}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
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
              Current: {settings?.buy_multiplier?.value || 'N/A'}
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
              Current: {settings?.sell_multiplier?.value || 'N/A'}
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
          className="flex-1 bg-brand hover:bg-brand-hover disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
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
      {settings && (
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="text-xs text-gray-500">
            <div>Buy: Last updated {new Date(settings.buy_multiplier?.updated_at).toLocaleString()}</div>
            <div>Sell: Last updated {new Date(settings.sell_multiplier?.updated_at).toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMultiplier;
