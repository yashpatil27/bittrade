import { useState, useEffect } from 'react';
import { DCAPlan } from '../types';
import { getApiUrl } from '../utils/api';

interface DCAPlansResponse {
  plans: DCAPlan[];
  totalCount: number;
}

interface UseAllDCAPlansReturn {
  dcaPlans: DCAPlansResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchAllDCAPlans: () => void;
}

const useAllDCAPlans = (): UseAllDCAPlansReturn => {
  const [dcaPlans, setDcaPlans] = useState<DCAPlansResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllDCAPlans = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('bittrade_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getApiUrl()}/api/admin/dca-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch DCA plans');
      }

      const data = await response.json();
      setDcaPlans({
        plans: data.plans || [],
        totalCount: data.totalCount || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch DCA plans');
      console.error('Error fetching all DCA plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDCAPlans();
  }, []);

  return {
    dcaPlans,
    isLoading,
    error,
    fetchAllDCAPlans
  };
};

export default useAllDCAPlans;
