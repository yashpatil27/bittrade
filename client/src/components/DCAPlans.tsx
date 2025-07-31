import React, { useState } from 'react';
import { Play, Pause, Trash2, Clock, BarChart3, Plus, Bitcoin, DollarSign } from 'lucide-react';
import { updateDCAPlanStatus, deleteDCAPlan } from '../utils/api';
import { DCAPlan } from '../types';
import Card from './Card';
import DetailsModal from './DetailsModal';
import { formatRupeesForDisplay, formatBitcoinForDisplay } from '../utils/formatters';
import useDCAPlansUpdates from '../hooks/useDCAPlansUpdates';

interface DCAPlansProps {
  title?: string;
  onAddPlan?: () => void;
  onPlanClick?: (plan: DCAPlan) => void;
  wrapInCard?: boolean;
  onPlansLoaded?: (hasPlans: boolean) => void;
}


const DCAPlans: React.FC<DCAPlansProps> = ({
  title = 'Active DCA Plans',
  onAddPlan,
  onPlanClick,
  wrapInCard = false,
  onPlansLoaded
}) => {
  const { dcaPlans, isLoading, error, fetchDCAPlans } = useDCAPlansUpdates();
  
  // DetailsModal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<DCAPlan | null>(null);

  // Notify parent component about plans status when dcaPlans changes
  React.useEffect(() => {
    if (onPlansLoaded && dcaPlans) {
      onPlansLoaded(dcaPlans.plans.length > 0);
    }
  }, [dcaPlans, onPlansLoaded]);

  const formatTimeUntilNext = (nextExecutionAt: string): string => {
    const now = new Date();
    const nextExecution = new Date(nextExecutionAt);
    const diffMs = nextExecution.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Soon';
    }
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `in ${diffMinutes} min${diffMinutes === 1 ? '' : 's'}`;
    } else if (diffHours < 24) {
      return `in ${diffHours} hr${diffHours === 1 ? '' : 's'}`;
    } else if (diffDays < 7) {
      return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    } else {
      const diffWeeks = Math.floor(diffDays / 7);
      return `in ${diffWeeks} week${diffWeeks === 1 ? '' : 's'}`;
    }
  };

  const formatExecutionsRemaining = (plan: DCAPlan): string => {
    const remainingExecutions = plan.remaining_executions;
    
    if (remainingExecutions == null) {
      return 'Unlimited';
    }
    
    if (remainingExecutions <= 0) {
      return 'Completed';
    }
    
    return `${remainingExecutions} execution${remainingExecutions === 1 ? '' : 's'} left`;
  };

  const handlePlanClick = (plan: DCAPlan) => {
    // Open DetailsModal if onPlanClick prop is provided
    if (onPlanClick) {
      setSelectedPlan(plan);
      setIsDetailsModalOpen(true);
    }
  };

  const getPlanMainDetail = (plan: DCAPlan) => {
    return formatRupeesForDisplay(plan.amount_per_execution);
  };

  const getPlanSubDetail = (plan: DCAPlan) => {
    const frequency = plan.frequency.toLowerCase();
    return `${frequency} • ${plan.status.toLowerCase()}`;
  };

  const getPlanDetails = (plan: DCAPlan) => {
    const details = [
      { label: 'Next execution', value: formatTimeUntilNext(plan.next_execution_at), highlight: false },
      { label: 'Remaining executions', value: formatExecutionsRemaining(plan), highlight: false },
    ];

    if (plan.max_price) {
      details.push({ label: 'Max Price', value: formatRupeesForDisplay(plan.max_price), highlight: false });
    }

    if (plan.min_price) {
      details.push({ label: 'Min Price', value: formatRupeesForDisplay(plan.min_price), highlight: false });
    }

    if (plan.performance) {
      details.push(
        { label: 'Total Invested', value: formatRupeesForDisplay(plan.performance.total_invested), highlight: true },
        { label: 'Total BTC', value: formatBitcoinForDisplay(plan.performance.total_btc), highlight: true },
        { label: 'Average Price', value: formatRupeesForDisplay(plan.performance.avg_price), highlight: false }
      );
    }

    details.push(
      { label: 'Created At', value: new Date(plan.created_at).toLocaleString(), highlight: false }
    );

    if (plan.completed_at) {
      details.push({ label: 'Completed At', value: new Date(plan.completed_at).toLocaleString(), highlight: false });
    }

    return details;
  };

  const handlePauseResume = async (plan: DCAPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = plan.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await updateDCAPlanStatus(plan.id, newStatus);
      // Refresh plans
      fetchDCAPlans();
    } catch (error) {
      console.error('Failed to update plan status:', error);
      // TODO: Show error message to user
    }
  };

  const handleDelete = async (plan: DCAPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDCAPlan(plan.id);
      // Refresh plans
      fetchDCAPlans();
    } catch (error) {
      console.error('Failed to delete plan:', error);
      // TODO: Show error message to user
    }
  };

  const getPlanIcon = (planType: string) => {
    return planType === 'DCA_BUY' ? (
      <div className="p-2 bg-green-500/10 rounded-lg">
        <Bitcoin className="text-green-400 w-5 h-5" />
      </div>
    ) : (
      <div className="p-2 bg-red-500/10 rounded-lg">
        <DollarSign className="text-red-400 w-5 h-5" />
      </div>
    );
  };

  const getPlanLabel = (plan: DCAPlan) => {
    return plan.plan_type === 'DCA_BUY' ? 'DCA Buy Plan' : 'DCA Sell Plan';
  };

  const getPlanSubLabel = (plan: DCAPlan) => {
    return `₹${plan.amount_per_execution.toLocaleString()} • ${plan.frequency.toLowerCase()}`;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm">
          Loading DCA plans...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-sm">
          Error: {error}
        </p>
      </div>
    );
  }

  // Don't render anything if no plans exist
  if (!dcaPlans || dcaPlans.plans.length === 0) {
    return null;
  }

  const content = (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-medium text-white">{title}</h3>
          {dcaPlans.plans.length > 0 && (
            <span className="bg-brand text-black text-xs px-2 py-0.5 rounded-full font-medium">
              {dcaPlans.plans.length}
            </span>
          )}
        </div>
        {onAddPlan && (
          <button 
            onClick={onAddPlan}
            className="btn-strike-primary rounded-xl flex items-center space-x-2 px-4"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plan</span>
          </button>
        )}
      </div>
      
      <div className="space-y-0">
        {dcaPlans.plans.map((plan, index) => (
          <div key={plan.id}>
            <div 
              className={`flex items-center justify-between py-4 ${onPlanClick ? 'cursor-pointer hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors' : ''}`}
              onClick={() => handlePlanClick(plan)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getPlanIcon(plan.plan_type)}
                </div>
                <div>
                  <p className="text-sm font-light text-white">{getPlanLabel(plan)}</p>
                  <p className="text-xs text-gray-400">{getPlanSubLabel(plan)}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Next: {formatTimeUntilNext(plan.next_execution_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BarChart3 className="w-3 h-3" />
                      <span>{formatExecutionsRemaining(plan)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  plan.status === 'ACTIVE' 
                    ? 'bg-green-500/10 text-green-400' 
                    : plan.status === 'PAUSED' 
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {plan.status.toLowerCase()}
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    className="bg-gray-600 hover:bg-gray-500 text-white rounded-full p-1.5 transition-colors"
                    onClick={(e) => handlePauseResume(plan, e)}
                    title={plan.status === 'ACTIVE' ? 'Pause plan' : 'Resume plan'}
                  >
                    {plan.status === 'ACTIVE' ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-500 text-white rounded-full p-1.5 transition-colors"
                    onClick={(e) => handleDelete(plan, e)}
                    title="Delete plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            {index < dcaPlans.plans.length - 1 && (
              <div className="border-b border-gray-800"></div>
            )}
          </div>
        ))}
      </div>
      
      {/* Details Modal */}
      {selectedPlan && (
        <DetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={getPlanLabel(selectedPlan)}
          mainDetail={getPlanMainDetail(selectedPlan)}
          subDetail={getPlanSubDetail(selectedPlan)}
          transactionDetails={[]}
          dcaPlanDetails={getPlanDetails(selectedPlan)}
          actionButtons={[
            {
              label: selectedPlan.status === 'ACTIVE' ? 'Pause Plan' : 'Resume Plan',
              onClick: () => {
                handlePauseResume(selectedPlan, {} as React.MouseEvent);
                setIsDetailsModalOpen(false);
              },
              variant: selectedPlan.status === 'ACTIVE' ? 'warning' : 'success'
            },
            {
              label: 'Cancel Plan',
              onClick: async () => {
                try {
                  await deleteDCAPlan(selectedPlan.id);
                  // Refresh plans list
                  fetchDCAPlans();
                  setIsDetailsModalOpen(false);
                } catch (error) {
                  console.error('Failed to delete DCA plan:', error);
                  // TODO: Show error message to user
                }
              },
              variant: 'danger'
            }
          ]}
        />
      )}
    </div>
  );
  
  return wrapInCard ? <Card>{content}</Card> : content;
};

export default DCAPlans;
