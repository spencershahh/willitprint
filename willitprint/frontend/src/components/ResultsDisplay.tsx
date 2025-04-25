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
    <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            {ticker} {optionType === 'call' ? 'Call' : 'Put'} @{formatCurrency(strikePrice)} exp. {formatDate(expirationDate)}
          </h2>
          <p className="text-gray-400">
            Current price: {formatCurrency(currentPrice)}
          </p>
        </div>
        <button
          onClick={onReset}
          className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
        >
          ← New Contract
        </button>
      </div>

      {/* AI Verdict */}
      <div className="mb-8 bg-gray-900 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-bold mb-2 text-center">
          The Verdict
        </h3>
        <div className="text-2xl font-bold text-center mb-4">
          {aiVerdict.memeVerdict}
        </div>
        <div className="text-center italic text-gray-300">
          "{aiVerdict.commentary}"
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Stats */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">
            Key Stats
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="text-gray-400 text-sm">Breakeven Price</div>
              <div className="text-xl font-semibold">{formatCurrency(breakEvenPrice)}</div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm">Probability of Profit</div>
              <div className={`text-xl font-semibold ${getResultClass(probabilityOfProfit)}`}>
                {probabilityOfProfit}%
              </div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm">Max Risk</div>
              <div className="text-xl font-semibold text-red-400">
                {formatCurrency(maxRisk)}
              </div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm">Max Profit</div>
              <div className="text-xl font-semibold text-green-400">
                {typeof maxProfit === 'number' ? formatCurrency(maxProfit) : maxProfit}
              </div>
            </div>
          </div>
        </div>
        
        {/* Value Projection */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">
            Value Projection
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Today</span>
              <span className="font-semibold">{formatCurrency(valueRange.today)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Next Week</span>
              <span className={valueRange.nextWeek > valueRange.today ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                {formatCurrency(valueRange.nextWeek)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Next Month</span>
              <span className={valueRange.nextMonth > valueRange.today ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                {formatCurrency(valueRange.nextMonth)}
              </span>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Value Range</div>
              <div className="flex items-center gap-2">
                <div className="bg-gray-700 h-4 flex-grow rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-full"
                    style={{ width: `${probabilityOfProfit}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400">
                  {probabilityOfProfit}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay; 