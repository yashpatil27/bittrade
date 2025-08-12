import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocketEvent } from './WebSocketContext';
import { getApiUrl } from '../utils/api';
import { Transaction, DCAPlan } from '../types';
import logger from '../utils/logger';

// =============================================
// INTERFACES & TYPES
// =============================================

// Balance Types
interface BalanceData {
  available_inr: number;
  available_btc: number;
  reserved_inr: number;
  reserved_btc: number;
  collateral_btc: number;
  borrowed_inr: number;
  interest_accrued: number;
}

interface AdminTotalBalanceData {
  total_available_inr: number;
  total_available_btc: number;
  total_reserved_inr: number;
  total_reserved_btc: number;
  total_collateral_btc: number;
  total_borrowed_inr: number;
  total_interest_accrued: number;
}

// User Management Types
interface UserWithBalance {
  id: string;
  name: string;
  email: string;
  btcBalance: number;
  inrBalance: number;
  is_admin?: boolean;
  created_at?: string;
}

// DCA Plans Types
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

// WebSocket Event Types
interface TransactionUpdateData {
  transactions: Transaction[];
  timestamp: string;
}

interface DCAPlansUpdateData {
  plans: DCAPlan[];
  total_plans: number;
  active_plans: number;
  paused_plans: number;
  timestamp: string;
}

interface AdminUserUpdateData {
  users: UserWithBalance[];
  totalCount: number;
  adminCount: number;
  regularCount: number;
  timestamp: string;
}

interface AdminDCAPlansUpdateData {
  plans: DCAPlan[];
  totalCount: number;
  timestamp: string;
}

// Loading States
interface PortfolioLoadingStates {
  userBalance: boolean;
  userTransactions: boolean;
  userDCAPlans: boolean;
  adminBalance: boolean;
  adminTransactions: boolean;
  adminDCAPlans: boolean;
  adminUsers: boolean;
}

// Error States
interface PortfolioErrorStates {
  userBalance: string | null;
  userTransactions: string | null;
  userDCAPlans: string | null;
  adminBalance: string | null;
  adminTransactions: string | null;
  adminDCAPlans: string | null;
  adminUsers: string | null;
}

// Main Context Type
interface PortfolioContextType {
  // ============= USER DATA =============
  userBalance: BalanceData | null;
  userTransactions: Transaction[];
  userDCAPlans: DCAPlansData | null;
  
  // ============= ADMIN DATA =============
  adminBalance: AdminTotalBalanceData | null;
  adminTransactions: Transaction[];
  adminDCAPlans: AdminDCAPlansData | null;
  adminUsers: UserWithBalance[];
  
  // ============= LOADING STATES =============
  loading: PortfolioLoadingStates;
  
  // ============= ERROR STATES =============
  errors: PortfolioErrorStates;
  
  // ============= USER ACTIONS =============
  refetchUserBalance: () => Promise<void>;
  refetchUserTransactions: (page?: number, limit?: number) => Promise<void>;
  refetchUserDCAPlans: () => Promise<void>;
  
  // ============= ADMIN ACTIONS =============
  refetchAdminBalance: () => Promise<void>;
  refetchAdminTransactions: () => Promise<void>;
  refetchAdminDCAPlans: () => Promise<void>;
  refetchAdminUsers: () => Promise<void>;
  
  // ============= BATCH ACTIONS =============
  refetchUserData: () => Promise<void>;
  refetchAdminData: () => Promise<void>;
  refetchAllData: () => Promise<void>;
  
  // ============= TRANSACTION UTILITIES =============
  getPendingOrders: (isAdmin?: boolean) => Transaction[];
  getDCATransactions: (isAdmin?: boolean) => Transaction[];
  getCompletedTransactions: (isAdmin?: boolean) => Transaction[];
  getRecentTransactions: (limit: number, isAdmin?: boolean) => Transaction[];
  
