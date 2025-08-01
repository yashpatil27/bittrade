import useDCAPlansUpdates from './useDCAPlansUpdates';
import useAllDCAPlans from './useAllDCAPlans';

interface UseDCAPlansDataReturn {
  dcaPlans: any;
  isLoading: boolean;
  error: string | null;
  fetchDCAPlans: () => void;
}

const useDCAPlansData = (isAdminView: boolean = false): UseDCAPlansDataReturn => {
  const userPlans = useDCAPlansUpdates();
  const adminPlans = useAllDCAPlans();
  
  if (isAdminView) {
    return {
      ...adminPlans,
      fetchDCAPlans: adminPlans.fetchAllDCAPlans
    };
  }
  
  return userPlans;
};

export default useDCAPlansData;
