import React, { useState } from 'react';
import NumberFlow from '@number-flow/react';

const NumberFlowDemo: React.FC = () => {
  const [value, setValue] = useState(1234.56);
  const [bitcoinAmount, setBitcoinAmount] = useState(1.2345);

  const handleValueChange = (newValue: string) => {
    const numValue = parseFloat(newValue) || 0;
    setValue(numValue);
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-center">NumberFlow Library Demo</h1>
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Basic Currency Example */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">💰 Currency Format</h2>
          <div className="text-3xl font-bold text-green-400 flex items-center">
            <span className="mr-1">$</span>
            <NumberFlow
              value={value}
              format={{
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }}
            />
          </div>
          <div className="mt-4">
            <input
              type="number"
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-md w-full max-w-xs"
              placeholder="Enter value"
            />
          </div>
        </div>

        {/* INR Currency Example */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">🇮🇳 Indian Rupees</h2>
          <div className="text-3xl font-bold text-yellow-400 flex items-center">
            <span className="mr-1">₹</span>
            <NumberFlow
              value={value * 83}
              format={{
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }}
              locales="en-IN"
            />
          </div>
        </div>

        {/* Bitcoin Amount Example */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">₿ Bitcoin Amount</h2>
          <div className="text-3xl font-bold text-orange-500 flex items-center">
            <span className="mr-1">₿</span>
            <NumberFlow
              value={bitcoinAmount}
              format={{
                minimumFractionDigits: 0,
                maximumFractionDigits: 8
              }}
            />
          </div>
          <div className="mt-4">
            <input
              type="number"
              value={bitcoinAmount}
              onChange={(e) => setBitcoinAmount(parseFloat(e.target.value) || 0)}
              className="bg-gray-700 text-white px-3 py-2 rounded-md w-full max-w-xs"
              placeholder="Enter Bitcoin amount"
              step="0.00000001"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">🎛️ Controls</h2>
          <div className="space-y-4">
            <button
              onClick={() => setValue(Math.random() * 10000)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md mr-2"
            >
              Random Value
            </button>
            <button
              onClick={() => setBitcoinAmount(Math.random() * 10)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md"
            >
              Random Bitcoin Amount
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumberFlowDemo;
