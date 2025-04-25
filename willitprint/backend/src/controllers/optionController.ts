import { Request, Response } from 'express';
import { calculateOptionProfitability } from '../services/optionService';
import { generateAIVerdict } from '../services/aiService';
import { getOptionsData, findNearestOptions } from '../services/optionsDataService';

export const analyzeOption = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticker, strikePrice, expirationDate, optionType, premiumPaid, contracts } = req.body;
    
    // Validate input
    if (!ticker || !strikePrice || !expirationDate || !optionType || premiumPaid === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Try to get real options data from Polygon if API key is available
    let currentPrice = null;
    let impliedVolatility = null;
    let realOptionData = null;
    
    if (process.env.POLYGON_API_KEY) {
      try {
        // Get options data
        const optionsData = await getOptionsData(ticker);
        
        if (optionsData.expirations.length > 0) {
          // Get the nearest options to the strike price
          const nearestOptions = await findNearestOptions(
            ticker, 
            strikePrice, 
            expirationDate
          );
          
          // Find the option with the closest strike price
          const relevantOptions = optionType === 'call' ? nearestOptions.calls : nearestOptions.puts;
          
          if (relevantOptions.length > 0) {
            // Sort by how close strike price is to requested strike
            relevantOptions.sort((a, b) => 
              Math.abs(a.strikePrice - strikePrice) - Math.abs(b.strikePrice - strikePrice)
            );
            
            realOptionData = relevantOptions[0];
            currentPrice = realOptionData.lastPrice > 0 ? 
              (realOptionData.bid + realOptionData.ask) / 2 : 
              premiumPaid; // Use midpoint or fall back to user's premium
            
            impliedVolatility = realOptionData.impliedVolatility;
          }
        }
      } catch (error) {
        console.error('Error fetching options data:', error);
        // Continue with calculation without real options data
      }
    }
    
    // Calculate option profitability with real data if available, otherwise use mock
    const profitabilityData = await calculateOptionProfitability({
      ticker,
      strikePrice,
      expirationDate,
      optionType,
      premiumPaid: currentPrice || premiumPaid,
      contracts: contracts || 1,
      realOptionData
    });
    
    // Generate AI verdict if OpenAI API key is available
    let aiVerdict = null;
    if (process.env.OPENAI_API_KEY) {
      aiVerdict = await generateAIVerdict(profitabilityData);
    } else {
      // Generate basic verdict without AI
      aiVerdict = {
        memeVerdict: profitabilityData.probabilityOfProfit > 50 
          ? "🚀 LIKELY TO PRINT" 
          : "💀 PROBABLY NOT PRINTING",
        commentary: profitabilityData.probabilityOfProfit > 50
          ? `This ${optionType} might actually make you some tendies.`
          : `This ${optionType} is looking like a trip behind the Wendy's dumpster.`
      };
    }
    
    // Return combined data with real options data if available
    res.status(200).json({
      ...profitabilityData,
      aiVerdict,
      realData: !!realOptionData,
      impliedVolatility: impliedVolatility || 0.4, // Default 40% if not available
      contracts: contracts || 1
    });
    
  } catch (error) {
    console.error('Error analyzing option:', error);
    res.status(500).json({ error: 'Failed to analyze option' });
  }
};

/**
 * Get available options for a ticker
 */
export const getAvailableOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticker } = req.query;
    
    if (!ticker || typeof ticker !== 'string') {
      res.status(400).json({ error: 'Ticker is required' });
      return;
    }
    
    // Get options data
    const optionsData = await getOptionsData(ticker.toUpperCase());
    
    // Transform data into a more simplified format for the frontend
    const options: any[] = [];
    
    for (const expiration of optionsData.expirations) {
      const chain = optionsData.chains[expiration];
      
      // Skip if we don't have chain data for this expiration
      if (!chain) continue;
      
      // Add calls
      chain.calls.forEach(call => {
        options.push({
          expirationDate: call.expirationDate,
          strikePrice: call.strikePrice,
          optionType: 'call',
          premium: (call.bid + call.ask) / 2 || call.lastPrice || 0
        });
      });
      
      // Add puts
      chain.puts.forEach(put => {
        options.push({
          expirationDate: put.expirationDate,
          strikePrice: put.strikePrice,
          optionType: 'put',
          premium: (put.bid + put.ask) / 2 || put.lastPrice || 0
        });
      });
    }
    
    // If no options data from API, provide dummy data
    if (options.length === 0) {
      // Generate mock expirations (next 4 monthly options)
      const expirations = generateMockExpirations();
      
      // Generate mock strikes
      const basePrice = Math.floor(Math.random() * 100) + 50; // Random price between 50-150
      const strikes = generateMockStrikes(basePrice);
      
      for (const expiration of expirations) {
        for (const strike of strikes) {
          // Call
          options.push({
            expirationDate: expiration,
            strikePrice: strike,
            optionType: 'call',
            premium: Math.max(0.01, parseFloat((Math.random() * 5).toFixed(2)))
          });
          
          // Put
          options.push({
            expirationDate: expiration,
            strikePrice: strike,
            optionType: 'put',
            premium: Math.max(0.01, parseFloat((Math.random() * 5).toFixed(2)))
          });
        }
      }
    }
    
    res.status(200).json({
      ticker: ticker.toUpperCase(),
      options
    });
    
  } catch (error) {
    console.error('Error fetching available options:', error);
    res.status(500).json({ error: 'Failed to fetch available options' });
  }
};

