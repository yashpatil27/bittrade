import React, { useState } from 'react';
import OptionsModal from './OptionsModal';
import { Bitcoin, IndianRupee, Calendar, Repeat, Target, Clock, ChevronRight } from 'lucide-react';

interface DCATypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (planType: 'DCA_BUY' | 'DCA_SELL', frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY') => void;
  selectedType?: 'DCA_BUY' | 'DCA_SELL';
  selectedFrequency?: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

const DCATypeSelectionModal: React.FC<DCATypeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedType,
  selectedFrequency
}) => {
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [tempPlanType, setTempPlanType] = useState<'DCA_BUY' | 'DCA_SELL' | undefined>(selectedType);
  
  // Control modal visibility based on isOpen prop
  React.useEffect(() => {
    if (isOpen) {
      setShowTypeModal(true);
      setShowFrequencyModal(false);
      setTempPlanType(selectedType);
    } else {
      setShowTypeModal(false);
      setShowFrequencyModal(false);
    }
  }, [isOpen, selectedType]);
  
  const handlePlanTypeSelect = (planType: 'DCA_BUY' | 'DCA_SELL') => {
    setTempPlanType(planType);
    // Animate type modal down and frequency modal up
    setShowTypeModal(false);
    setTimeout(() => {
      setShowFrequencyModal(true);
    }, 150); // Reduced delay for snappier transition
  };
  
  const handleFrequencySelect = (frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    if (tempPlanType) {
      onSelect(tempPlanType, frequency);
    }
  };
  
  const handleTypeModalClose = () => {
    // Close the entire modal system
    onClose();
  };
  
  const handleFrequencyModalClose = () => {
    // Go back to type selection with animation
    setShowFrequencyModal(false);
    setTimeout(() => {
      setShowTypeModal(true);
    }, 150); // Reduced delay for snappier transition
  };
  
  const frequencyOptions = [
    { value: 'HOURLY', label: 'Every Hour', icon: Clock, description: 'High frequency, small amounts' },
    { value: 'DAILY', label: 'Daily', icon: Calendar, description: 'Once per day' },
    { value: 'WEEKLY', label: 'Weekly', icon: Repeat, description: 'Once per week' },
    { value: 'MONTHLY', label: 'Monthly', icon: Target, description: 'Once per month' },
  ];

  return (
    <>
      {/* Plan Type Selection Modal */}
      <OptionsModal
        isOpen={showTypeModal}
        onClose={handleTypeModalClose}
        title="Choose Plan Type"
        showXIcon={true}
      >
        <div className="space-y-3">
          <div 
            className={`bg-gray-900 hover:bg-gray-800 border ${tempPlanType === 'DCA_BUY' ? 'border-brand' : 'border-gray-700'} rounded-lg p-4 cursor-pointer transition-colors`}
            onClick={() => handlePlanTypeSelect('DCA_BUY')}
            data-clickable="true"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                  <Bitcoin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-medium">Buy Bitcoin Regularly</h3>
                  <p className="text-gray-400 text-xs mt-1">Dollar-cost average into Bitcoin</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          <div 
            className={`bg-gray-900 hover:bg-gray-800 border ${tempPlanType === 'DCA_SELL' ? 'border-brand' : 'border-gray-700'} rounded-lg p-4 cursor-pointer transition-colors`}
            onClick={() => handlePlanTypeSelect('DCA_SELL')}
            data-clickable="true"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                  <IndianRupee className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-medium">Sell Bitcoin Regularly</h3>
                  <p className="text-gray-400 text-xs mt-1">Take profits systematically</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </OptionsModal>
      
      {/* Frequency Selection Modal */}
      <OptionsModal
        isOpen={showFrequencyModal}
        onClose={handleFrequencyModalClose}
        title="Choose Frequency"
        showXIcon={false}
      >
        <div className="space-y-3">
          {frequencyOptions.map((freq) => {
            const IconComponent = freq.icon;
            return (
              <div 
                key={freq.value}
                className={`bg-gray-900 hover:bg-gray-800 border ${selectedFrequency === freq.value ? 'border-brand' : 'border-gray-700'} rounded-lg p-4 cursor-pointer transition-colors`}
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
    </>
  );
};

export default DCATypeSelectionModal;
