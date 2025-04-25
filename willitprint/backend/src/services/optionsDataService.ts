import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

interface OptionsCache {
  [ticker: string]: {
    lastUpdated: number;
    expirations: string[];
    chains: {
      [expiration: string]: {
        calls: OptionContract[];
        puts: OptionContract[];
      }
    }
  }
}

interface OptionContract {
  ticker: string;
  strikePrice: number;
  expirationDate: string;
  optionType: 'call' | 'put';
  bid: number;
  ask: number;
  lastPrice: number;
  volume: number;
  openInterest: number;
  impliedVolatility?: number;
}

// Cache expiration in milliseconds (15 minutes)
const CACHE_EXPIRATION = 15 * 60 * 1000;

// Path to cache file
const CACHE_PATH = path.join(__dirname, '../../cache');
const CACHE_FILE = path.join(CACHE_PATH, 'options_cache.json');

// Initialize cache
let optionsCache: OptionsCache = {};

// Initialize the cache directory
const initializeCache = async () => {
  try {
    await fs.mkdir(CACHE_PATH, { recursive: true });
    try {
      const cacheData = await fs.readFile(CACHE_FILE, 'utf8');
      optionsCache = JSON.parse(cacheData);
      console.log('Options cache loaded from file');
    } catch (error) {
      // If file doesn't exist or is invalid, use empty cache
      optionsCache = {};
      await fs.writeFile(CACHE_FILE, JSON.stringify(optionsCache), 'utf8');
      console.log('Created new options cache file');
    }
  } catch (error) {
    console.error('Error initializing cache:', error);
  }
};

// Save cache to file
const saveCache = async () => {
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(optionsCache), 'utf8');
  } catch (error) {
    console.error('Error saving cache:', error);
  }
};

// Get options data for a ticker from Polygon.io
export const getOptionsData = async (ticker: string, forceRefresh = false): Promise<{
  expirations: string[];
  chains: {
    [expiration: string]: {
      calls: OptionContract[];
      puts: OptionContract[];
    }
  }
}> => {
  // Initialize cache if needed
  if (Object.keys(optionsCache).length === 0) {
    await initializeCache();
  }
  
  const now = Date.now();
  
  // Check if we have fresh cached data
  if (
    !forceRefresh &&
    optionsCache[ticker] &&
    (now - optionsCache[ticker].lastUpdated) < CACHE_EXPIRATION
  ) {
    return {
      expirations: optionsCache[ticker].expirations,
      chains: optionsCache[ticker].chains
    };
  }
  
  // If no cache or expired, fetch from API
  try {
    const apiKey = process.env.POLYGON_API_KEY;
    
    if (!apiKey) {
      throw new Error('POLYGON_API_KEY not found in environment variables');
    }
    
    // Get available expiration dates
    const expirationResponse = await axios.get(
      `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${ticker}&limit=1000&apiKey=${apiKey}`
    );
    
    if (!expirationResponse.data.results || expirationResponse.data.results.length === 0) {
      throw new Error(`No options found for ${ticker}`);
    }
    
    // Extract unique expiration dates
    const expirationSet = new Set<string>();
    expirationResponse.data.results.forEach((contract: any) => {
      expirationSet.add(contract.expiration_date);
    });
    
    const expirations = Array.from(expirationSet).sort();
    
    // Initialize chains object
    const chains: {
      [expiration: string]: {
        calls: OptionContract[];
        puts: OptionContract[];
      }
    } = {};
    
    // Only fetch data for the first few expirations to avoid API rate limits
    const expirationsToFetch = expirations.slice(0, 3);
    
    for (const expiration of expirationsToFetch) {
      // Fetch options chain for this expiration
      const chainResponse = await axios.get(
        `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${ticker}&expiration_date=${expiration}&limit=1000&apiKey=${apiKey}`
      );
      
      if (!chainResponse.data.results) {
        continue;
      }
      
      const calls: OptionContract[] = [];
      const puts: OptionContract[] = [];
      
      // Process contracts
      for (const contract of chainResponse.data.results) {
        const isCall = contract.contract_type === 'call';
        const optionData: OptionContract = {
          ticker: contract.ticker,
          strikePrice: contract.strike_price,
          expirationDate: contract.expiration_date,
          optionType: isCall ? 'call' : 'put',
          bid: contract.bid || 0,
          ask: contract.ask || 0,
          lastPrice: contract.close || 0,
          volume: contract.volume || 0,
          openInterest: contract.open_interest || 0,
          impliedVolatility: contract.implied_volatility || calculateImpliedVolatility(
            ticker,
            contract.underlying_price || 0,
            contract.strike_price,
            contract.expiration_date,
            isCall ? 'call' : 'put',
            (contract.ask + contract.bid) / 2
          )
        };
        
        if (isCall) {
          calls.push(optionData);
        } else {
          puts.push(optionData);
        }
      }
      
      // Sort by strike price
      calls.sort((a, b) => a.strikePrice - b.strikePrice);
      puts.sort((a, b) => a.strikePrice - b.strikePrice);
      
      chains[expiration] = { calls, puts };
    }
    
    // Update cache
    optionsCache[ticker] = {
      lastUpdated: now,
      expirations,
      chains
    };
    
    // Save cache to file
    await saveCache();
    
    return {
      expirations,
      chains
    };
    
  } catch (error) {
    console.error(`Error fetching options data for ${ticker}:`, error);
    
    // Return cached data if available, even if expired
    if (optionsCache[ticker]) {
      return {
        expirations: optionsCache[ticker].expirations,
        chains: optionsCache[ticker].chains
      };
    }
    
    // Return empty data if no cache
    return {
      expirations: [],
      chains: {}
    };
  }
};