  // ============= PAGINATION =============
  hasMoreUserTransactions: boolean;
  userTransactionsPage: number;
  
  // ============= COMPUTED VALUES =============
  // User DCA computed values
  hasActivePlans: boolean;
  hasAnyPlans: boolean;
  totalActivePlans: number;
  
  // Admin user computed values
  totalUsers: number;
  adminUsersFiltered: UserWithBalance[];
  regularUsers: UserWithBalance[];
}

// =============================================
// CONTEXT CREATION & PROVIDER
// =============================================

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

interface PortfolioProviderProps {
  children: ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({ children }) => {
  // ============= STATE MANAGEMENT =============
  
  // User Data States
  const [userBalance, setUserBalance] = useState<BalanceData | null>(null);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userDCAPlans, setUserDCAPlans] = useState<DCAPlansData | null>(null);
  
  // Admin Data States
  const [adminBalance, setAdminBalance] = useState<AdminTotalBalanceData | null>(null);
  const [adminTransactions, setAdminTransactions] = useState<Transaction[]>([]);
  const [adminDCAPlans, setAdminDCAPlans] = useState<AdminDCAPlansData | null>(null);
  const [adminUsers, setAdminUsers] = useState<UserWithBalance[]>([]);
  
  // Pagination States
  const [hasMoreUserTransactions, setHasMoreUserTransactions] = useState(true);
  const [userTransactionsPage, setUserTransactionsPage] = useState(1);
  
  // Loading States
  const [loading, setLoading] = useState<PortfolioLoadingStates>({
    userBalance: true,
    userTransactions: true,
    userDCAPlans: true,
    adminBalance: false,
    adminTransactions: false,
    adminDCAPlans: false,
    adminUsers: false,
  });
  
  // Error States
  const [errors, setErrors] = useState<PortfolioErrorStates>({
    userBalance: null,
    userTransactions: null,
    userDCAPlans: null,
    adminBalance: null,
    adminTransactions: null,
    adminDCAPlans: null,
    adminUsers: null,
  });
  
  const { isAuthenticated, token, user } = useAuth();
  
  // ============= UTILITY FUNCTIONS =============
  
  const setLoadingState = useCallback((key: keyof PortfolioLoadingStates, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const setErrorState = useCallback((key: keyof PortfolioErrorStates, value: string | null) => {
    setErrors(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const createAuthHeaders = useCallback(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }), [token]);
  
  // ============= USER DATA FETCHING =============
  
  // Fetch User Balance
  const fetchUserBalance = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUserBalance(null);
      setLoadingState('userBalance', false);
      return;
    }
    
    setLoadingState('userBalance', true);
    setErrorState('userBalance', null);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/balance`, {
        headers: createAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user balance');
      }
      
      const data = await response.json();
      setUserBalance(data);
    } catch (err) {
      logger.error('User balance fetch failed', err, { component: 'PortfolioContext' });
      setErrorState('userBalance', err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setLoadingState('userBalance', false);
    }
  }, [isAuthenticated, token, createAuthHeaders, setLoadingState, setErrorState]);
  
  // Fetch User Transactions
  const fetchUserTransactions = useCallback(async (requestedPage: number = 1, limit: number = 50) => {
    if (!isAuthenticated || !token) {
      setUserTransactions([]);
      setLoadingState('userTransactions', false);
      return;
    }
    
    setLoadingState('userTransactions', true);
    setErrorState('userTransactions', null);
    
    try {
      const response = await fetch(
        `${getApiUrl()}/api/transactions?page=${requestedPage}&limit=${limit}`,
        {
          headers: createAuthHeaders(),
        }
      );
      
      if (!response.ok) {
        if (response.status === 403) {
          localStorage.removeItem('bittrade_token');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (requestedPage === 1) {
        setUserTransactions(data.transactions || []);
      } else {
        setUserTransactions(prev => [...prev, ...(data.transactions || [])]);
      }
      
      setHasMoreUserTransactions(data.hasMore || false);
      setUserTransactionsPage(requestedPage);
    } catch (err) {
      logger.error('User transactions fetch failed', err, { component: 'PortfolioContext' });
      setErrorState('userTransactions', err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoadingState('userTransactions', false);
    }
  }, [isAuthenticated, token, createAuthHeaders, setLoadingState, setErrorState]);
  
  // Fetch User DCA Plans
  const fetchUserDCAPlans = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUserDCAPlans(null);
      setLoadingState('userDCAPlans', false);
      return;
    }
    
    setLoadingState('userDCAPlans', true);
    setErrorState('userDCAPlans', null);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/dca-plans`, {
        headers: createAuthHeaders()
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
    } catch (err) {
      logger.error('User DCA plans fetch failed', err, { component: 'PortfolioContext' });
      setErrorState('userDCAPlans', err instanceof Error ? err.message : 'Failed to fetch DCA plans');
      setUserDCAPlans({ plans: [], total_plans: 0, active_plans: 0, paused_plans: 0 });
    } finally {
      setLoadingState('userDCAPlans', false);
    }
  }, [isAuthenticated, token, createAuthHeaders, setLoadingState, setErrorState]);
  
