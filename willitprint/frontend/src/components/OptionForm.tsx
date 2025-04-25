import { useState, FormEvent } from 'react';

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

const OptionForm = ({ onSubmit, isLoading }: OptionFormProps) => {
  const [formData, setFormData] = useState<OptionFormData>({
    ticker: '',
    strikePrice: 0,
    expirationDate: '',
    optionType: 'call',
    premiumPaid: 0,
    contracts: 1
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: name === 'strikePrice' || name === 'premiumPaid' || name === 'contracts' 
        ? parseFloat(value) || 0 
        : value
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-center">Enter Your YOLO Contract</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="ticker" className="block mb-1 font-medium text-gray-300">
            Ticker Symbol
          </label>
          <input
            type="text"
            id="ticker"
            name="ticker"
            placeholder="e.g. GOOGL, AAPL, TSLA"
            value={formData.ticker}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="strikePrice" className="block mb-1 font-medium text-gray-300">
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
              placeholder="e.g. 155"
              value={formData.strikePrice || ''}
              onChange={handleChange}
              className="input pl-7"
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="expirationDate" className="block mb-1 font-medium text-gray-300">
            Expiration Date
          </label>
          <input
            type="date"
            id="expirationDate"
            name="expirationDate"
            value={formData.expirationDate}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="optionType" className="block mb-1 font-medium text-gray-300">
            Option Type
          </label>
          <select
            id="optionType"
            name="optionType"
            value={formData.optionType}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="call">Call 📈</option>
            <option value="put">Put 📉</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="premiumPaid" className="block mb-1 font-medium text-gray-300">
            Premium Paid (per contract)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">$</span>
            </div>
            <input
              type="number"
              id="premiumPaid"
              name="premiumPaid"
              placeholder="e.g. 9.15"
              value={formData.premiumPaid || ''}
              onChange={handleChange}
              className="input pl-7"
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label htmlFor="contracts" className="block mb-1 font-medium text-gray-300">
            Number of Contracts
          </label>
          <input
            type="number"
            id="contracts"
            name="contracts"
            placeholder="e.g. 1"
            value={formData.contracts}
            onChange={handleChange}
            className="input"
            min="1"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary w-full py-3" 
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculating...
            </span>
          ) : (
            "Will It Print? 💸"
          )}
        </button>
      </form>
    </div>
  );
};

export default OptionForm; 