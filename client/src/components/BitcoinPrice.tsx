import React, { useEffect } from 'react';
import { Bitcoin } from 'lucide-react';
import { usePrice } from '../context/PriceContext';
import { AnimateINR } from './AnimateNumberFlow';

interface BitcoinPriceProps {
  className?: string;
  onBuyClick?: () => void;
  onSellClick?: () => void;
  onRatesUpdate?: (buyRate: number, sellRate: number) => void;
  onChartClick?: () => void;
}


const BitcoinPrice: React.FC<BitcoinPriceProps> = ({ className = "", onBuyClick, onSellClick, onRatesUpdate, onChartClick }) => {
  // Use centralized price context
  const { buyRateInr, sellRateInr, pricesLoading, hasValidPrices, chartData, fetchChartData, btcUsdPrice } = usePrice();

  // Use rates from PriceContext
  const buyRate = buyRateInr || 0;
  const sellRate = sellRateInr || 0;

  // Notify parent component of rate updates
  useEffect(() => {
    if (onRatesUpdate) {
      onRatesUpdate(buyRate, sellRate);
    }
  }, [buyRate, sellRate, onRatesUpdate]);

  // Fetch 1-day chart data for mock chart if not already loaded
  useEffect(() => {
    if (!chartData['1d'] || chartData['1d'].error) {
      fetchChartData('1d');
    }
  }, [chartData, fetchChartData]);

  // Get 1-day chart data for mock chart
  const oneDayChart = chartData['1d'];
  const chartPoints = oneDayChart?.data || [];
  
  // Calculate daily change percentage
  const dailyChangePercent = oneDayChart?.priceChangePercent || 0;
  const isPositive = dailyChangePercent >= 0;

  // Generate smooth SVG path from chart data
  const generateSmoothPath = (points: any[], width: number, height: number) => {
    if (points.length < 2) return '';

    // Sample points for performance (take every nth point based on data length)
    const maxPoints = 24;
    const step = Math.max(1, Math.floor(points.length / maxPoints));
    const sampledPoints = points.filter((_, index) => index % step === 0);
    
    if (sampledPoints.length < 2) return '';

    // Find min/max prices for scaling
    const prices = sampledPoints.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Convert to SVG coordinates
    const svgPoints = sampledPoints.map((point, index) => {
      const x = (index / (sampledPoints.length - 1)) * width;
      const y = height - ((point.price - minPrice) / priceRange) * (height * 0.8) - (height * 0.1);
      return { x, y };
    });

    // Generate ultra-smooth curve using spline-like cubic bezier curves
    let path = `M${svgPoints[0].x},${svgPoints[0].y}`;
    
    // Calculate smooth control points for all segments at once (spline approach)
    const controlPoints = [];
    
    for (let i = 0; i < svgPoints.length; i++) {
      const prev = svgPoints[i - 1];
      const curr = svgPoints[i];
      const next = svgPoints[i + 1];
      const nextNext = svgPoints[i + 2];
      
      let cp1x, cp1y, cp2x, cp2y;
      
      if (i === 0) {
        // First point - smooth start
        if (next && svgPoints[i + 2]) {
          const dx = next.x - curr.x;
          const dy = next.y - curr.y;
          cp2x = curr.x + dx * 0.5;
          cp2y = curr.y + dy * 0.5;
        }
      } else if (i === svgPoints.length - 1) {
        // Last point - already handled
      } else {
        // Middle points - use catmull-rom spline approach for ultra-smooth curves
        const tension = 0.5; // Higher tension for smoother curves
        
        // Calculate tangent vectors using neighboring points for smoother flow
        let tangentX = 0;
        let tangentY = 0;
        
        if (prev && next) {
          // Primary tangent from previous to next point
          tangentX = (next.x - prev.x) * 0.5;
          tangentY = (next.y - prev.y) * 0.5;
          
          // Add influence from further points for even smoother curves
          if (i >= 2) {
            const prevPrev = svgPoints[i - 2];
            tangentX += (curr.x - prevPrev.x) * 0.1;
            tangentY += (curr.y - prevPrev.y) * 0.1;
          }
          if (nextNext) {
            tangentX += (nextNext.x - curr.x) * 0.1;
            tangentY += (nextNext.y - curr.y) * 0.1;
          }
        } else if (prev) {
          tangentX = curr.x - prev.x;
          tangentY = curr.y - prev.y;
        } else if (next) {
          tangentX = next.x - curr.x;
          tangentY = next.y - curr.y;
        }
        
        // Control point 1 (from previous point)
        cp1x = prev.x + tangentX * tension;
        cp1y = prev.y + tangentY * tension;
        
        // Control point 2 (to current point)  
        cp2x = curr.x - tangentX * tension;
        cp2y = curr.y - tangentY * tension;
      }
      
      controlPoints.push({ cp1x, cp1y, cp2x, cp2y });
    }
    
    // Build the smooth path
    for (let i = 1; i < svgPoints.length; i++) {
      const curr = svgPoints[i];
      const cp = controlPoints[i];
      
      if (cp.cp1x !== undefined && cp.cp2x !== undefined) {
        path += ` C${cp.cp1x},${cp.cp1y} ${cp.cp2x},${cp.cp2y} ${curr.x},${curr.y}`;
      } else {
        // Fallback to simple curve
        const prev = svgPoints[i - 1];
        const cp1x = prev.x + (curr.x - prev.x) * 0.5;
        const cp1y = prev.y + (curr.y - prev.y) * 0.2;
        const cp2x = curr.x - (curr.x - prev.x) * 0.5;
        const cp2y = curr.y - (curr.y - prev.y) * 0.2;
        path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
      }
    }
    
    return path;
  };


  // Show loading state when no data is available
  if (pricesLoading || !hasValidPrices) {
    return (
      <div className={`bg-gray-900 border border-gray-800 rounded-xl p-3 ${className}`}>
        <div className="mb-3 flex items-center justify-between">
          <div className="p-2 bg-gray-800 rounded-lg">
            <Bitcoin className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-yellow-400">Loading...</span>
            </div>
          </div>
        </div>
        
        {/* Mock Chart Loading State */}
        <div className="mb-3 h-24 bg-gray-800 rounded-lg animate-pulse">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-gray-500">Loading chart...</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Buy Rate Loading */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Buy Rate</p>
            <div className="h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
            <button 
              disabled
              className="w-full btn-strike-primary flex items-center justify-center space-x-1"
            >
              <span>Loading...</span>
            </button>
          </div>

          {/* Sell Rate Loading */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Sell Rate</p>
            <div className="h-6 bg-gray-700 rounded animate-pulse mb-2"></div>
            <button 
              disabled
              className="w-full btn-strike-primary flex items-center justify-center space-x-1"
            >
              <span>Loading...</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-3 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="p-2 bg-gray-800 rounded-lg">
          <Bitcoin className="w-5 h-5 text-white" />
        </div>
        <div className="text-right">
          <div className="text-white text-sm font-semibold">
            ${btcUsdPrice?.toLocaleString() || '---'}
          </div>
          <div className={`text-xs font-medium ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {isPositive ? '+' : ''}{dailyChangePercent.toFixed(2)}%
          </div>
        </div>
      </div>
      
      {/* Mock Chart */}
      <div 
        className="mb-3 h-28 cursor-pointer relative overflow-hidden"
        onClick={onChartClick}
      >
        {/* Mock chart visualization */}
        <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
          
          {/* Real 1-day chart data with smooth curves */}
          {(() => {
            const linePath = generateSmoothPath(chartPoints, 300, 100);
            
            return (
              <>
                {/* Actual line path if available */}               
                {linePath && (
                  <path
                    fill="none"
                    stroke="#ffd4d4"
                    strokeWidth="2"
                    d={linePath}
                  />
                )}
                
                {/* Fallback to mock data if no real data */}
                {!linePath && (
                  <path
                    fill="none"
                    stroke="#ffd4d4"
                    strokeWidth="2"
                    d="M0,65 C8,63 15,58 25,55 C35,52 42,68 52,72 C62,76 68,45 78,42 C88,39 95,75 105,78 C115,81 122,35 132,32 C142,29 148,85 158,88 C168,91 175,25 185,22 C195,19 202,80 212,83 C222,86 228,40 238,37 C248,34 255,70 265,73 C275,76 285,28 300,25"
                  />
                )}
              </>
            );
          })()}
        </svg>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Buy Rate */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Buy Rate</p>
          <p className="text-base font-semibold text-white mb-2">
            <AnimateINR 
              value={buyRate}
              className="justify-center text-base font-semibold text-white"
            />
          </p>
          <button 
            onClick={onBuyClick}
            className="w-full btn-strike-primary rounded-xl flex items-center justify-center space-x-1"
          >
            
            <span className="font-medium">Buy</span>
          </button>
        </div>

        {/* Sell Rate */}
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Sell Rate</p>
          <p className="text-base font-semibold text-white mb-2">
            <AnimateINR 
              value={sellRate}
              className="justify-center text-base font-semibold text-white"
            />
          </p>
          <button 
            onClick={onSellClick}
            className="w-full btn-strike-primary rounded-xl flex items-center justify-center space-x-1"
          >
            
            <span className="font-medium">Sell</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BitcoinPrice;