  // ============= ADMIN DATA FETCHING =============
  
  // Fetch Admin Balance
  const fetchAdminBalance = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setAdminBalance(null);
      return;
    }
    
    setLoadingState('adminBalance', true);
    setErrorState('adminBalance', null);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/total-balance`, {
        headers: createAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch admin balance');
      }
      
      const data = await response.json();
      setAdminBalance(data);
    } catch (err) {
      logger.error('Admin balance fetch failed', err, { component: 'PortfolioContext' });
      setErrorState('adminBalance', err instanceof Error ? err.message : 'Failed to fetch admin balance');
    } finally {
      setLoadingState('adminBalance', false);
    }
  }, [isAuthenticated, token, createAuthHeaders, setLoadingState, setErrorState]);
  
  // Fetch Admin Transactions
  const fetchAdminTransactions = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setAdminTransactions([]);
      return;
    }
    
    setLoadingState('adminTransactions', true);
    setErrorState('adminTransactions', null);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/transactions`, {
        headers: createAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch admin transactions');
      }
      
      const data = await response.json();
      setAdminTransactions(data.transactions || []);
    } catch (err) {
      logger.error('Admin transactions fetch failed', err, { component: 'PortfolioContext' });
      setErrorState('adminTransactions', err instanceof Error ? err.message : 'Failed to fetch admin transactions');
    } finally {
      setLoadingState('adminTransactions', false);
    }
  }, [isAuthenticated, token, createAuthHeaders, setLoadingState, setErrorState]);
  
  // Fetch Admin DCA Plans
  const fetchAdminDCAPlans = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setAdminDCAPlans(null);
      return;
    }
    
    setLoadingState('adminDCAPlans', true);
    setErrorState('adminDCAPlans', null);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/dca-plans`, {
        headers: createAuthHeaders()
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
    } catch (err) {
      logger.error('Admin DCA plans fetch failed', err, { component: 'PortfolioContext' });
      setErrorState('adminDCAPlans', err instanceof Error ? err.message : 'Failed to fetch admin DCA plans');
    } finally {
      setLoadingState('adminDCAPlans', false);
    }
  }, [isAuthenticated, token, createAuthHeaders, setLoadingState, setErrorState]);
  
  // Fetch Admin Users
  const fetchAdminUsers = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setAdminUsers([]);
      setLoadingState('adminUsers', false);
      return;
    }
    
    setLoadingState('adminUsers', true);
    setErrorState('adminUsers', null);
    
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/users`, {
        headers: createAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      setAdminUsers(data.users || []);
    } catch (err) {
      logger.error('Admin users fetch failed', err, { component: 'PortfolioContext' });
      setErrorState('adminUsers', err instanceof Error ? err.message : 'Failed to fetch users');
      setAdminUsers([]);
    } finally {
      setLoadingState('adminUsers', false);
    }
  }, [isAuthenticated, token, createAuthHeaders, setLoadingState, setErrorState]);
  
  // ============= BATCH ACTIONS =============
  
  const fetchUserData = useCallback(async () => {
    await Promise.all([
      fetchUserBalance(),
      fetchUserTransactions(1),
      fetchUserDCAPlans()
    ]);
  }, [fetchUserBalance, fetchUserTransactions, fetchUserDCAPlans]);
  
  const fetchAdminData = useCallback(async () => {
    await Promise.all([
      fetchAdminBalance(),
      fetchAdminTransactions(),
      fetchAdminDCAPlans(),
      fetchAdminUsers()
    ]);
  }, [fetchAdminBalance, fetchAdminTransactions, fetchAdminDCAPlans, fetchAdminUsers]);
  
  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchUserData(),
      fetchAdminData()
    ]);
  }, [fetchUserData, fetchAdminData]);
  
  // ============= WEBSOCKET EVENT HANDLERS =============
  
  // Handle User Balance Updates
  useWebSocketEvent<BalanceData>('user_balance_update', (data) => {
    setUserBalance(data);
    setLoadingState('userBalance', false);
    
    // If admin balance exists, refresh it too since user balance changed
    if (adminBalance) {
      fetchAdminBalance();
    }
  });
  
  // Handle User Transaction Updates
  useWebSocketEvent<TransactionUpdateData>('user_transaction_update', (data) => {
    if (data && data.transactions) {
      setUserTransactions(data.transactions);
      setErrorState('userTransactions', null);
      setLoadingState('userTransactions', false);
    }
  });
  
  // Handle Admin Transaction Updates
  useWebSocketEvent<TransactionUpdateData>('admin_transaction_update', (data) => {
    if (data && data.transactions) {
      setAdminTransactions(data.transactions);
      setErrorState('adminTransactions', null);
      setLoadingState('adminTransactions', false);
    }
  });
  
  // Handle User DCA Plans Updates
  useWebSocketEvent<DCAPlansUpdateData>('user_dca_plans_update', (data) => {
    if (data && data.plans) {
      setUserDCAPlans({
        plans: data.plans,
        total_plans: data.total_plans,
        active_plans: data.active_plans,
        paused_plans: data.paused_plans
      });
      setErrorState('userDCAPlans', null);
      setLoadingState('userDCAPlans', false);
      
      // Refresh admin DCA plans if they exist
      if (adminDCAPlans) {
        fetchAdminDCAPlans();
      }
    }
  });
  
  // Handle Admin DCA Plans Updates
  useWebSocketEvent<AdminDCAPlansUpdateData>('admin_dca_plans_update', (data) => {
    if (data && data.plans) {
      setAdminDCAPlans({
        plans: data.plans,
        totalCount: data.totalCount
      });
      setErrorState('adminDCAPlans', null);
      setLoadingState('adminDCAPlans', false);
    }
  });
  
  // Handle Admin User Updates
  useWebSocketEvent<AdminUserUpdateData>('admin_user_update', (data) => {
    if (data && data.users) {
      setAdminUsers(data.users);
      setErrorState('adminUsers', null);
      setLoadingState('adminUsers', false);
      
      // Also refresh admin balance since user balances changed
      fetchAdminBalance();
    }
  });
  
  // ============= TRANSACTION UTILITIES =============
  
  const getPendingOrders = useCallback((isAdmin: boolean = false): Transaction[] => {
    const transactions = isAdmin ? adminTransactions : userTransactions;
    return transactions.filter(txn => 
      txn.status === 'PENDING' && (txn.type === 'LIMIT_BUY' || txn.type === 'LIMIT_SELL')
    );
  }, [userTransactions, adminTransactions]);
  
  const getDCATransactions = useCallback((isAdmin: boolean = false): Transaction[] => {
    const transactions = isAdmin ? adminTransactions : userTransactions;
    return transactions.filter(txn => txn.type === 'DCA_BUY' || txn.type === 'DCA_SELL');
  }, [userTransactions, adminTransactions]);
  
  const getCompletedTransactions = useCallback((isAdmin: boolean = false): Transaction[] => {
    const transactions = isAdmin ? adminTransactions : userTransactions;
    return transactions.filter(txn => 
      !(txn.status === 'PENDING' && (txn.type === 'LIMIT_BUY' || txn.type === 'LIMIT_SELL'))
    );
  }, [userTransactions, adminTransactions]);
  
  const getRecentTransactions = useCallback((limit: number, isAdmin: boolean = false): Transaction[] => {
    const transactions = getCompletedTransactions(isAdmin);
    return transactions.slice(0, limit);
  }, [getCompletedTransactions]);
  
  // ============= COMPUTED VALUES =============
  
  // User DCA computed values
  const hasActivePlans = userDCAPlans ? userDCAPlans.plans.length > 0 : false;
  const hasAnyPlans = userDCAPlans ? userDCAPlans.total_plans > 0 : false;
  const totalActivePlans = userDCAPlans ? userDCAPlans.active_plans : 0;
  
  // Admin user computed values
  const totalUsers = adminUsers.length;
  const adminUsersFiltered = adminUsers.filter(user => user.is_admin);
  const regularUsers = adminUsers.filter(user => !user.is_admin);
  
  // ============= EFFECTS =============
  
  // Initial data fetch on authentication change
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
      
      // Also fetch admin data if user is an admin
      if (user?.is_admin) {
        fetchAdminData();
      }
    } else {
      // Reset all state when not authenticated
      setUserBalance(null);
      setUserTransactions([]);
      setUserDCAPlans(null);
      setAdminBalance(null);
      setAdminTransactions([]);
      setAdminDCAPlans(null);
      setAdminUsers([]);
      setLoading({
        userBalance: false,
        userTransactions: false,
        userDCAPlans: false,
        adminBalance: false,
        adminTransactions: false,
        adminDCAPlans: false,
        adminUsers: false,
      });
    }
  }, [isAuthenticated, user?.is_admin, fetchUserData, fetchAdminData]);
  
  // ============= CONTEXT VALUE =============
  
  const value: PortfolioContextType = {
    // User Data
    userBalance,
    userTransactions,
    userDCAPlans,
    
    // Admin Data
    adminBalance,
    adminTransactions,
    adminDCAPlans,
    adminUsers,
    
    // Loading States
    loading,
    
    // Error States
    errors,
    
    // User Actions
    refetchUserBalance: fetchUserBalance,
    refetchUserTransactions: fetchUserTransactions,
    refetchUserDCAPlans: fetchUserDCAPlans,
    
    // Admin Actions
    refetchAdminBalance: fetchAdminBalance,
    refetchAdminTransactions: fetchAdminTransactions,
    refetchAdminDCAPlans: fetchAdminDCAPlans,
    refetchAdminUsers: fetchAdminUsers,
    
    // Batch Actions
    refetchUserData: fetchUserData,
    refetchAdminData: fetchAdminData,
    refetchAllData: fetchAllData,
    
    // Transaction Utilities
    getPendingOrders,
    getDCATransactions,
    getCompletedTransactions,
    getRecentTransactions,
    
    // Pagination
    hasMoreUserTransactions,
    userTransactionsPage,
    
    // Computed Values
    hasActivePlans,
    hasAnyPlans,
    totalActivePlans,
    totalUsers,
    adminUsersFiltered,
    regularUsers,
  };
  
  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

// =============================================
// MAIN HOOK
// =============================================

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

export default PortfolioContext;
