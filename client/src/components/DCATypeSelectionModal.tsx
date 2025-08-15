import React from 'react';
import OptionsModal from './OptionsModal';
import { Bitcoin, IndianRupee } from 'lucide-react';

interface DCATypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (planType: 'DCA_BUY' | 'DCA_SELL') => void;
  selectedType?: 'DCA_BUY' | 'DCA_SELL';
}

const DCATypeSelectionModal: React.FC<DCATypeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedType
}) => {
  return (
    <OptionsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Plan Type"
      showXIcon={true}
    >
      <div className="space-y-3">
        <div 
          className={`bg-gray-900 hover:bg-gray-800 border ${selectedType === 'DCA_BUY' ? 'border-brand' : 'border-gray-700'} rounded-lg p-4 cursor-pointer transition-colors`}
          onClick={() => onSelect('DCA_BUY')}
          data-clickable="true"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-500/10 rounded-lg">
              <Bitcoin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white text-sm font-medium">Buy Bitcoin Regularly</h3>
              <p className="text-gray-400 text-xs mt-1">Dollar-cost average into Bitcoin</p>
            </div>
          </div>
        </div>
        
        <div 
          className={`bg-gray-900 hover:bg-gray-800 border ${selectedType === 'DCA_SELL' ? 'border-brand' : 'border-gray-700'} rounded-lg p-4 cursor-pointer transition-colors`}
          onClick={() => onSelect('DCA_SELL')}
          data-clickable="true"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-500/10 rounded-lg">
              <IndianRupee className="w-5 h-5 text-white" />
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
};

export default DCATypeSelectionModal;
