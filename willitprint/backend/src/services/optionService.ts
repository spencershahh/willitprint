import axios from 'axios';

interface OptionData {
  ticker: string;
  strikePrice: number;
  expirationDate: string;
  optionType: 'call' | 'put';
  premiumPaid: number;
  contracts: number;
}

interface OptionProfitability {
  ticker: string;
  strikePrice: number;
  expirationDate: string;
  optionType: 'call' | 'put';
  currentPrice: number;
  breakEvenPrice: number;
  probabilityOfProfit: number;
  maxRisk: number;
  maxProfit: string | number; // "unlimited" for calls or a number for puts
  valueRange: {
    today: number;
    nextWeek: number;
    nextMonth: number;
  };
}

export const calculateOptionProfitability = async (option: OptionData): Promise<OptionProfitability> => {
  try {
    // In a real implementation, we would fetch the current price from a finance API
    // For now, we'll use a mock implementation similar to the frontend
    
    // Mock current price as slightly below strike for calls or above for puts
    const currentPrice = option.optionType === 'call' 
      ? option.strikePrice * 0.95 // slightly below strike for calls
      : option.strikePrice * 1.05; // slightly above strike for puts
    
    // Calculate probability based on how far from strike
    const diffPercent = Math.abs((currentPrice - option.strikePrice) / option.strikePrice);
    const daysToExpiry = Math.floor((new Date(option.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    // More time + closer to strike = better probability
    let probability = 50;
    
    if (option.optionType === 'call') {
      // For calls, we want current price > strike
      if (currentPrice > option.strikePrice) {
        probability += 20; // already in the money
      } else {
        probability -= diffPercent * 100; // lower probability the further OTM
      }
    } else {
      // For puts, we want current price < strike
      if (currentPrice < option.strikePrice) {
        probability += 20; // already in the money
      } else {
        probability -= diffPercent * 100; // lower probability the further OTM
      }
    }
    
    // More time = better chance
    probability += Math.min(daysToExpiry / 30 * 5, 15); // max 15% boost from time
    
    // Clamp probability between 5 and 95
    probability = Math.min(Math.max(probability, 5), 95);
    probability = Math.round(probability);
    
    // Breakeven calculation
    const breakEvenPrice = option.optionType === 'call'
      ? option.strikePrice + option.premiumPaid
      : option.strikePrice - option.premiumPaid;
    
    // Calculate max risk (premium paid)
    const maxRisk = option.premiumPaid * 100 * option.contracts;
    
    // Calculate max profit
    const maxProfit = option.optionType === 'call' 
      ? 'unlimited' 
      : (option.strikePrice * 100 * option.contracts) - maxRisk;
    
    // Value range projections
    const valueRange = {
      today: option.premiumPaid * 100 * option.contracts,
      nextWeek: probability > 50 
        ? (option.premiumPaid * 100 * option.contracts) * (1 + (probability - 50) / 100)
        : (option.premiumPaid * 100 * option.contracts) * (1 - (50 - probability) / 100),
      nextMonth: probability > 50 
        ? (option.premiumPaid * 100 * option.contracts) * (1 + (probability - 40) / 50)
        : (option.premiumPaid * 100 * option.contracts) * (1 - (60 - probability) / 50),
    };
    
    return {
      ticker: option.ticker.toUpperCase(),
      strikePrice: option.strikePrice,
      expirationDate: option.expirationDate,
      optionType: option.optionType,
      currentPrice,
      breakEvenPrice,
      probabilityOfProfit: probability,
      maxRisk,
      maxProfit,
      valueRange,
    };
    
  } catch (error) {
    console.error('Error in calculateOptionProfitability:', error);
    throw new Error('Failed to calculate option profitability');
  }
}; 