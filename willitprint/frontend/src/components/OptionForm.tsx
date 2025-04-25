import { useState, FormEvent, useEffect } from 'react';

type OptionFormData = {
  ticker: string;
  strikePrice: number;
  expirationDate: string;
  optionType: 'call' | 'put';
  premiumPaid: number;
  contracts: number;
};

type OptionFormProps = {
  onSubmit: (data: OptionFormData) => void;
  isLoading: boolean;
};

// Define types for API responses
interface OptionData {
  expirationDate: string;
  strikePrice: number;
  optionType: 'call' | 'put';
  premium: number;
}

interface OptionsResponse {
  ticker: string;
  options: OptionData[];
}

interface StrikesResponse {
  ticker: string;
  expiration: string;
  type: 'call' | 'put';
  strikes: number[];
}

interface StockPriceResponse {
  ticker: string;
  price: number;
  delayedBy: string;
}

// API URL from environment or default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const OptionForm = ({ onSubmit, isLoading }: OptionFormProps) => {
  const [formData, setFormData] = useState<OptionFormData>({
    ticker: '',
    strikePrice: 0,
    expirationDate: '',
    optionType: 'call',
    premiumPaid: 0,
    contracts: 1
  });
  
  // State for available options
  const [availableStrikePrices, setAvailableStrikePrices] = useState<number[]>([]);
  const [availableExpirations, setAvailableExpirations] = useState<string[]>([]);
  const [showStrikePricesList, setShowStrikePricesList] = useState(false);
  const [fetchingOptions, setFetchingOptions] = useState(false);
  
  // New state for current stock price
  const [currentStockPrice, setCurrentStockPrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceDelay, setPriceDelay] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: name === 'strikePrice' || name === 'premiumPaid' || name === 'contracts' 
        ? parseFloat(value) || 0 
        : value
    });
  };
  
  // Function to fetch current stock price
  const fetchCurrentPrice = async () => {
    if (!formData.ticker || formData.ticker.length < 1) {
      return;
    }
    
    setFetchingPrice(true);
    try {
      const response = await fetch(`${API_URL}/stock-price?ticker=${formData.ticker.toUpperCase()}`);
      if (response.ok) {
        const data = await response.json() as StockPriceResponse;
        setCurrentStockPrice(data.price);
        setPriceDelay(data.delayedBy);
        
        // Also set this as the initial strike price if strike price is not yet set
        if (!formData.strikePrice) {
          setFormData(prev => ({
            ...prev,
            strikePrice: data.price
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
    } finally {
      setFetchingPrice(false);
    }
  };

  // Fetch available options when ticker changes and has at least 1 character
  useEffect(() => {
    const fetchAvailableOptions = async () => {
      if (formData.ticker.length < 1) return;

      setFetchingOptions(true);
      try {
        const response = await fetch(`${API_URL}/available-options?ticker=${formData.ticker.toUpperCase()}`);
        if (response.ok) {
          const data = await response.json() as OptionsResponse;
          
          // Extract unique expirations and strike prices
          const expirations = [...new Set(data.options.map(opt => opt.expirationDate))];
          expirations.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
          
          setAvailableExpirations(expirations);
          
          // If we have an expiration date selected, filter strike prices
          if (formData.expirationDate && formData.expirationDate !== '') {
            const filteredOptions = data.options.filter(opt => 
              opt.expirationDate === formData.expirationDate && 
              opt.optionType === formData.optionType
            );
            
            // Sort strike prices
            const strikes = [...new Set(filteredOptions.map(opt => opt.strikePrice))];
            strikes.sort((a, b) => a - b);
            
            setAvailableStrikePrices(strikes);
          }
        }
      } catch (error) {
        console.error('Error fetching available options:', error);
        // Set some dummy data for development/testing
        setAvailableStrikePrices([100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150]);
        setAvailableExpirations(['2024-06-21', '2024-07-19', '2024-08-16', '2024-09-20']);
      } finally {
        setFetchingOptions(false);
      }
    };

    fetchAvailableOptions();
  }, [formData.ticker]);

  // Update available strike prices when expiration date or option type changes
  useEffect(() => {
    if (formData.ticker.length < 1 || !formData.expirationDate) return;

    const fetchStrikePrices = async () => {
      setFetchingOptions(true);
      try {
        const response = await fetch(
          `${API_URL}/available-strikes?ticker=${formData.ticker.toUpperCase()}&expiration=${formData.expirationDate}&type=${formData.optionType}`
        );
        
        if (response.ok) {
          const data = await response.json() as StrikesResponse;
          const strikes = [...new Set(data.strikes)];
          strikes.sort((a, b) => a - b);
          setAvailableStrikePrices(strikes);
        }
      } catch (error) {
        console.error('Error fetching strike prices:', error);
        // Set some dummy data for development/testing
        setAvailableStrikePrices([100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150]);
      } finally {
        setFetchingOptions(false);
      }
    };

    fetchStrikePrices();
  }, [formData.expirationDate, formData.optionType, formData.ticker]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSelectStrikePrice = (strikePrice: number) => {
    setFormData({
      ...formData,
      strikePrice
    });
    setShowStrikePricesList(false);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="form-fixed-container mx-auto flex justify-center">
      <div className="card glass-card shadow-xl mx-auto">
        <h2 className="text-xl font-bold mb-6 text-center gradient-text-large">New Contract Analysis</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* Ticker Symbol with Get Price button */}
            <div className="form-field">
              <label htmlFor="ticker" className="form-label">
                Ticker Symbol
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="ticker"
                  name="ticker"
                  placeholder="GME, AAPL, TSLA"
                  value={formData.ticker}
                  onChange={handleChange}
                  className="form-input flex-1"
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={fetchCurrentPrice}
                  className="bg-primary-600 hover:bg-primary-700 text-white rounded-md px-3 py-2 transition-colors"
                  disabled={fetchingPrice || !formData.ticker}
                >
                  {fetchingPrice ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading</span>
                    </span>
                  ) : (
                    'Get price'
                  )}
                </button>
              </div>
            </div>
            
            {/* Current Stock Price - Show when available */}
            {currentStockPrice !== null && (
              <div className="form-field">
                <label className="form-label">Current Price</label>
                <div className="flex items-center">
                  <span className="form-input bg-opacity-50 cursor-default">{formatCurrency(currentStockPrice)}</span>
                  <span className="ml-2 text-xs text-gray-400">Delayed by {priceDelay}</span>
                </div>
              </div>
            )}

            {/* Expiration Date Selection */}
            <div className="form-field">
              <label htmlFor="expirationDate" className="form-label">
                Expiration Date
              </label>
              {availableExpirations.length > 0 ? (
                <select
                  id="expirationDate"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Select an expiration date</option>
                  {availableExpirations.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  id="expirationDate"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="optionType" className="form-label">
                Option Type
              </label>
              <div className="option-toggle">
                <div 
                  className={`toggle-option ${formData.optionType === 'call' ? 'active' : 'inactive'}`}
                  onClick={() => setFormData({...formData, optionType: 'call'})}
                >
                  Call 📈
                </div>
                <div 
                  className={`toggle-option ${formData.optionType === 'put' ? 'active' : 'inactive'}`}
                  onClick={() => setFormData({...formData, optionType: 'put'})}
                >
                  Put 📉
                </div>
                <div className={`toggle-slider ${formData.optionType === 'put' ? 'right' : ''}`}></div>
              </div>
            </div>
            
            <div className="form-field">
              <label htmlFor="strikePrice" className="form-label">
                Strike Price
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">$</span>
                </div>
                <input
                  type="number"
                  id="strikePrice"
                  name="strikePrice"
                  placeholder="155"
                  value={formData.strikePrice || ''}
                  onChange={handleChange}
                  className="form-input pl-8"
                  step="0.01"
                  min="0"
                  required
                  autoComplete="off"
                  onFocus={() => setShowStrikePricesList(true)}
                />
                {showStrikePricesList && availableStrikePrices.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-dark-700 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                    {fetchingOptions ? (
                      <div className="p-4 text-center text-gray-400">Loading strike prices...</div>
                    ) : (
                      <ul>
                        {availableStrikePrices.map((strike) => (
                          <li 
                            key={strike} 
                            className="px-4 py-2 hover:bg-dark-600 cursor-pointer"
                            onClick={() => handleSelectStrikePrice(strike)}
                          >
                            {formatCurrency(strike)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {availableStrikePrices.length > 0 && (
                  <button 
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowStrikePricesList(!showStrikePricesList)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="form-field">
              <label htmlFor="premiumPaid" className="form-label">
                Premium Per Contract
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">$</span>
                </div>
                <input
                  type="number"
                  id="premiumPaid"
                  name="premiumPaid"
                  placeholder="9.15"
                  value={formData.premiumPaid || ''}
                  onChange={handleChange}
                  className="form-input pl-8"
                  step="0.01"
                  min="0"
                  required
                  autoComplete="off"
                />
              </div>
            </div>
            
            <div className="form-field">
              <label htmlFor="contracts" className="form-label">
                Number of Contracts
              </label>
              <input
                type="number"
                id="contracts"
                name="contracts"
                placeholder="1"
                value={formData.contracts}
                onChange={handleChange}
                className="form-input"
                min="1"
                required
                autoComplete="off"
              />
            </div>
          </div>
          
          <div className="mt-8">
            <button 
              type="submit" 
              className="form-button" 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <span>Will It Print?</span>
                  <span className="ml-2">🔮</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OptionForm; 