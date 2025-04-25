import OptionsProfitCalculator from './OptionsProfitCalculator';

type OptionResult = {
  ticker: string;
  strikePrice: number;
  expirationDate: string;
  optionType: 'call' | 'put';
  currentPrice: number;
  breakEvenPrice: number;
  probabilityOfProfit: number;
  maxRisk: number;
  maxProfit: string; // "unlimited" for calls or a number for puts
  valueRange: {
    today: number;
    nextWeek: number;
    nextMonth: number;
  };
  aiVerdict: {
    memeVerdict: string;
    commentary: string;
  };
};

type ResultsDisplayProps = {
  result: OptionResult;
  onReset: () => void;
};

const ResultsDisplay = ({ result, onReset }: ResultsDisplayProps) => {
  const {
    ticker,
    strikePrice,
    expirationDate,
    optionType,
    currentPrice,
    breakEvenPrice,
    probabilityOfProfit,
    maxRisk,
    maxProfit,
    valueRange,
    aiVerdict
  } = result;

  // Format a date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format a currency value
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Determine result class based on probability
  const getResultClass = (probability: number) => {
    if (probability >= 60) return 'text-green-400';
    if (probability >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 animate-fade-in">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="btn btn-secondary py-2.5 px-5 rounded-full transition-all text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              New Contract
            </button>
            
            <span className="text-gray-500">|</span>
            
            <h2 className="text-xl md:text-2xl font-bold gradient-text">
              {ticker} {optionType === 'call' ? 'Call' : 'Put'} @{formatCurrency(strikePrice)}
            </h2>
          </div>
          <p className="text-gray-400 mt-1.5 text-sm">
            Expires: {formatDate(expirationDate)} • Current price: {formatCurrency(currentPrice)}
          </p>
        </div>
      </div>

      {/* AI Verdict */}
      <div className="mb-10 glass-card p-8 border-primary-900 relative depth-effect">
        <div className="absolute top-6 right-6">
          <div className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium ${
            probabilityOfProfit >= 60 ? 'bg-green-900/40 text-green-400 border border-green-700/30' : 
            probabilityOfProfit >= 40 ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/30' : 
            'bg-red-900/40 text-red-400 border border-red-700/30'
          }`}>
            {probabilityOfProfit}% chance
          </div>
        </div>
        
        <h3 className="text-2xl font-bold mb-8 text-center gradient-text-large">
          The Verdict
        </h3>
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-opacity-20 bg-primary-700 ring-4 ring-primary-900/50 ring-opacity-30 shadow-lg shadow-primary-900/20">
            {probabilityOfProfit >= 60 ? (
              <span className="text-4xl">🚀</span>
            ) : probabilityOfProfit >= 40 ? (
              <span className="text-4xl">💰</span>
            ) : (
              <span className="text-4xl">💀</span>
            )}
          </div>
        </div>
        
        <div className="text-2xl font-bold text-center mb-5 gradient-text">
          {aiVerdict.memeVerdict}
        </div>
        
        <div className="text-center italic text-gray-300 border-t border-dark-400/50 pt-5 mt-5 max-w-2xl mx-auto">
          "{aiVerdict.commentary}"
        </div>
      </div>

      <div className="stats-grid mb-10">
        {/* Key Stats */}
        <div className="glass-card p-8 h-full depth-effect">
          <h3 className="text-lg font-bold mb-6 border-b border-dark-400/50 pb-3 text-primary-400">
            Key Stats
          </h3>
          
          <div className="space-y-7">
            <div>
              <div className="stat-label">Breakeven Price</div>
              <div className="stat-value">{formatCurrency(breakEvenPrice)}</div>
            </div>
            
            <div>
              <div className="stat-label">Probability of Profit</div>
              <div className={`stat-value ${getResultClass(probabilityOfProfit)}`}>
                {probabilityOfProfit}%
              </div>
            </div>
            
            <div>
              <div className="stat-label">Max Risk</div>
              <div className="stat-value text-red-400">
                {formatCurrency(maxRisk)}
              </div>
            </div>
            
            <div>
              <div className="stat-label">Max Profit</div>
              <div className="stat-value text-green-400">
                {typeof maxProfit === 'number' ? formatCurrency(maxProfit) : maxProfit}
              </div>
            </div>
          </div>
        </div>
        
        {/* Value Projection */}
        <div className="glass-card p-8 h-full depth-effect">
          <h3 className="text-lg font-bold mb-6 border-b border-dark-400/50 pb-3 text-primary-400">
            Value Projection
          </h3>
          
          <div className="space-y-7">
            <div className="flex justify-between items-center">
              <span className="stat-label">Today</span>
              <span className="text-lg font-semibold">{formatCurrency(valueRange.today)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="stat-label">Next Week</span>
              <span className={`text-lg font-semibold ${valueRange.nextWeek > valueRange.today ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(valueRange.nextWeek)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="stat-label">Next Month</span>
              <span className={`text-lg font-semibold ${valueRange.nextMonth > valueRange.today ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(valueRange.nextMonth)}
              </span>
            </div>
            
            <div className="pt-5 border-t border-dark-400/50">
              <div className="text-sm text-gray-400 mb-3">Value Range</div>
              <div className="flex items-center gap-3">
                <div className="relative bg-dark-400/60 h-4 flex-grow rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-to-r from-red-600 via-yellow-500 to-green-400 h-full"
                    style={{ width: `${probabilityOfProfit}%` }}
                  ></div>
                  <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white bg-opacity-50"></div>
                </div>
                <span className="text-sm text-gray-300 min-w-[46px] text-right font-medium">
                  {probabilityOfProfit}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Options Profit Calculator */}
      <div className="glass-card p-8 mb-10 depth-effect">
        <h3 className="text-lg font-bold mb-6 border-b border-dark-400/50 pb-3 text-primary-400">
          Profit/Loss Table by Expiration
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-400/50">
                <th className="text-left py-3 px-4 text-gray-300 font-medium">PRICE</th>
                <th className="text-right py-3 px-4 text-gray-300 font-medium">EXPIRY</th>
              </tr>
            </thead>
            <tbody>
              {[0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5].map((multiplier) => {
                const price = (strikePrice * multiplier).toFixed(2);
                const profit = optionType === 'call'
                  ? (Math.max(0, parseFloat(price) - strikePrice) * 100 * (result as any).contracts) - maxRisk
                  : (Math.max(0, strikePrice - parseFloat(price)) * 100 * (result as any).contracts) - maxRisk;
                
                // Highlight the row that is closest to the current price
                const isNearCurrentPrice = Math.abs(parseFloat(price) - currentPrice) < (strikePrice * 0.05);
                
                return (
                  <tr key={multiplier} className={`border-b border-dark-400/30 ${isNearCurrentPrice ? 'bg-dark-500/50' : ''}`}>
                    <td className="py-3 px-4 font-mono">${price}</td>
                    <td className={`py-3 px-4 text-right font-mono ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Calculator */}
      <div className="glass-card p-8 depth-effect">
        <h3 className="text-lg font-bold mb-6 border-b border-dark-400/50 pb-3 text-primary-400">
          Detailed Profit Calculator
        </h3>
        <OptionsProfitCalculator 
          ticker={ticker}
          strikePrice={strikePrice}
          expirationDate={expirationDate}
          optionType={optionType}
          premiumPaid={maxRisk / (100 * (result as any).contracts || 1)}
          contracts={(result as any).contracts || 1}
          currentPrice={currentPrice}
          volatility={0.4} // Default 40% volatility
        />
      </div>
    </div>
  );
};

export default ResultsDisplay; 