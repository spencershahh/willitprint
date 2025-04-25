import { useState, useEffect } from 'react';
import { 
  calculateProfitLossMatrix, 
  calculateBreakEven, 
  calculateProbabilityOfProfit,
  calculateMaxProfit,
  calculateMaxLoss,
  calculateGreeks
} from '../utils/optionsMath';

interface OptionsProfitCalculatorProps {
  ticker: string;
  strikePrice: number;
  expirationDate: string;
  optionType: 'call' | 'put';
  premiumPaid: number;
  contracts: number;
  currentPrice?: number;
  volatility?: number;
}

const OptionsProfitCalculator = ({
  ticker,
  strikePrice,
  expirationDate,
  optionType,
  premiumPaid,
  contracts,
  currentPrice: propCurrentPrice,
  volatility: propVolatility
}: OptionsProfitCalculatorProps) => {
  // State variables
  const [currentPrice, setCurrentPrice] = useState(propCurrentPrice || strikePrice * 0.95);
  const [volatility, setVolatility] = useState(propVolatility || 0.3); // 30% default
  const [riskFreeRate, setRiskFreeRate] = useState(0.05); // 5% default
  const [profitData, setProfitData] = useState<{
    profitMatrix: number[][];
    stockPrices: number[];
    dates: Date[];
  } | null>(null);
  const [breakEven, setBreakEven] = useState<number>(0);
  const [profitProbability, setProfitProbability] = useState<number>(0);
  const [maxProfit, setMaxProfit] = useState<number | 'unlimited'>(0);
  const [maxLoss, setMaxLoss] = useState<number>(0);
  const [greeks, setGreeks] = useState<{
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  } | null>(null);

  // Calculate days to expiry
  const today = new Date();
  // Use try-catch to handle potential date parsing errors
  let expiry = today;
  try {
    // Make sure we have a valid date string
    if (expirationDate && expirationDate.trim()) {
      expiry = new Date(expirationDate);
      // Check if the date is valid
      if (isNaN(expiry.getTime())) {
        // If invalid, fallback to today + 30 days
        expiry = new Date();
        expiry.setDate(today.getDate() + 30);
        console.warn('Invalid expiration date provided, defaulting to 30 days');
      }
    } else {
      // If no date is provided, default to 30 days from now
      expiry = new Date();
      expiry.setDate(today.getDate() + 30);
      console.warn('No expiration date provided, defaulting to 30 days');
    }
  } catch (error) {
    // Handle any parsing errors
    console.error('Error parsing expiration date:', error);
    // Default to 30 days from now
    expiry = new Date();
    expiry.setDate(today.getDate() + 30);
  }
  
  const daysToExpiry = Math.max(0, Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const timeToExpiryYears = daysToExpiry / 365;

  // Calculate all data when inputs change
  useEffect(() => {
    const isCall = optionType === 'call';
    
    // Calculate profit/loss matrix
    const profitLossData = calculateProfitLossMatrix(
      currentPrice,
      strikePrice,
      daysToExpiry,
      riskFreeRate,
      volatility,
      isCall,
      premiumPaid,
      contracts
    );
    setProfitData(profitLossData);
    
    // Calculate breakeven price
    const breakEvenPrice = calculateBreakEven(strikePrice, premiumPaid, isCall);
    setBreakEven(breakEvenPrice);
    
    // Calculate probability of profit
    const probability = calculateProbabilityOfProfit(
      currentPrice,
      breakEvenPrice, // Use breakeven for probability calculation
      daysToExpiry,
      volatility,
      isCall
    );
    setProfitProbability(probability);
    
    // Calculate max profit/loss
    const maxProfitValue = calculateMaxProfit(strikePrice, premiumPaid, contracts, isCall);
    setMaxProfit(maxProfitValue);
    
    const maxLossValue = calculateMaxLoss(premiumPaid, contracts);
    setMaxLoss(maxLossValue);
    
    // Calculate Greeks
    if (daysToExpiry > 0) {
      const greeksData = calculateGreeks(
        currentPrice,
        strikePrice,
        timeToExpiryYears,
        riskFreeRate,
        volatility,
        isCall
      );
      setGreeks(greeksData);
    } else {
      setGreeks(null);
    }
  }, [
    currentPrice, 
    strikePrice, 
    expirationDate, 
    optionType, 
    premiumPaid, 
    contracts, 
    volatility,
    riskFreeRate,
    daysToExpiry,
    timeToExpiryYears
  ]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Get color for profit/loss value
  const getProfitLossColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-200';
  };

  return (
    <div className="bg-dark-600/60 backdrop-blur-lg rounded-xl p-6 shadow-lg">
      {/* Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Current Price Input */}
        <div>
          <label htmlFor="currentPrice" className="form-label">
            Current Stock Price
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">$</span>
            </div>
            <input
              type="number"
              id="currentPrice"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
              className="input highlight pl-7"
              step="0.01"
              min="0.01"
            />
          </div>
        </div>
        
        {/* Volatility Input */}
        <div>
          <label htmlFor="volatility" className="form-label">
            Implied Volatility
          </label>
          <div className="relative">
            <input
              type="number"
              id="volatility"
              value={volatility * 100}
              onChange={(e) => setVolatility(parseFloat(e.target.value) / 100 || 0)}
              className="input highlight pr-10"
              step="1"
              min="1"
              max="300"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400">%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-dark-700/60 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Probability</div>
          <div className={`text-lg font-bold ${getProfitLossColor(profitProbability - 50)}`}>
            {formatPercent(profitProbability)}
          </div>
        </div>
        
        <div className="bg-dark-700/60 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Break Even</div>
          <div className="text-lg font-bold">
            {formatCurrency(breakEven)}
          </div>
        </div>
        
        <div className="bg-dark-700/60 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Max Profit</div>
          <div className="text-lg font-bold text-green-400">
            {typeof maxProfit === 'string' ? maxProfit : formatCurrency(maxProfit)}
          </div>
        </div>
        
        <div className="bg-dark-700/60 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Max Loss</div>
          <div className="text-lg font-bold text-red-400">
            {formatCurrency(maxLoss)}
          </div>
        </div>
      </div>
      
      {/* Greek Values */}
      {greeks && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Greeks</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
            <div className="bg-dark-700/40 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Delta</div>
              <div className="text-base font-medium">{greeks.delta.toFixed(3)}</div>
            </div>
            <div className="bg-dark-700/40 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Gamma</div>
              <div className="text-base font-medium">{greeks.gamma.toFixed(4)}</div>
            </div>
            <div className="bg-dark-700/40 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Theta</div>
              <div className="text-base font-medium">{greeks.theta.toFixed(3)}</div>
            </div>
            <div className="bg-dark-700/40 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Vega</div>
              <div className="text-base font-medium">{greeks.vega.toFixed(3)}</div>
            </div>
            <div className="bg-dark-700/40 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Rho</div>
              <div className="text-base font-medium">{greeks.rho.toFixed(3)}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Profit Matrix */}
      {profitData && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Profit/Loss Matrix</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700 text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700">
                    Price
                  </th>
                  {profitData.dates.map((date, i) => (
                    <th 
                      key={i} 
                      className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700"
                    >
                      {formatDate(date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {profitData.stockPrices.map((price, i) => (
                  <tr key={i} className={price === breakEven ? 'bg-primary-900/20' : ''}>
                    <td className="px-3 py-2 whitespace-nowrap font-mono text-gray-300">
                      ${price.toFixed(2)}
                    </td>
                    {profitData.profitMatrix[i].map((profit, j) => (
                      <td 
                        key={j} 
                        className={`px-3 py-2 whitespace-nowrap text-right font-mono ${getProfitLossColor(profit)}`}
                      >
                        {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionsProfitCalculator; 