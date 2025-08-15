import React, { useState } from 'react';
import Card from '../components/Card';
import DCAPlans from '../components/DCAPlans';
import DCATransactionList from '../components/DCATransactionList';
import DCAModal from '../components/DCAModal';
import DCATypeSelectionModal from '../components/DCATypeSelectionModal';
import { TrendingUp, Calendar, Repeat, Target, ArrowRight } from 'lucide-react';
import { DCAPlan, Transaction } from '../types';
import { usePortfolio } from '../context/PortfolioContext';
import BitcoinQuote from '../components/BitcoinQuote';


const DCA: React.FC = () => {
  const [isTypeSelectionModalOpen, setIsTypeSelectionModalOpen] = useState(false);
  const [isDCAModalOpen, setIsDCAModalOpen] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState<'DCA_BUY' | 'DCA_SELL'>('DCA_BUY');
  
  // Use centralized contexts
  const { userBalance: balanceData, hasAnyPlans } = usePortfolio();

  const handleStartDCA = () => {
    // Open type selection modal first
    setIsTypeSelectionModalOpen(true);
  };

  const handleTypeSelectionClose = () => {
    setIsTypeSelectionModalOpen(false);
  };

  const handlePlanTypeSelect = (planType: 'DCA_BUY' | 'DCA_SELL') => {
    setSelectedPlanType(planType);
    setIsTypeSelectionModalOpen(false);
    // Open DCA modal with selected plan type
    setIsDCAModalOpen(true);
  };

  const handleCloseDCAModal = () => {
    setIsDCAModalOpen(false);
  };

  const handleDCAComplete = (dcaPlan: any) => {
    setIsDCAModalOpen(false);
    // No manual refresh needed - WebSocket will handle the update
  };


  const handlePlanClick = (plan: DCAPlan) => {
    // TODO: Add plan details modal or navigation
  };


  const benefits = [
    {
      icon: TrendingUp,
      title: 'Reduce Risk',
      description: 'Average out market volatility by spreading purchases over time instead of buying all at once.',
      color: 'text-green-400'
    },
    {
      icon: Calendar,
      title: 'Stay Consistent',
      description: 'Automated investing helps you stick to your plan without emotional decision-making.',
      color: 'text-blue-400'
    },
    {
      icon: Repeat,
      title: 'Build Discipline',
      description: 'Regular investments create a disciplined approach to building your Bitcoin position.',
      color: 'text-purple-400'
    },
    {
      icon: Target,
      title: 'Lower Average Cost',
      description: 'Buy more when prices are low, less when high - potentially reducing your average cost.',
      color: 'text-orange-400'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-md mx-auto bg-black min-h-screen">
      {/* Main Content */}
        {hasAnyPlans ? (
          <div className="px-4 py-3 space-y-3">
            {/* Plan Management Interface */}
            <DCAPlans
              title="DCA Plans"
              onAddPlan={handleStartDCA}
              onPlanClick={handlePlanClick}
              wrapInCard={true}
            />
            
            {/* DCA Transaction History */}
            <DCATransactionList
              onTransactionClick={(transaction: Transaction) => {
                // TODO: Handle DCA transaction click
              }}
            />
          </div>
        ) : (
          <div className="px-4 py-3 space-y-3">
            {/* Onboarding Interface */}
            <DCAPlans
              title="Active DCA Plans"
              onAddPlan={handleStartDCA}
              onPlanClick={handlePlanClick}
              wrapInCard={false}
            />
            
            {/* Hero Section */}
            <Card variant="gradient" className="text-center">
              <div className="py-8">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-brand/10 rounded-full">
                    <TrendingUp className="w-12 h-12 text-brand" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">
                  Dollar-Cost Averaging
                </h2>
                
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Invest fixed amounts regularly to reduce risk and build your Bitcoin position over time. DCA helps you avoid trying to time the market.
                </p>
                
                <button 
                  onClick={handleStartDCA}
                  className="btn-strike-primary rounded-xl flex items-center justify-center space-x-2 mx-auto px-6"
                >
                  <span className="font-medium">Start DCA Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Card>

            {/* Benefits Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white px-1">
                Why Dollar-Cost Averaging?
              </h3>
              
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <Card key={index} className="transition-all duration-200 hover:border-gray-700">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-gray-800 rounded-lg">
                          <IconComponent className={`w-5 h-5 ${benefit.color}`} />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium mb-1">
                          {benefit.title}
                        </h4>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* How It Works */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center">
                    <span className="text-brand text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium mb-1">Set Your Schedule</h4>
                    <p className="text-gray-400 text-xs">Choose how much and how often you want to invest</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center">
                    <span className="text-brand text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium mb-1">Automatic Purchases</h4>
                    <p className="text-gray-400 text-xs">We automatically buy Bitcoin for you at regular intervals</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center">
                    <span className="text-brand text-sm font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium mb-1">Track Progress</h4>
                    <p className="text-gray-400 text-xs">Monitor your growing Bitcoin position and average cost</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* Bitcoin Quote */}
        <BitcoinQuote />
      
      {/* DCA Type Selection Modal */}
      <DCATypeSelectionModal
        isOpen={isTypeSelectionModalOpen}
        onClose={handleTypeSelectionClose}
        onSelect={handlePlanTypeSelect}
        selectedType={selectedPlanType}
      />
      
      {/* DCA Modal */}
      <DCAModal 
        isOpen={isDCAModalOpen} 
        onClose={handleCloseDCAModal}
        planType={selectedPlanType}
        balanceData={balanceData}
        onComplete={handleDCAComplete}
      />
      </div>
    </div>
  );
};

export default DCA;
