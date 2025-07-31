import React from 'react';
import Card from '../components/Card';
import { Banknote, TrendingUp, Shield, Clock, ArrowRight } from 'lucide-react';

const Loans: React.FC = () => {

  const features = [
    {
      icon: Banknote,
      title: 'Bitcoin-Backed Loans',
      description: 'Use your Bitcoin as collateral to access instant liquidity without selling your crypto assets.',
      color: 'text-orange-400'
    },
    {
      icon: TrendingUp,
      title: 'Competitive Rates',
      description: 'Get the best rates in the market with flexible repayment terms tailored to your needs.',
      color: 'text-green-400'
    },
    {
      icon: Shield,
      title: 'Secure & Transparent',
      description: 'Your collateral is safely stored with full transparency on loan terms and conditions.',
      color: 'text-blue-400'
    },
    {
      icon: Clock,
      title: 'Instant Processing',
      description: 'Get approved and funded within minutes, not days. Lightning-fast loan processing.',
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="max-w-md mx-auto bg-black min-h-screen">
      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
          
          {/* Coming Soon Hero Section */}
          <Card variant="gradient" className="text-center">
            <div className="py-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-brand/10 rounded-full">
                  <Banknote className="w-12 h-12 text-brand" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Coming Soon
              </h2>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                We're building something amazing for you. Bitcoin-backed loans will be available soon, giving you access to instant liquidity while keeping your crypto.
              </p>
              
              <div className="inline-flex items-center px-4 py-2 bg-brand/20 border border-brand/30 rounded-lg text-brand text-sm font-medium">
                <Clock className="w-4 h-4 mr-2" />
                Launching Soon
              </div>
            </div>
          </Card>

          {/* Features Preview */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white px-1">
              What's Coming
            </h3>
            
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="transition-all duration-200 hover:border-gray-700">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-gray-800 rounded-lg">
                        <IconComponent className={`w-5 h-5 ${feature.color}`} />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <ArrowRight className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

      </div>
    </div>
  );
};

export default Loans;
