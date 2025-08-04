import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocketEvent } from './WebSocketContext';
import { getApiUrl } from '../utils/api';
import { DCAPlan } from '../types';

interface DCAPlansData {
  plans: DCAPlan[];
  total_plans: number;
  active_plans: number;
  paused_plans: number;
}

interface AdminDCAPlansData {
  plans: DCAPlan[];
  totalCount: number;
}

interface DCAPlansUpdateData {
  plans: DCAPlan[];
  total_plans: number;
  active_plans: number;
  paused_plans: number;
  timestamp: string;
}

interface DCAPlansContextType {
  // User DCA plans
  userDCAPlans: DCAPlansData | null;
  userDCAPlansLoading: boolean;
  userDCAPlansError: string | null;
  
  // Admin DCA plans (all users)
  adminDCAPlans: AdminDCAPlansData | null;
  adminDCAPlansLoading: boolean;
  adminDCAPlansError: string | null;
  
  // Actions
  refetchUserDCAPlans: () => Promise<void>;
  refetchAdminDCAPlans: () => Promise<void>;
  
  // Computed values
  hasActivePlans: boolean;
  totalActivePlans: number;
}

const DCAPlansContext = createContext<DCAPlansContextType | undefined>(undefined);

interface DCAPlansProviderProps {
  children: ReactNode;
}

export const DCAPlansProvider: React.FC<DCAPlansProviderProps> = ({ children }) => {
  // User DCA plans state
  const [userDCAPlans, setUserDCAPlans] = useState<DCAPlansData | null>(null);
  const [userDCAPlansLoading, setUserDCAPlansLoading] = useState(true);
  const [userDCAPlansError, setUserDCAPlansError] = useState<string | null>(null);
  
  // Admin DCA plans state
  const [adminDCAPlans, setAdminDCAPlans] = useState<AdminDCAPlansData | null>(null);
  const [adminDCAPlansLoading, setAdminDCAPlansLoading] = useState(false);
  const [adminDCAPlansError, setAdminDCAPlansError] = useState<string | null>(null);
  
  const { isAuthenticated, token } = useAuth();

  // Fetch user DCA plans
  const fetchUserDCAPlans = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUserDCAPlans(null);
      setUserDCAPlansLoading(false);
      return;
    }

    setUserDCAPlansLoading(true);
    setUserDCAPlansError(null);

    try {
      const response = await fetch(`${getApiUrl()}/api/dca-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch DCA plans: ${response.status}`);
      }

      const data = await response.json();
      setUserDCAPlans({
        plans: data.plans || [],
        total_plans: data.total_plans || 0,
        active_plans: data.active_plans || 0,
        paused_plans: data.paused_plans || 0
      });
      
      console.log('📊 DCAPlansContext: Fetched user DCA plans:', data.plans?.length || 0);
    } catch (err) {
      console.error('❌ DCAPlansContext: User DCA plans fetch error:', err);
      setUserDCAPlansError(err instanceof Error ? err.message : 'Failed to fetch DCA plans');
      setUserDCAPlans({ plans: [], total_plans: 0, active_plans: 0, paused_plans: 0 });
    } finally {
      setUserDCAPlansLoading(false);
    }
  }, [isAuthenticated, token]);

  // Fetch admin DCA plans
  const fetchAdminDCAPlans = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setAdminDCAPlans(null);
      return;
    }

    setAdminDCAPlansLoading(true);
    setAdminDCAPlansError(null);

    try {
      const response = await fetch(`${getApiUrl()}/api/admin/dca-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch admin DCA plans');
      }

      const data = await response.json();
      setAdminDCAPlans({
        plans: data.plans || [],
        totalCount: data.totalCount || 0
      });
      
      console.log('📊 DCAPlansContext: Fetched admin DCA plans:', data.plans?.length || 0);
    } catch (err) {
      console.error('❌ DCAPlansContext: Admin DCA plans fetch error:', err);
      setAdminDCAPlansError(err instanceof Error ? err.message : 'Failed to fetch admin DCA plans');
      setAdminDCAPlans({ plans: [], totalCount: 0 });
    } finally {
      setAdminDCAPlansLoading(false);
    }
  }, [isAuthenticated, token]);

  // Initial fetch on mount or auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserDCAPlans();
    } else {
      setUserDCAPlans(null);
      setAdminDCAPlans(null);
      setUserDCAPlansLoading(false);
      setAdminDCAPlansLoading(false);
    }
  }, [isAuthenticated, fetchUserDCAPlans]);

  // Handle WebSocket DCA plans updates
  useWebSocketEvent<DCAPlansUpdateData>('user_dca_plans_update', (data) => {
    console.log('📊 DCAPlansContext: Received DCA plans update via WebSocket:', data);
    
    if (data && data.plans) {
      setUserDCAPlans({
        plans: data.plans,
        total_plans: data.total_plans,
        active_plans: data.active_plans,
        paused_plans: data.paused_plans
      });
      setUserDCAPlansError(null);
      setUserDCAPlansLoading(false);
    }
  });

  // Handle WebSocket updates for admin views (when any user's DCA plans change)
  useWebSocketEvent<DCAPlansUpdateData>('user_dca_plans_update', (data) => {
    // For admin views, refresh all DCA plans when any user's plans change
    if (adminDCAPlans) {
      console.log('📊 DCAPlansContext: User DCA plans changed, refreshing admin DCA plans');
      fetchAdminDCAPlans();
    }
  });

  // Computed values
  const hasActivePlans = userDCAPlans ? userDCAPlans.plans.length > 0 : false;
  const totalActivePlans = userDCAPlans ? userDCAPlans.active_plans : 0;

  const value: DCAPlansContextType = {
    // User DCA plans
    userDCAPlans,
    userDCAPlansLoading,
    userDCAPlansError,
    
    // Admin DCA plans
    adminDCAPlans,
    adminDCAPlansLoading,
    adminDCAPlansError,
    
    // Actions
    refetchUserDCAPlans: fetchUserDCAPlans,
    refetchAdminDCAPlans: fetchAdminDCAPlans,
    
    // Computed values
    hasActivePlans,
    totalActivePlans,
  };

  return (
    <DCAPlansContext.Provider value={value}>
      {children}
    </DCAPlansContext.Provider>
  );
};

// Custom hook to use DCA plans context
export const useDCAPlans = (): DCAPlansContextType => {
  const context = useContext(DCAPlansContext);
  if (context === undefined) {
    throw new Error('useDCAPlans must be used within a DCAPlansProvider');
  }
  return context;
};

export default DCAPlansContext;