/**
 * Get available strike prices for a specific ticker, expiration, and option type
 */
export const getAvailableStrikes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticker, expiration, type } = req.query;
    
    if (!ticker || !expiration || !type || 
        typeof ticker !== 'string' || 
        typeof expiration !== 'string' || 
        typeof type !== 'string' ||
        (type !== 'call' && type !== 'put')) {
      res.status(400).json({ error: 'Ticker, expiration, and type (call/put) are required' });
      return;
    }
    
    // Get options data
    const optionsData = await getOptionsData(ticker.toUpperCase());
    
    // Get chain for this expiration
    const chain = optionsData.chains[expiration];
    
    let strikes: number[] = [];
    
    if (chain) {
      // Get strikes for the requested option type
      strikes = type === 'call' 
        ? chain.calls.map(call => call.strikePrice)
        : chain.puts.map(put => put.strikePrice);
      
      // Remove duplicates and sort
      strikes = [...new Set(strikes)].sort((a, b) => a - b);
    }
    
    // If no strikes found, generate mock data
    if (strikes.length === 0) {
      const basePrice = Math.floor(Math.random() * 100) + 50; // Random price between 50-150
      strikes = generateMockStrikes(basePrice);
    }
    
    res.status(200).json({
      ticker: ticker.toUpperCase(),
      expiration,
      type,
      strikes
    });
    
  } catch (error) {
    console.error('Error fetching available strikes:', error);
    res.status(500).json({ error: 'Failed to fetch available strikes' });
  }
};

/**
 * Get current stock price for a ticker symbol
 */
export const getCurrentStockPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticker } = req.query;
    
    if (!ticker || typeof ticker !== 'string') {
      res.status(400).json({ error: 'Ticker is required' });
      return;
    }
    
    let currentPrice = 0;
    let delayedBy = '15 minutes';
    
    // Try to fetch price from API if Polygon key is available
    if (process.env.POLYGON_API_KEY) {
      try {
        const apiKey = process.env.POLYGON_API_KEY;
        const response = await fetch(
          `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${ticker.toUpperCase()}?apiKey=${apiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.ticker && data.ticker.lastTrade) {
            currentPrice = data.ticker.lastTrade.p;  // p is price
            // Convert lastUpdated timestamp to readable format
            const lastUpdated = new Date(data.ticker.lastTrade.t);
            const now = new Date();
            const diffMs = now.getTime() - lastUpdated.getTime();
            const diffMins = Math.round(diffMs / 60000);
            delayedBy = `${diffMins} minutes`;
          }
        } else {
          // Try alpha vantage as backup if polygon fails
          const alphaApiKey = process.env.ALPHA_VANTAGE_API_KEY;
          if (alphaApiKey) {
            const alphaResponse = await fetch(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker.toUpperCase()}&apikey=${alphaApiKey}`
            );
            if (alphaResponse.ok) {
              const alphaData = await alphaResponse.json();
              if (alphaData['Global Quote'] && alphaData['Global Quote']['05. price']) {
                currentPrice = parseFloat(alphaData['Global Quote']['05. price']);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching stock price from API:', error);
        // Continue with mock data
      }
    }
    
    // If no API data, generate a mock price
    if (currentPrice === 0) {
      // Generate a reasonable mock price between $10 and $500
      currentPrice = Math.floor(Math.random() * 490) + 10;
    }
    
    res.status(200).json({
      ticker: ticker.toUpperCase(),
      price: currentPrice,
      delayedBy
    });
    
  } catch (error) {
    console.error('Error fetching stock price:', error);
    res.status(500).json({ error: 'Failed to fetch stock price' });
  }
};

// Helper functions for mock data
function generateMockExpirations(): string[] {
  const expirations: string[] = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Generate 4 monthly expirations (3rd Friday of each month)
  for (let i = 0; i < 4; i++) {
    const month = (currentMonth + i) % 12;
    const year = currentYear + Math.floor((currentMonth + i) / 12);
    
    // Find the third Friday
    const date = new Date(year, month, 1);
    const day = date.getDay();
    const firstFriday = day <= 5 ? 6 - day : 13 - day;
    const thirdFriday = firstFriday + 14;
    
    date.setDate(thirdFriday);
    
    // Format as YYYY-MM-DD
    const expirationDate = date.toISOString().split('T')[0];
    expirations.push(expirationDate);
  }
  
  return expirations;
}

function generateMockStrikes(basePrice: number): number[] {
  const strikes: number[] = [];
  const strikePriceCount = 15;
  
  // Generate strikes at 5% intervals around the base price
  for (let i = -Math.floor(strikePriceCount / 2); i <= Math.floor(strikePriceCount / 2); i++) {
    const strike = Math.round(basePrice * (1 + i * 0.05));
    strikes.push(strike);
  }
  
  return strikes.sort((a, b) => a - b);
} 