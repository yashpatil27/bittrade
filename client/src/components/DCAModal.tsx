import React, { useState, useEffect } from 'react';
import SingleInputModal from './SingleInputModal';
import ConfirmationModal from './ConfirmationModal';
import OptionsModal from './OptionsModal';
import { formatRupeesForDisplay, formatBitcoinForDisplay } from '../utils/formatters';
import { AnimateINR, AnimateBTC } from './AnimateNumberFlow';
import { createDCAPlan } from '../utils/api';
import { Bitcoin, DollarSign, Calendar, Repeat, Target, Clock } from 'lucide-react';

interface BalanceData {
  available_inr: number;
  available_btc: number;
  reserved_inr: number;
  reserved_btc: number;
  collateral_btc: number;
  borrowed_inr: number;
  interest_accrued: number;
}

interface DCAModalProps {
  isOpen: boolean;
  onClose: () => void;
  balanceData?: BalanceData | null;
  onComplete?: (dcaPlan: DCAPlanData) => void;
  initialAmount?: string;
  initialPlanType?: 'DCA_BUY' | 'DCA_SELL';
}

interface DCAPlanData {
  plan_type: 'DCA_BUY' | 'DCA_SELL';
  frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  amount_per_execution_inr?: number;
  amount_per_execution_btc?: number;
  remaining_executions?: number; // undefined for unlimited
  max_price?: number; // Optional max price per BTC
  min_price?: number; // Optional min price per BTC
}

type DCAStep = 'type' | 'amount' | 'frequency' | 'optionalSettings' | 'executions' | 'maxPrice' | 'minPrice' | 'review' | 'priceControls';

