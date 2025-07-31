import { useState, useEffect, useCallback } from 'react';
import { useWebSocketEvent } from '../context/WebSocketContext';
import { getDCAPlans } from '../utils/api';
import { DCAPlan } from '../types';

interface DCAPlansResponse {
  plans: DCAPlan[];
  total_plans: number;
  active_plans: number;
  paused_plans: number;
}

interface DCAPlansUpdateData {
  plans: DCAPlan[];
  total_plans: number;
  active_plans: number;
  paused_plans: number;
  timestamp: string;
}

interface UseDCAPlansUpdatesReturn {
  dcaPlans: DCAPlansResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchDCAPlans: () => Promise<void>;
}

export const useDCAPlansUpdates = (): UseDCAPlansUpdatesReturn => {
  const [dcaPlans, setDcaPlans] = useState<DCAPlansResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for WebSocket DCA plans updates
  useWebSocketEvent<DCAPlansUpdateData>('user_dca_plans_update', (data) => {
    console.log('📡 Received DCA plans update:', data);
    
    if (data && data.plans) {
      // Update with the latest DCA plans from WebSocket
      setDcaPlans({
        plans: data.plans,
        total_plans: data.total_plans,
        active_plans: data.active_plans,
        paused_plans: data.paused_plans
      });
      setError(null);
    }
  });

  // Fetch DCA plans from REST API (fallback and initial load)
  const fetchDCAPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const plansData = await getDCAPlans();
      setDcaPlans(plansData);
    } catch (error) {
      console.error('Failed to fetch DCA plans:', error);
      setError('Failed to load DCA plans');
      const emptyPlans = { plans: [], total_plans: 0, active_plans: 0, paused_plans: 0 };
      setDcaPlans(emptyPlans);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchDCAPlans();
  }, [fetchDCAPlans]);

  return {
    dcaPlans,
    isLoading,
    error,
    fetchDCAPlans,
  };
};

export default useDCAPlansUpdates;
