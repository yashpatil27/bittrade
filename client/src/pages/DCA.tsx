import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Card from '../components/Card';
import DCAModal from '../components/DCAModal';
import MarketRate from '../components/MarketRate';
import { TrendingUp, Calendar, Repeat, Target, ArrowRight, Play, Pause, Trash2, Clock, DollarSign, BarChart3, Plus } from 'lucide-react';
import { getUserBalance } from '../utils/tradingApi';
import { getDCAPlans } from '../utils/api';
import { DCAPlan } from '../types';

interface BalanceData {
  available_inr: number;
  available_btc: number;
  reserved_inr: number;
  reserved_btc: number;
  collateral_btc: number;
  borrowed_inr: number;
  interest_accrued: number;
}

interface DCAPlansResponse {
  plans: DCAPlan[];
  total_plans: number;
  active_plans: number;
  paused_plans: number;
}

const DCA: React.FC = () => {
  const [isDCAModalOpen, setIsDCAModalOpen] = useState(false);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [buyRate, setBuyRate] = useState<number>(0);
  const [sellRate, setSellRate] = useState<number>(0);
  const [dcaPlans, setDcaPlans] = useState<DCAPlansResponse | null>(null);

  // Fetch user's DCA plans on component mount
  useEffect(() => {
    const fetchDCAPlans = async () => {
      try {
        const plansData = await getDCAPlans();
        setDcaPlans(plansData);
      } catch (error) {
        console.error('Failed to fetch DCA plans:', error);
        // Set empty plans if error (likely no plans exist)
        setDcaPlans({ plans: [], total_plans: 0, active_plans: 0, paused_plans: 0 });
      }
    };

    fetchDCAPlans();
  }, []);

  const handleProfileClick = () => {
    console.log('Profile clicked');
  };

  const handleStartDCA = async () => {
    // Load balance data when opening DCA modal
    try {
      const balance = await getUserBalance();
      setBalanceData(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
    setIsDCAModalOpen(true);
  };

  const handleCloseDCAModal = () => {
    setIsDCAModalOpen(false);
  };

  const handleDCAComplete = (dcaPlan: any) => {
    console.log('DCA Plan created:', dcaPlan);
    // Refresh the plans after creating a new one
    const fetchDCAPlans = async () => {
      try {
        const plansData = await getDCAPlans();
        setDcaPlans(plansData);
      } catch (error) {
        console.error('Failed to refresh DCA plans:', error);
      }
    };
    fetchDCAPlans();
    setIsDCAModalOpen(false);
  };

  const handleRatesUpdate = (newBuyRate: number, newSellRate: number) => {
    setBuyRate(newBuyRate);
    setSellRate(newSellRate);
  };

  const handleBalanceUpdate = (newBalanceData: BalanceData | null) => {
    setBalanceData(newBalanceData);
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
        <Header 
          title="₿itTrade" 
          onProfileClick={handleProfileClick}
        />
        
        {/* Hidden MarketRate component to get rates */}
        <MarketRate 
          className="hidden"
          onRatesUpdate={handleRatesUpdate}
          onBalanceUpdate={handleBalanceUpdate}
        />
        {/* Main Content */}
        <div className="px-4 py-3 space-y-3">
          {(dcaPlans?.total_plans || 0) > 0 && dcaPlans?.plans && dcaPlans.plans.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white px-1">
                  Active DCA Plans
                </h3>
                <button 
                  onClick={handleStartDCA} 
                  className="btn-strike-primary rounded-xl flex items-center space-x-2 px-4"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Plan</span>
                </button>
              </div>
              
              {dcaPlans?.plans.map((plan, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {plan.plan_type === 'DCA_BUY' ? (
                          <div className="p-2 bg-green-500/10 rounded-lg">
                            <DollarSign className="text-green-400 w-5 h-5" />
                          </div>
                        ) : (
                          <div className="p-2 bg-red-500/10 rounded-lg">
                            <TrendingUp className="text-red-400 w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">
                          {plan.plan_type === 'DCA_BUY' ? 'DCA Buy Plan' : 'DCA Sell Plan'}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          ₹{plan.amount_per_execution.toLocaleString()} • {plan.frequency.toLowerCase()}
                        </p>
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
                      
                      <div className="flex space-x-1">
                        {plan.status === 'ACTIVE' ? (
                          <button className="bg-gray-800 hover:bg-gray-700 text-white rounded-full p-1.5 transition-colors">
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button className="bg-gray-800 hover:bg-gray-700 text-white rounded-full p-1.5 transition-colors">
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button className="bg-red-800 hover:bg-red-700 text-white rounded-full p-1.5 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="text-gray-400 w-4 h-4" />
                      <span className="text-gray-400">Next: {new Date(plan.next_execution_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="text-gray-400 w-4 h-4" />
                      <span className="text-gray-400">
                        {plan.remaining_executions || plan.total_executions} executions left
                      </span>
                    </div>
                  </div>
                  
                  {plan.performance && plan.performance.total_invested != null && plan.performance.avg_price != null && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Total Invested</span>
                        <span className="text-white font-medium">₹{plan.performance.total_invested.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-400">Avg Price</span>
                        <span className="text-white font-medium">₹{plan.performance.avg_price.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
      
      {/* DCA Modal */}
      <DCAModal 
        isOpen={isDCAModalOpen} 
        onClose={handleCloseDCAModal}
        balanceData={balanceData}
        currentBitcoinPrice={0}
        buyRate={buyRate}
        sellRate={sellRate}
        onComplete={handleDCAComplete}
      />
    </div>
  );
};

export default DCA;
