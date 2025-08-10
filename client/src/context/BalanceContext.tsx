import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocketEvent } from './WebSocketContext';
import { getApiUrl } from '../utils/api';

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

interface UserWithBalance {
  id: string;
  name: string;
  email: string;
  btcBalance: number;
  inrBalance: number;
  is_admin?: boolean;
  created_at?: string;
}

interface AdminUserUpdateData {
  users: UserWithBalance[];
  totalCount: number;
  adminCount: number;
  regularCount: number;
  timestamp: string;
}

interface BalanceContextType {
  // Individual user balance
  balanceData: BalanceData | null;
  isLoading: boolean;
  error: string | null;
  refetchBalance: () => Promise<void>;
  
  // Admin total balance
  adminBalanceData: AdminTotalBalanceData | null;
  refetchAdminBalance: () => Promise<void>;
  
  // Admin user management
  users: UserWithBalance[];
  usersLoading: boolean;
  usersError: string | null;
  refetchUsers: () => Promise<void>;
  
  // Computed user values
  totalUsers: number;
  adminUsers: UserWithBalance[];
  regularUsers: UserWithBalance[];
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

interface BalanceProviderProps {
  children: ReactNode;
}

export const BalanceProvider: React.FC<BalanceProviderProps> = ({ children }) => {
  // Individual user balance state
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Admin total balance state
  const [adminBalanceData, setAdminBalanceData] = useState<AdminTotalBalanceData | null>(null);
  
  // Admin users management state
  const [users, setUsers] = useState<UserWithBalance[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  
  const { isAuthenticated, token } = useAuth();
  // Get WebSocket connection (for future use)
  // const { socket, isConnected } = useWebSocket();

  // Function to fetch user balance
  const fetchUserBalance = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setBalanceData(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${getApiUrl()}/api/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBalanceData(data);
        console.log('📊 BalanceContext: Fetched user balance:', data);
      } else {
        console.error('❌ BalanceContext: Balance fetch failed:', response.status, response.statusText);
        setError('Failed to fetch balance');
      }
    } catch (err) {
      console.error('❌ BalanceContext: Balance fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  // Function to fetch admin total balance
  const fetchAdminBalance = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setAdminBalanceData(null);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${getApiUrl()}/api/admin/total-balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdminBalanceData(data);
        console.log('📊 BalanceContext: Fetched admin balance:', data);
      } else {
        console.error('❌ BalanceContext: Admin balance fetch failed:', response.status, response.statusText);
        setError('Failed to fetch admin balance');
      }
    } catch (err) {
      console.error('❌ BalanceContext: Admin balance fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch admin balance');
    }
  }, [isAuthenticated, token]);

  // Function to fetch admin users
  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setUsers([]);
      setUsersLoading(false);
      return;
    }

    setUsersLoading(true);
    setUsersError(null);

    try {
      const response = await fetch(`${getApiUrl()}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      
      console.log('📊 BalanceContext: Fetched users:', data.users?.length || 0);
    } catch (err) {
      console.error('❌ BalanceContext: Users fetch error:', err);
      setUsersError(err instanceof Error ? err.message : 'Failed to fetch users');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [isAuthenticated, token]);

  // Initial fetch on mount or auth change
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserBalance();
      // Try to fetch users (will only work for admin users)
      fetchUsers();
    } else {
      setBalanceData(null);
      setAdminBalanceData(null);
      setUsers([]);
      setIsLoading(false);
      setUsersLoading(false);
    }
  }, [isAuthenticated, fetchUserBalance, fetchUsers]);

  // Handle WebSocket balance updates for individual users
  useWebSocketEvent<BalanceData>('user_balance_update', (data) => {
    console.log('📊 BalanceContext: Received balance update via WebSocket:', data);
    setBalanceData(data);
    setIsLoading(false);
  });

  // Handle WebSocket balance updates for admin views (refresh totals when any user balance changes)
  useWebSocketEvent<BalanceData>('user_balance_update', (data) => {
    // For admin views, refresh total balance when any user balance changes
    if (adminBalanceData) {
      console.log('📊 BalanceContext: User balance changed, refreshing admin total balance');
      fetchAdminBalance();
    }
  });

  // Handle dedicated admin user updates via WebSocket
  useWebSocketEvent<AdminUserUpdateData>('admin_user_update', (data) => {
    console.log('📊 BalanceContext: Received admin user update via WebSocket:', data);
    
    if (data && data.users) {
      setUsers(data.users);
      setUsersError(null);
      setUsersLoading(false);
    }
  });

  // Computed values for users
  const totalUsers = users.length;
  const adminUsers = users.filter(user => user.is_admin);
  const regularUsers = users.filter(user => !user.is_admin);

  const value: BalanceContextType = {
    // Individual user balance
    balanceData,
    isLoading,
    error,
    refetchBalance: fetchUserBalance,
    
    // Admin total balance
    adminBalanceData,
    refetchAdminBalance: fetchAdminBalance,
    
    // Admin user management
    users,
    usersLoading,
    usersError,
    refetchUsers: fetchUsers,
    
    // Computed user values
    totalUsers,
    adminUsers,
    regularUsers,
  };

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
};

// Custom hook to use balance context
export const useBalance = (): BalanceContextType => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};

// Convenience hook for components that only need user management functionality
export const useUsers = () => {
  const {
    users,
    usersLoading,
    usersError,
    refetchUsers,
    totalUsers,
    adminUsers,
    regularUsers,
  } = useBalance();
  
  return {
    users,
    usersLoading,
    usersError,
    refetchUsers,
    totalUsers,
    adminUsers,
    regularUsers,
  };
};

export default BalanceContext;
