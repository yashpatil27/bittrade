import React, { useState, useEffect } from 'react';
import NumberFlow from '@number-flow/react';

const SimpleNumberFlowDemo: React.FC = () => {
  const [price, setPrice] = useState(45000);
  const [balance, setBalance] = useState(1234.56);

  // Auto-update price every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPrice(prev => prev + Math.floor(Math.random() * 200) - 100);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 bg-black text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">Simple NumberFlow Demo</h1>
      
      <div className="space-y-6">
        {/* Bitcoin Price with Animation */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Bitcoin Price (Auto-updating)</h2>
          <div className="text-4xl font-bold text-orange-400">
            <NumberFlow 
              value={price} 
              format={{ style: 'currency', currency: 'USD' }} 
            />
          </div>
        </div>

        {/* Balance with Manual Input */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Balance</h2>
          <div className="text-3xl font-bold text-green-400 mb-4">
            <NumberFlow 
              value={balance} 
              format={{ style: 'currency', currency: 'USD' }} 
            />
          </div>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
            className="bg-gray-700 text-white px-3 py-2 rounded-md w-full max-w-xs"
            placeholder="Enter balance"
          />
        </div>

        {/* Percentage */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Percentage Change</h2>
          <div className="text-3xl font-bold text-blue-400">
            <NumberFlow 
              value={0.1234} 
              format={{ style: 'percent' }} 
            />
          </div>
        </div>

        {/* Bitcoin Amount */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Bitcoin Amount</h2>
          <div className="text-3xl font-bold text-orange-500 flex items-center">
            <span className="mr-1">₿</span>
            <NumberFlow 
              value={0.00123456} 
              format={{ minimumFractionDigits: 0, maximumFractionDigits: 8 }} 
            />
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Controls</h2>
          <div className="space-x-4">
            <button
              onClick={() => setPrice(Math.random() * 100000)}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-md"
            >
              Random Price
            </button>
            <button
              onClick={() => setBalance(Math.random() * 10000)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md"
            >
              Random Balance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleNumberFlowDemo;
