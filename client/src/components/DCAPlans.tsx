import React, { useState } from 'react';
import { Plus, Bitcoin, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { updateDCAPlanStatus, deleteDCAPlan } from '../utils/api';
import { DCAPlan } from '../types';
import Card from './Card';
import { formatRupeesForDisplay, formatBitcoinForDisplay } from '../utils/formatters';
import { useDCAPlans } from '../context/DCAPlansContext';

// Lazy load DetailsModal
import DetailsModal from './DetailsModal';

interface DCAPlansProps {
  title?: string;
  onAddPlan?: () => void;
  onPlanClick?: (plan: DCAPlan) => void;
  wrapInCard?: boolean;
  showAllUsers?: boolean; // If true, show DCA plans from all users (admin view)
  disableActions?: boolean; // If true, disable pause/resume/delete functionality
}


const DCAPlans: React.FC<DCAPlansProps> = ({
  title = 'Active DCA Plans',
  onAddPlan,
  onPlanClick,
  wrapInCard = false,
  showAllUsers = false,
  disableActions = false
}) => {
  // Use centralized DCA Plans context
  const {
    userDCAPlans,
    userDCAPlansLoading,
    userDCAPlansError,
    adminDCAPlans,
    adminDCAPlansLoading,
    adminDCAPlansError,
    refetchUserDCAPlans,
    refetchAdminDCAPlans
  } = useDCAPlans();
  
  // Select appropriate data based on showAllUsers prop
  const dcaPlans = showAllUsers ? adminDCAPlans : userDCAPlans;
  const isLoading = showAllUsers ? adminDCAPlansLoading : userDCAPlansLoading;
  const error = showAllUsers ? adminDCAPlansError : userDCAPlansError;
  const fetchDCAPlans = showAllUsers ? refetchAdminDCAPlans : refetchUserDCAPlans;
  
  // DetailsModal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<DCAPlan | null>(null);

  // No longer needed - context handles everything automatically

  const formatTimeUntilNext = (nextExecutionAt: string, planStatus: string): string => {
    // If plan is completed, there are no more executions
    if (planStatus === 'COMPLETED') {
      return 'None';
    }
    
    const now = new Date();
    // Ensure the timestamp is treated as UTC by appending 'Z' if it doesn't have timezone info
    const utcTimestamp = nextExecutionAt.includes('Z') ? nextExecutionAt : nextExecutionAt + 'Z';
    const nextExecution = new Date(utcTimestamp);
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
    
    // Check plan status first
    if (plan.status === 'COMPLETED') {
      return 'Completed';
    }
    
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
    // Show whichever amount is specified (INR or BTC)
    if (plan.amount_per_execution_inr) {
      return formatRupeesForDisplay(plan.amount_per_execution_inr);
    } else if (plan.amount_per_execution_btc) {
      return formatBitcoinForDisplay(plan.amount_per_execution_btc);
    } else {
      return 'No amount specified';
    }
  };

  const getPlanSubDetail = (plan: DCAPlan) => {
    const frequency = plan.frequency.toLowerCase();
    return `${frequency} • ${plan.status.toLowerCase()}`;
  };

  const getPlanDetails = (plan: DCAPlan) => {
    const details = [
      { label: 'Next execution', value: formatTimeUntilNext(plan.next_execution_at, plan.status), highlight: false },
      { label: 'Remaining executions', value: formatExecutionsRemaining(plan), highlight: false },
    ];

    if (plan.max_price) {
      details.push({ label: 'Max Price', value: formatRupeesForDisplay(plan.max_price), highlight: false });
    }

    if (plan.min_price) {
      details.push({ label: 'Min Price', value: formatRupeesForDisplay(plan.min_price), highlight: false });
    }

    if (plan.performance) {
      // Show performance metrics based on plan configuration
      if (plan.amount_per_execution_inr) {
        // INR-based plan: show total invested and BTC acquired
        details.push(
          { label: 'Total Invested', value: formatRupeesForDisplay(plan.performance.total_invested), highlight: true },
          { label: 'Total BTC Acquired', value: formatBitcoinForDisplay(plan.performance.total_btc), highlight: true }
        );
      } else if (plan.amount_per_execution_btc) {
        // BTC-based plan: show total BTC sold/bought and INR received/spent
        const actionLabel = plan.plan_type === 'DCA_BUY' ? 'Spent' : 'Received';
        const btcActionLabel = plan.plan_type === 'DCA_BUY' ? 'Acquired' : 'Sold';
        details.push(
          { label: `Total BTC ${btcActionLabel}`, value: formatBitcoinForDisplay(plan.performance.total_btc), highlight: true },
          { label: `Total INR ${actionLabel}`, value: formatRupeesForDisplay(plan.performance.total_invested), highlight: true }
        );
      }
      
      // Always show average price if available
      if (plan.performance.avg_price) {
        details.push({ label: 'Average Price', value: formatRupeesForDisplay(plan.performance.avg_price), highlight: false });
      }
    }

    details.push(
      { label: 'Created At', value: new Date(plan.created_at).toLocaleString(), highlight: false }
    );

    if (plan.completed_at) {
      details.push({ label: 'Completed At', value: new Date(plan.completed_at).toLocaleString(), highlight: false });
    }

    return details;
  };

  // const handlePauseResume = async (plan: DCAPlan, e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   try {
  //     const newStatus = plan.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  //     await updateDCAPlanStatus(plan.id, newStatus);
  //     // Refresh plans
  //     fetchDCAPlans();
  //   } catch (error) {
  //     console.error('Failed to update plan status:', error);
  //     // TODO: Show error message to user
  //   }
  // };

  const handlePauseResumeFromModal = async (plan: DCAPlan) => {
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

  // const handleDelete = async (plan: DCAPlan, e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   try {
  //     await deleteDCAPlan(plan.id);
  //     // Refresh plans
  //     fetchDCAPlans();
  //   } catch (error) {
  //     console.error('Failed to delete plan:', error);
  //     // TODO: Show error message to user
  //   }
  // };

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
    // Show whichever amount is specified (INR or BTC)
    let amountStr = '';
    if (plan.amount_per_execution_inr) {
      amountStr = `₹${plan.amount_per_execution_inr.toLocaleString()}`;
    } else if (plan.amount_per_execution_btc) {
      amountStr = formatBitcoinForDisplay(plan.amount_per_execution_btc);
    } else {
      amountStr = 'No amount';
    }
    return `${amountStr} • ${plan.frequency.toLowerCase()}`;
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

  // Handle case where user has no plans to display
  if (!dcaPlans || !dcaPlans.plans || dcaPlans.plans.length === 0) {
    // If this is the onboarding version (wrapInCard = false), return null to let parent handle it
    if (!wrapInCard) {
      return null;
    }
    
    // If this is the management version (wrapInCard = true), show empty state with Add Plan button
    const emptyContent = (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-medium text-white">{title}</h3>
          </div>
          {onAddPlan && !showAllUsers && (
            <button 
              onClick={onAddPlan}
              className="btn-strike-primary rounded-xl flex items-center space-x-2 px-4"
            >
              <Plus className="w-4 h-4" />
              <span>Add Plan</span>
            </button>
          )}
        </div>
        
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bitcoin className="w-6 h-6 text-brand" />
          </div>
          <h4 className="text-white font-medium mb-1">No active plans</h4>
          <p className="text-gray-400 text-xs">Your completed plans are in the transaction history below</p>
        </div>
      </div>
    );
    
    return wrapInCard ? <Card>{emptyContent}</Card> : emptyContent;
  }

  const content = (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-medium text-white">{title}</h3>
          {dcaPlans.plans && dcaPlans.plans.length > 0 && (
            <span className="bg-brand text-black text-xs px-2 py-0.5 rounded-full font-medium">
              {dcaPlans.plans.length}
            </span>
          )}
        </div>
        {onAddPlan && !showAllUsers && (
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
                      <span>Next: {formatTimeUntilNext(plan.next_execution_at, plan.status)}</span>
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
                    : plan.status === 'COMPLETED'
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {plan.status.toLowerCase()}
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
      {selectedPlan && isDetailsModalOpen && (
        <DetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={getPlanLabel(selectedPlan)}
          mainDetail={getPlanMainDetail(selectedPlan)}
          subDetail={getPlanSubDetail(selectedPlan)}
          transactionDetails={[]}
          dcaPlanDetails={getPlanDetails(selectedPlan)}
          actionButtons={!disableActions && selectedPlan.status !== 'COMPLETED' ? [
            {
              label: selectedPlan.status === 'ACTIVE' ? 'Pause Plan' : 'Resume Plan',
              onClick: () => {
                handlePauseResumeFromModal(selectedPlan);
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
          ] : undefined}
        />
      )}
    </div>
  );
  
  return wrapInCard ? <Card>{content}</Card> : content;
};

export default DCAPlans;