const DCAModal: React.FC<DCAModalProps> = ({
  isOpen,
  onClose,
  balanceData,
  onComplete,
  initialAmount = '',
  initialPlanType = 'DCA_BUY',
}) => {
  const [currentStep, setCurrentStep] = useState<DCAStep>('frequency');
  const [dcaPlan, setDcaPlan] = useState<Partial<DCAPlanData>>({
    plan_type: initialPlanType,
  });
  const [amountInput, setAmountInput] = useState(''); // This will be set via props
  const [executionsInput, setExecutionsInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showOptionalSettingsModal, setShowOptionalSettingsModal] = useState(false);
  const [showExecutionsModal, setShowExecutionsModal] = useState(false);
  const [showMaxPriceModal, setShowMaxPriceModal] = useState(false);
  const [showMinPriceModal, setShowMinPriceModal] = useState(false);
  const [inputCurrency, setInputCurrency] = useState<'inr' | 'btc'>(initialPlanType === 'DCA_BUY' ? 'inr' : 'btc');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // If we have initial values, skip to frequency step, otherwise start from type step
      setCurrentStep(initialAmount ? 'frequency' : 'type');
      setDcaPlan({ plan_type: initialPlanType });
      setAmountInput(initialAmount);
      setExecutionsInput('');
      setMaxPriceInput('');
      setMinPriceInput('');
      setIsLoading(false);
      setShowConfirmation(false);
      setShowOptionalSettingsModal(false);
      setShowExecutionsModal(false);
      setShowMaxPriceModal(false);
      setShowMinPriceModal(false);
      // Reset input currency based on plan type
      setInputCurrency(initialPlanType === 'DCA_BUY' ? 'inr' : 'btc');
    }
  }, [isOpen, initialAmount, initialPlanType]);

  // Handle optional settings step - show the options modal
  useEffect(() => {
    if (currentStep === 'optionalSettings') {
      setShowOptionalSettingsModal(true);
    }
  }, [currentStep]);

  // Handle step navigation
  const goToNextStep = () => {
    const stepOrder: DCAStep[] = ['type', 'amount', 'frequency', 'optionalSettings', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    // If we started with initial values (integrated with trading modal),
    // and we're at the frequency step, close the modal instead of going to previous steps
    if (initialAmount && currentStep === 'frequency') {
      onClose();
      return;
    }
    
    const stepOrder: DCAStep[] = ['type', 'amount', 'frequency', 'optionalSettings', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else {
      onClose();
    }
  };

  // Step validation
  const isStepValid = () => {
    switch (currentStep) {
      case 'type':
        return dcaPlan.plan_type !== undefined;
      case 'amount':
        return amountInput && parseFloat(amountInput) > 0;
      case 'frequency':
        return dcaPlan.frequency !== undefined;
      case 'executions':
        return true; // Optional step
      case 'priceControls':
        return true; // Optional step
      case 'review':
        return true;
      default:
        return false;
    }
  };

  // Handle amount input confirmation
  const handleAmountConfirm = (value: string) => {
    const numValue = parseFloat(value);

    if (numValue < 0) {
      alert('Please enter a valid amount that is not negative.');
      return;
    }

    setAmountInput(value);
    goToNextStep();
  };

  // Handle currency change from SingleInputModal
  const handleCurrencyChange = (currency: 'inr' | 'btc') => {
    setInputCurrency(currency);
  };

  // Handle optional settings handlers
  const handleOptionalSettingsClose = () => {
    setShowOptionalSettingsModal(false);
    // Go back to frequency step with a small delay to allow modal transition
    setTimeout(() => {
      setCurrentStep('frequency');
    }, 100);
  };

  const handleSetDuration = () => {
    setShowOptionalSettingsModal(false);
    setShowExecutionsModal(true);
  };

  const handleSetMaxPrice = () => {
    setShowOptionalSettingsModal(false);
    setShowMaxPriceModal(true);
  };

  const handleSetMinPrice = () => {
    setShowOptionalSettingsModal(false);
    setShowMinPriceModal(true);
  };

  const handleReviewPlan = () => {
    setShowOptionalSettingsModal(false);
    setCurrentStep('review');
  };

  // Handle executions input confirmation
  const handleExecutionsConfirm = (value: string) => {
    setExecutionsInput(value);
    setShowExecutionsModal(false);
    setShowOptionalSettingsModal(true);
  };

  const handleExecutionsClose = () => {
    setShowExecutionsModal(false);
    setShowOptionalSettingsModal(true);
  };

  // Handle max price input confirmation
  const handleMaxPriceConfirm = (value: string) => {
    setMaxPriceInput(value);
    setShowMaxPriceModal(false);
    setShowOptionalSettingsModal(true);
  };

  const handleMaxPriceClose = () => {
    setShowMaxPriceModal(false);
    setShowOptionalSettingsModal(true);
  };

  // Handle min price input confirmation
  const handleMinPriceConfirm = (value: string) => {
    setMinPriceInput(value);
    setShowMinPriceModal(false);
    setShowOptionalSettingsModal(true);
  };

  const handleMinPriceClose = () => {
    setShowMinPriceModal(false);
    setShowOptionalSettingsModal(true);
  };

  // Handle final submission
  const handleCreatePlan = async () => {
    if (!isStepValid()) return;
    
    setIsLoading(true);
    
    try {
      const finalPlan: DCAPlanData = {
        plan_type: dcaPlan.plan_type!,
        frequency: dcaPlan.frequency!,
        amount_per_execution_inr: inputCurrency === 'inr' ? parseFloat(amountInput) : undefined,
        amount_per_execution_btc: inputCurrency === 'btc' ? Math.round(parseFloat(amountInput) * 100000000) : undefined, // Convert BTC to satoshis
        remaining_executions: executionsInput ? parseInt(executionsInput) : undefined,
        max_price: maxPriceInput ? parseFloat(maxPriceInput) : undefined,
        min_price: minPriceInput ? parseFloat(minPriceInput) : undefined,
      };

      // Call API to create DCA plan
      const result = await createDCAPlan(finalPlan);
      console.log('✅ DCA plan created successfully, ID:', result.planId);
      
      if (onComplete) {
        onComplete(finalPlan);
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Failed to create DCA plan:', error);
      alert('Failed to create DCA plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get max values based on plan type and balance
  const getMaxValue = () => {
    if (!balanceData) return undefined;
    
    if (dcaPlan.plan_type === 'DCA_BUY') {
      return balanceData.available_inr;
    } else {
      return balanceData.available_btc / 100000000; // Convert satoshis to BTC
    }
  };

  // Get max button text
  const getMaxButtonText = () => {
    if (!balanceData) return 'Max';
    
    if (dcaPlan.plan_type === 'DCA_BUY') {
      return `Max ${formatRupeesForDisplay(balanceData.available_inr)}`;
    } else {
      return `Max ${formatBitcoinForDisplay(balanceData.available_btc)}`;
    }
  };

  // Get step titles
  const getStepTitle = () => {
    switch (currentStep) {
      case 'type': return 'Create DCA Plan';
      case 'amount': return 'Set Amount';
      case 'frequency': return 'Set Frequency';
      case 'executions': return 'Set Duration';
      case 'priceControls': return 'Price Controls';
      case 'review': return 'Review Plan';
      default: return 'Create DCA Plan';
    }
  };

  // Format frequency for display
  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case 'HOURLY': return 'Hourly';
      case 'DAILY': return 'Daily';
      case 'WEEKLY': return 'Weekly';
      case 'MONTHLY': return 'Monthly';
      default: return frequency;
    }
  };

  // Get confirmation details
  const getConfirmationDetails = () => {
    if (!amountInput) return [];
    
    // Calculate daily average based on plan type
    // For BUY plans: use INR amount (what user invests)
    // For SELL plans: use BTC amount (what user sells)
    const baseAmount = dcaPlan.plan_type === 'DCA_BUY' ? parseFloat(amountInput) : parseFloat(amountInput);
    const totalPerDay = dcaPlan.frequency === 'HOURLY' ? baseAmount * 24 :
                       dcaPlan.frequency === 'DAILY' ? baseAmount :
                       dcaPlan.frequency === 'WEEKLY' ? baseAmount / 7 :
                       baseAmount / 30;

    const details = [
      {
        label: 'Plan Type',
        value: dcaPlan.plan_type === 'DCA_BUY' ? 'Buy Bitcoin' : 'Sell Bitcoin',
        highlight: false
      },
      {
        label: 'Amount per execution',
        value: inputCurrency === 'inr' ? (
          <AnimateINR value={parseFloat(amountInput)} className="text-sm font-normal text-white" />
        ) : (
          <AnimateBTC value={parseFloat(amountInput) * 100000000} className="text-sm font-normal text-white" />
        ),
        highlight: true
      },
      {
        label: 'Frequency',
        value: formatFrequency(dcaPlan.frequency!),
        highlight: false
      }
    ];

    details.push({
      label: 'Executions',
      value: executionsInput || 'Unlimited',
      highlight: false
    });
    
    if (maxPriceInput) {
      details.push({
        label: 'Max Price',
        value: <AnimateINR value={parseFloat(maxPriceInput)} className="text-sm font-normal text-white" />,
        highlight: true
      });
    }
    
    if (minPriceInput) {
      details.push({
        label: 'Min Price',
        value: <AnimateINR value={parseFloat(minPriceInput)} className="text-sm font-normal text-white" />,
        highlight: true
      });
    }
    
    details.push({
      label: inputCurrency === 'inr' ? 'Avg. daily investment' : 'Avg. daily sale',
      value: inputCurrency === 'inr' ? (
        <AnimateINR value={totalPerDay} className="text-sm font-normal text-brand" />
      ) : (
        <AnimateBTC value={totalPerDay * 100000000} className="text-sm font-normal text-brand" />
      ),
      highlight: true
    });
    
    return details;
  };

  // Render different step modals
  if (currentStep === 'type') {
    return (
      <OptionsModal
        isOpen={isOpen}
        onClose={onClose}
        title="Choose Plan Type"
        type="custom"
      >
        <div className="space-y-3">
          <div 
            className={`bg-gray-900 hover:bg-gray-800 border ${dcaPlan.plan_type === 'DCA_BUY' ? 'border-brand' : 'border-gray-700'} rounded-lg p-4 cursor-pointer transition-colors`}
            onClick={() => {
              setDcaPlan({ ...dcaPlan, plan_type: 'DCA_BUY' });
              goToNextStep();
            }}
            data-clickable="true"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Bitcoin className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-medium">Buy Bitcoin Regularly</h3>
                <p className="text-gray-400 text-xs mt-1">Dollar-cost average into Bitcoin</p>
              </div>
            </div>
          </div>
          
          <div 
            className={`bg-gray-900 hover:bg-gray-800 border ${dcaPlan.plan_type === 'DCA_SELL' ? 'border-brand' : 'border-gray-700'} rounded-lg p-4 cursor-pointer transition-colors`}
            onClick={() => {
              setDcaPlan({ ...dcaPlan, plan_type: 'DCA_SELL' });
              goToNextStep();
            }}
            data-clickable="true"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white text-sm font-medium">Sell Bitcoin Regularly</h3>
                <p className="text-gray-400 text-xs mt-1">Take profits systematically</p>
              </div>
            </div>
          </div>
        </div>
      </OptionsModal>
    );
  }

  if (currentStep === 'amount') {
    return (
      <SingleInputModal
        isOpen={isOpen}
        onClose={goToPreviousStep}
        title={getStepTitle()}
        type={inputCurrency}
        confirmText="Next"
        onConfirm={handleAmountConfirm}
        sectionTitle={`${dcaPlan.plan_type === 'DCA_BUY' ? 'Buy' : 'Sell'} Amount`}
        sectionDetail={`Amount to ${dcaPlan.plan_type === 'DCA_BUY' ? 'invest' : 'sell'} each time the plan executes`}
        initialValue={amountInput}
        showOrbitIcon={true}  // Enable orbit icon
        onCurrencyChange={handleCurrencyChange}
      />
    );
  }

  if (currentStep === 'frequency') {
    const frequencies = [
      { value: 'HOURLY', label: 'Every Hour', icon: Clock, description: 'High frequency, small amounts' },
      { value: 'DAILY', label: 'Daily', icon: Calendar, description: 'Once per day' },
      { value: 'WEEKLY', label: 'Weekly', icon: Repeat, description: 'Once per week' },
      { value: 'MONTHLY', label: 'Monthly', icon: Target, description: 'Once per month' },
    ] as const;

    return (
      <OptionsModal
        isOpen={isOpen}
        onClose={goToPreviousStep}
        title="Execution Frequency"
        type="custom"
      >
        <div className="space-y-3">
          {frequencies.map((freq) => {
            const IconComponent = freq.icon;
            return (
              <div 
                key={freq.value}
                className={`bg-gray-900 hover:bg-gray-800 border ${dcaPlan.frequency === freq.value ? 'border-brand' : 'border-gray-700'} rounded-lg p-4 cursor-pointer transition-colors`}
                onClick={() => {
                  setDcaPlan({ ...dcaPlan, frequency: freq.value });
                  goToNextStep();
                }}
                data-clickable="true"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <IconComponent className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-medium">{freq.label}</h3>
                    <p className="text-gray-400 text-xs mt-1">{freq.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </OptionsModal>
    );
  }

  if (currentStep === 'executions') {
    return (
      <SingleInputModal
        isOpen={isOpen}
        onClose={goToPreviousStep}
        title={getStepTitle()}
        type="number"
        confirmText="Next"
        onConfirm={handleExecutionsConfirm}
        sectionTitle="Number of Executions"
        sectionDetail="How many times should we execute this plan? Leave blank for unlimited executions."
        initialValue={executionsInput}
        showInfinityPlaceholder={true}
      />
    );
  }

  if (currentStep === 'priceControls') {
    // This would be a custom modal for price controls - for now, skip to review
    // The useEffect above handles auto-skipping this step
    return null;
  }

  if (currentStep === 'review') {
    return (
      <ConfirmationModal
        isOpen={isOpen && !showConfirmation}
        onClose={goToPreviousStep}
        title="Review Your DCA Plan"
        amount={inputCurrency === 'inr' ? (
          <AnimateINR value={parseFloat(amountInput)} className="justify-center text-white text-5xl font-normal" />
        ) : (
          <AnimateBTC value={parseFloat(amountInput) * 100000000} className="justify-center text-white text-5xl font-semibold" />
        )}
        amountType={inputCurrency}
        subAmount={undefined}
        subAmountType={undefined}
        details={(() => {
          const filteredDetails = getConfirmationDetails().filter(detail => !['Rate', 'You will receive', 'You will get', 'Amount per execution'].includes(detail.label));
          return [
            {
              label: 'Plan Type',
              value: dcaPlan.plan_type === 'DCA_BUY' ? 'Buy Bitcoin' : 'Sell Bitcoin',
              highlight: false
            },
            {
              label: 'Amount per execution',
              value: '(will be visible at execution)',
              highlight: false
            },
            ...filteredDetails
          ];
        })()}
        confirmText="Create Plan"
        onConfirm={handleCreatePlan}
        isLoading={isLoading}
        mode="confirm"
      />
    );
  }

  // Render optional settings modal
  if (showOptionalSettingsModal) {
    return (
      <OptionsModal
        isOpen={showOptionalSettingsModal}
        onClose={handleOptionalSettingsClose}
        title="Optional Settings"
        type="custom"
      >
        <div className="space-y-3">
          {/* Set Duration Option */}
          <div 
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors"
            onClick={handleSetDuration}
            data-clickable="true"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-sm font-medium">Set Duration</h3>
                <p className="text-gray-400 text-xs mt-1">Limit the number of executions</p>
              </div>
              {executionsInput && (
                <div className="text-brand text-xs">{executionsInput} times</div>
              )}
            </div>
          </div>
          
          {/* Set Max Price Option */}
          <div 
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors"
            onClick={handleSetMaxPrice}
            data-clickable="true"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-sm font-medium">Set Max Price</h3>
                <p className="text-gray-400 text-xs mt-1">Stop buying when BTC price exceeds this limit</p>
              </div>
              {maxPriceInput && (
                <div className="text-brand text-xs">₹{parseFloat(maxPriceInput).toLocaleString('en-IN')}</div>
              )}
            </div>
          </div>
          
          {/* Set Min Price Option */}
          <div 
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-colors"
            onClick={handleSetMinPrice}
            data-clickable="true"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-sm font-medium">Set Min Price</h3>
                <p className="text-gray-400 text-xs mt-1">Stop selling when BTC price falls below this limit</p>
              </div>
              {minPriceInput && (
                <div className="text-brand text-xs">₹{parseFloat(minPriceInput).toLocaleString('en-IN')}</div>
              )}
            </div>
          </div>
          
          {/* Review DCA Plan Option */}
          <div 
            className="bg-brand/10 hover:bg-brand/20 border border-brand rounded-lg p-4 cursor-pointer transition-colors"
            onClick={handleReviewPlan}
            data-clickable="true"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-brand text-sm font-medium">Review DCA Plan</h3>
                <p className="text-gray-400 text-xs mt-1">Proceed to review and create your plan</p>
              </div>
              <div className="text-brand text-xs">→</div>
            </div>
          </div>
        </div>
      </OptionsModal>
    );
  }

  // Render executions input modal
  if (showExecutionsModal) {
    return (
      <SingleInputModal
        isOpen={showExecutionsModal}
        onClose={handleExecutionsClose}
        title="Set Duration"
        type="number"
        confirmText="Set Duration"
        onConfirm={handleExecutionsConfirm}
        sectionTitle="Number of Executions"
        sectionDetail="How many times should we execute this plan? Leave blank for unlimited executions."
        initialValue={executionsInput}
        showInfinityPlaceholder={true}
      />
    );
  }

  // Render max price input modal
  if (showMaxPriceModal) {
    return (
      <SingleInputModal
        isOpen={showMaxPriceModal}
        onClose={handleMaxPriceClose}
        title="Set Max Price"
        type="inr"
        confirmText="Set Max Price"
        onConfirm={handleMaxPriceConfirm}
        sectionTitle="Maximum Price Limit"
        sectionDetail="The plan will pause when Bitcoin price exceeds this amount. This helps you avoid buying at high prices."
        initialValue={maxPriceInput}
      />
    );
  }

  // Render min price input modal
  if (showMinPriceModal) {
    return (
      <SingleInputModal
        isOpen={showMinPriceModal}
        onClose={handleMinPriceClose}
        title="Set Min Price"
        type="inr"
        confirmText="Set Min Price"
        onConfirm={handleMinPriceConfirm}
        sectionTitle="Minimum Price Limit"
        sectionDetail="The plan will pause when Bitcoin price falls below this amount. This helps you avoid selling at low prices."
        initialValue={minPriceInput}
      />
    );
  }

  return null;
};

export default DCAModal;