// Simplified implied volatility estimation
// In a real implementation, this would use a proper algorithm
const calculateImpliedVolatility = (
  ticker: string,
  stockPrice: number,
  strikePrice: number,
  expirationDate: string,
  optionType: 'call' | 'put',
  optionPrice: number
): number => {
  // This is a very simplified approach
  // We'd normally use a numerical method like Newton-Raphson to solve for IV
  const daysToExpiry = Math.floor((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  // Simple IV estimate based on price and days to expiry
  const diffPercent = Math.abs((stockPrice - strikePrice) / stockPrice);
  let iv = optionPrice / (stockPrice * Math.sqrt(daysToExpiry / 365)) * 10;
  
  // Add more IV for OTM options
  if ((optionType === 'call' && strikePrice > stockPrice) || 
      (optionType === 'put' && strikePrice < stockPrice)) {
    iv += diffPercent * 0.5;
  }
  
  return Math.min(Math.max(iv, 0.05), 2.0); // Clamp between 5% and 200%
};

// Get the nearest options to a specific price point
export const findNearestOptions = async (
  ticker: string,
  targetPrice: number,
  expirationDate: string
): Promise<{
  calls: OptionContract[];
  puts: OptionContract[];
}> => {
  const data = await getOptionsData(ticker);
  
  // Find the closest expiration date if exact match not found
  let closestExpiration = expirationDate;
  if (!data.chains[expirationDate]) {
    const availableDates = data.expirations;
    if (availableDates.length === 0) {
      return { calls: [], puts: [] };
    }
    
    // Find closest date
    let minDiff = Infinity;
    const targetDate = new Date(expirationDate).getTime();
    
    for (const date of availableDates) {
      const diff = Math.abs(new Date(date).getTime() - targetDate);
      if (diff < minDiff) {
        minDiff = diff;
        closestExpiration = date;
      }
    }
  }
  
  if (!data.chains[closestExpiration]) {
    return { calls: [], puts: [] };
  }
  
  const { calls, puts } = data.chains[closestExpiration];
  
  // Filter to get options closest to target price
  const filteredCalls = calls
    .filter(call => Math.abs(call.strikePrice - targetPrice) / targetPrice < 0.20) // Within 20% of target
    .sort((a, b) => Math.abs(a.strikePrice - targetPrice) - Math.abs(b.strikePrice - targetPrice))
    .slice(0, 5);
    
  const filteredPuts = puts
    .filter(put => Math.abs(put.strikePrice - targetPrice) / targetPrice < 0.20) // Within 20% of target
    .sort((a, b) => Math.abs(a.strikePrice - targetPrice) - Math.abs(b.strikePrice - targetPrice))
    .slice(0, 5);
  
  return {
    calls: filteredCalls,
    puts: filteredPuts
  };
};

// Initialize cache on module load
initializeCache(); 