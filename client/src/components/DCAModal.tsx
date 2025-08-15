import React, { useState, useEffect } from 'react';
import SingleInputModal from './SingleInputModal';
import ConfirmationModal from './ConfirmationModal';
import OptionsModal from './OptionsModal';
import { formatRupeesForDisplay, formatBitcoinForDisplay } from '../utils/formatters';
import { AnimateINR, AnimateBTC } from './AnimateNumberFlow';
import { createDCAPlan } from '../utils/api';
import { Calendar, Repeat, Target, Clock } from 'lucide-react';

interface BalanceData {
  available_inr: number;
  available_btc: number;
  reserved_inr: number;
  reserved_btc: number;
}

interface DCAModalProps {
  isOpen: boolean;
  onClose: () => void;
  balanceData?: BalanceData | null;
  onComplete?: (dcaPlan: DCAPlanData) => void;
  initialAmount?: string;
  planType: 'DCA_BUY' | 'DCA_SELL'; // Required - no longer optional
  initialFrequency?: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'; // New prop for pre-selected frequency
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


const DCAModal: React.FC<DCAModalProps> = ({
  isOpen,
  onClose,
  balanceData,
  onComplete,
  initialAmount = '',
  planType,
  initialFrequency = 'DAILY',
}) => {
  // Modal state management - following TradingModal pattern (no type selection needed)
  const [dcaPlan, setDcaPlan] = useState<DCAPlanData>({
    plan_type: planType,
    frequency: initialFrequency, // Use provided frequency
  });
  const [amountInput, setAmountInput] = useState('');
  const [executionsInput, setExecutionsInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputCurrency, setInputCurrency] = useState<'inr' | 'btc'>(planType === 'DCA_BUY' ? 'inr' : 'btc');
  
  // Modal visibility states - like TradingModal's overlay system
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [showOptionalSettingsModal, setShowOptionalSettingsModal] = useState(false);
  const [showExecutionsModal, setShowExecutionsModal] = useState(false);
  const [showMaxPriceModal, setShowMaxPriceModal] = useState(false);
  const [showMinPriceModal, setShowMinPriceModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Reset state when modal opens/closes - TradingModal style
  useEffect(() => {
    if (isOpen) {
      // Initialize with provided initial values
      setDcaPlan({ plan_type: planType, frequency: initialFrequency });
      setAmountInput(initialAmount);
      setExecutionsInput('');
      setMaxPriceInput('');
      setMinPriceInput('');
      setIsLoading(false);
      setInputCurrency(planType === 'DCA_BUY' ? 'inr' : 'btc');
      
      // Reset all modal visibility states
      setShowFrequencyModal(false);
      setShowOptionalSettingsModal(false);
      setShowExecutionsModal(false);
      setShowMaxPriceModal(false);
      setShowMinPriceModal(false);
      setShowReviewModal(false);
    }
  }, [isOpen, initialAmount, planType, initialFrequency]);

  // Modal navigation handlers - TradingModal style
  const handleAmountModalClose = () => {
    onClose();
  };

  const handleFrequencySelect = (frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    setDcaPlan({ ...dcaPlan, frequency });
    setShowFrequencyModal(false);
    setShowOptionalSettingsModal(true);
  };

  const handleFrequencyModalClose = () => {
    // Just close the frequency overlay, base modal stays open
    setShowFrequencyModal(false);
  };

  // Handle amount input confirmation
  const handleAmountConfirm = (value: string) => {
    const numValue = parseFloat(value);

    if (numValue < 0) {
      alert('Please enter a valid amount that is not negative.');
      return;
    }
    
    setAmountInput(value);
    // Since frequency is already selected, go directly to review
    setShowReviewModal(true);
  };
  
  // Handle settings icon click (like TradingModal)
  const handleSettingsClick = () => {
    setShowOptionalSettingsModal(true);
  };

  // Handle currency change from SingleInputModal
  const handleCurrencyChange = (currency: 'inr' | 'btc') => {
    setInputCurrency(currency);
  };

  // Handle optional settings handlers
  const handleOptionalSettingsClose = () => {
    setShowOptionalSettingsModal(false);
    // Since frequency selection is now done in type selection modal,
    // going back should close the optional settings and return to amount input
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

  // Handle review modal close
  const handleReviewModalClose = () => {
    setShowReviewModal(false);
    // Go back to amount input step, not optional settings
  };

  // Handle final submission
  const handleCreatePlan = async () => {
    if (!dcaPlan.plan_type || !dcaPlan.frequency || !amountInput) {
      alert('Please complete all required fields.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const finalPlan: DCAPlanData = {
        plan_type: dcaPlan.plan_type,
        frequency: dcaPlan.frequency,
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

  // TradingModal-style layered rendering system - base modal ALWAYS rendered, overlays on top
  return (
    <>
      {/* Base Modal - ALWAYS rendered like TradingModal's SingleInputModal */}
      <SingleInputModal
        key="dca-amount-modal"
        isOpen={isOpen}
        onClose={handleAmountModalClose}
        title={dcaPlan.plan_type === 'DCA_BUY' ? 'Buy Bitcoin Regularly' : 'Sell Bitcoin Regularly'}
        type={inputCurrency}
        confirmText="Next"
        onConfirm={handleAmountConfirm}
        sectionTitle="Frequency"
        sectionAmount={formatFrequency(dcaPlan.frequency!)}
        initialValue={initialAmount}
        showOrbitIcon={true}
        showSettingsIcon={true}
        onSettingsClick={handleSettingsClick}
        onCurrencyChange={handleCurrencyChange}
        maxValue={getMaxValue()}
        maxButtonText={getMaxButtonText()}
        skipMaxValidation={true}
        showXIcon={true}
      />
      
      {/* Frequency Selection Modal - Overlay on top of base modal */}
      <OptionsModal
        isOpen={isOpen && showFrequencyModal}
        onClose={handleFrequencyModalClose}
        title="Execution Frequency"
      >
        <div className="space-y-3">
          {[
            { value: 'HOURLY', label: 'Every Hour', icon: Clock, description: 'High frequency, small amounts' },
            { value: 'DAILY', label: 'Daily', icon: Calendar, description: 'Once per day' },
            { value: 'WEEKLY', label: 'Weekly', icon: Repeat, description: 'Once per week' },
            { value: 'MONTHLY', label: 'Monthly', icon: Target, description: 'Once per month' },
          ].map((freq) => {
            const IconComponent = freq.icon;
            return (
              <div 
                key={freq.value}
                className={`bg-gray-900 hover:bg-gray-800 border ${dcaPlan.frequency === freq.value ? 'border-brand' : 'border-gray-700'} rounded-lg p-4 cursor-pointer transition-colors`}
                onClick={() => handleFrequencySelect(freq.value as 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY')}
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
      
      {/* Optional Settings Modal - Overlay on top of base modal */}
      <OptionsModal
        isOpen={isOpen && showOptionalSettingsModal}
        onClose={handleOptionalSettingsClose}
        title="Optional Settings"
      >
        <div className="space-y-3">
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
          
        </div>
      </OptionsModal>
      
      {/* Review Modal - Overlay on top of base modal */}
      <ConfirmationModal
        isOpen={isOpen && showReviewModal}
        onClose={handleReviewModalClose}
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
          return filteredDetails;
        })()}
        confirmText="Confirm"
        onConfirm={handleCreatePlan}
        isLoading={isLoading}
        mode="confirm"
      />
      
      {/* Overlay Modals - Only show when specific sub-modal states are active */}
      
      {/* Executions Input Modal - Overlay */}
      <SingleInputModal
        isOpen={isOpen && showExecutionsModal}
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
      
      {/* Max Price Input Modal - Overlay */}
      <SingleInputModal
        isOpen={isOpen && showMaxPriceModal}
        onClose={handleMaxPriceClose}
        title="Set Max Price"
        type="inr"
        confirmText="Set Max Price"
        onConfirm={handleMaxPriceConfirm}
        sectionTitle="Maximum Price Limit"
        sectionDetail="The plan will pause when Bitcoin price exceeds this amount. This helps you avoid buying at high prices."
        initialValue={maxPriceInput}
      />
      
      {/* Min Price Input Modal - Overlay */}
      <SingleInputModal
        isOpen={isOpen && showMinPriceModal}
        onClose={handleMinPriceClose}
        title="Set Min Price"
        type="inr"
        confirmText="Set Min Price"
        onConfirm={handleMinPriceConfirm}
        sectionTitle="Minimum Price Limit"
        sectionDetail="The plan will pause when Bitcoin price falls below this amount. This helps you avoid selling at low prices."
        initialValue={minPriceInput}
      />
    </>);
};

export default DCAModal;
