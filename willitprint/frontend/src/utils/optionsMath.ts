// Black-Scholes Options Pricing Model

// Cumulative normal distribution function
export const cumulativeNormalDistribution = (x: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  
  return 0.5 * (1.0 + sign * y);
};

// Calculate option price using Black-Scholes model
export const blackScholes = (
  stockPrice: number,
  strikePrice: number,
  timeToExpiryYears: number,
  riskFreeRate: number,
  volatility: number,
  isCall: boolean
): number => {
  // Special case for expired options or negative time
  if (timeToExpiryYears <= 0) {
    if (isCall) {
      return Math.max(0, stockPrice - strikePrice);
    } else {
      return Math.max(0, strikePrice - stockPrice);
    }
  }

  const d1 = (Math.log(stockPrice / strikePrice) + 
    (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiryYears) / 
    (volatility * Math.sqrt(timeToExpiryYears));
  
  const d2 = d1 - volatility * Math.sqrt(timeToExpiryYears);

  if (isCall) {
    return stockPrice * cumulativeNormalDistribution(d1) - 
      strikePrice * Math.exp(-riskFreeRate * timeToExpiryYears) * cumulativeNormalDistribution(d2);
  } else {
    return strikePrice * Math.exp(-riskFreeRate * timeToExpiryYears) * cumulativeNormalDistribution(-d2) - 
      stockPrice * cumulativeNormalDistribution(-d1);
  }
};

// Calculate Greeks
export const calculateGreeks = (
  stockPrice: number,
  strikePrice: number,
  timeToExpiryYears: number,
  riskFreeRate: number,
  volatility: number,
  isCall: boolean
): {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
} => {
  const d1 = (Math.log(stockPrice / strikePrice) + 
    (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiryYears) / 
    (volatility * Math.sqrt(timeToExpiryYears));
  
  const d2 = d1 - volatility * Math.sqrt(timeToExpiryYears);
  
  // Normal probability density function
  const pdf = (x: number): number => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  
  // Delta
  const delta = isCall 
    ? cumulativeNormalDistribution(d1) 
    : cumulativeNormalDistribution(d1) - 1;
  
  // Gamma (same for calls and puts)
  const gamma = pdf(d1) / (stockPrice * volatility * Math.sqrt(timeToExpiryYears));
  
  // Theta (per day)
  const theta = isCall 
    ? -stockPrice * pdf(d1) * volatility / (2 * Math.sqrt(timeToExpiryYears)) 
      - riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiryYears) * cumulativeNormalDistribution(d2)
    : -stockPrice * pdf(d1) * volatility / (2 * Math.sqrt(timeToExpiryYears)) 
      + riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiryYears) * cumulativeNormalDistribution(-d2);
  
  // Convert theta to daily
  const thetaDaily = theta / 365;
  
  // Vega (for 1% change in volatility)
  const vega = stockPrice * Math.sqrt(timeToExpiryYears) * pdf(d1) * 0.01;
  
  // Rho (for 1% change in interest rate)
  const rho = isCall
    ? strikePrice * timeToExpiryYears * Math.exp(-riskFreeRate * timeToExpiryYears) * cumulativeNormalDistribution(d2) * 0.01
    : -strikePrice * timeToExpiryYears * Math.exp(-riskFreeRate * timeToExpiryYears) * cumulativeNormalDistribution(-d2) * 0.01;
  
  return {
    delta,
    gamma,
    theta: thetaDaily,
    vega,
    rho
  };
};

// Calculate option price at different stock prices and days to expiry
export const calculateOptionPriceMatrix = (
  currentStockPrice: number,
  strikePrice: number,
  daysToExpiry: number,
  riskFreeRate: number,
  volatility: number,
  isCall: boolean,
  optionPrice: number
): {
  priceMatrix: number[][];
  stockPrices: number[];
  dates: Date[];
} => {
  // Safety check for inputs
  if (isNaN(currentStockPrice) || isNaN(strikePrice) || isNaN(daysToExpiry) || 
      isNaN(riskFreeRate) || isNaN(volatility) || isNaN(optionPrice)) {
    console.error('Invalid inputs to calculateOptionPriceMatrix:', {
      currentStockPrice, strikePrice, daysToExpiry, riskFreeRate, volatility, optionPrice
    });
    
    // Return minimal valid data
    return {
      priceMatrix: [[0]],
      stockPrices: [currentStockPrice || 100],
      dates: [new Date()]
    };
  }

  // Use safe values in case of invalid inputs
  const safeDaysToExpiry = Math.max(0, daysToExpiry || 30);
  
  // Generate array of stock prices (±40% from current price)
  const priceDelta = currentStockPrice * 0.4;
  const minPrice = Math.max(currentStockPrice - priceDelta, 1); // Prevent negative prices
  const maxPrice = currentStockPrice + priceDelta;
  const priceStep = (maxPrice - minPrice) / 20;
  
  const stockPrices: number[] = [];
  for (let price = minPrice; price <= maxPrice; price += priceStep) {
    stockPrices.push(price);
  }
  
  // Generate array of dates from today to expiry
  const now = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(now.getDate() + safeDaysToExpiry);
  
  const dateCount = Math.min(10, safeDaysToExpiry);
  const dateStep = safeDaysToExpiry / (dateCount || 1); // Avoid division by zero
  
  const dates: Date[] = [];
  for (let i = 0; i <= dateCount; i++) {
    const date = new Date();
    date.setDate(now.getDate() + Math.round(i * dateStep));
    dates.push(date);
  }
  
  // Calculate option price for each date and stock price
  const priceMatrix: number[][] = [];
  
  for (let i = 0; i < dates.length; i++) {
    const daysRemaining = Math.max(0, Math.floor((expiryDate.getTime() - dates[i].getTime()) / (1000 * 60 * 60 * 24)));
    const timeToExpiryYears = daysRemaining / 365;
    
    const row: number[] = [];
    
    for (let j = 0; j < stockPrices.length; j++) {
      // If we're at expiry, calculate intrinsic value only
      if (daysRemaining === 0) {
        if (isCall) {
          row.push(Math.max(0, stockPrices[j] - strikePrice));
        } else {
          row.push(Math.max(0, strikePrice - stockPrices[j]));
        }
      } else {
        // Otherwise use Black-Scholes
        try {
          const price = blackScholes(
            stockPrices[j],
            strikePrice, 
            timeToExpiryYears,
            riskFreeRate,
            volatility,
            isCall
          );
          row.push(isNaN(price) ? 0 : price);
        } catch (error) {
          console.error('Error calculating option price:', error);
          row.push(0);
        }
      }
    }
    
    priceMatrix.push(row);
  }
  
  return {
    priceMatrix,
    stockPrices,
    dates
  };
};

// Calculate profit/loss matrix for an option position
export const calculateProfitLossMatrix = (
  currentStockPrice: number,
  strikePrice: number,
  daysToExpiry: number,
  riskFreeRate: number,
  volatility: number,
  isCall: boolean,
  optionPrice: number,
  contractCount: number
): {
  profitMatrix: number[][];
  stockPrices: number[];
  dates: Date[];
} => {
  const { priceMatrix, stockPrices, dates } = calculateOptionPriceMatrix(
    currentStockPrice,
    strikePrice,
    daysToExpiry,
    riskFreeRate,
    volatility,
    isCall,
    optionPrice
  );
  
  const initialInvestment = optionPrice * 100 * contractCount;
  const profitMatrix: number[][] = [];
  
  for (let i = 0; i < priceMatrix.length; i++) {
    const row: number[] = [];
    
    for (let j = 0; j < priceMatrix[i].length; j++) {
      const futureValue = priceMatrix[i][j] * 100 * contractCount;
      row.push(futureValue - initialInvestment);
    }
    
    profitMatrix.push(row);
  }
  
  return {
    profitMatrix,
    stockPrices,
    dates
  };
};

// Calculate breakeven price
export const calculateBreakEven = (
  strikePrice: number,
  optionPrice: number,
  isCall: boolean
): number => {
  if (isCall) {
    return strikePrice + optionPrice;
  } else {
    return strikePrice - optionPrice;
  }
};

// Calculate probability of profit using delta approximation
export const calculateProbabilityOfProfit = (
  currentStockPrice: number,
  strikePrice: number,
  daysToExpiry: number,
  volatility: number,
  isCall: boolean
): number => {
  const timeToExpiryYears = daysToExpiry / 365;
  const riskFreeRate = 0.05; // 5% risk-free rate assumption
  
  // Calculate d2 from Black-Scholes
  const d1 = (Math.log(currentStockPrice / strikePrice) + 
    (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiryYears) / 
    (volatility * Math.sqrt(timeToExpiryYears));
  
  const d2 = d1 - volatility * Math.sqrt(timeToExpiryYears);
  
  // Probability approximation
  if (isCall) {
    return 100 * (1 - cumulativeNormalDistribution(d2));
  } else {
    return 100 * cumulativeNormalDistribution(-d2);
  }
};

// Calculate maximum profit for an option
export const calculateMaxProfit = (
  strikePrice: number,
  optionPrice: number,
  contractCount: number,
  isCall: boolean
): number | 'unlimited' => {
  if (isCall) {
    return 'unlimited';
  } else {
    // For puts, max profit is when stock goes to zero
    return (strikePrice * 100 * contractCount) - (optionPrice * 100 * contractCount);
  }
};

// Calculate maximum loss for an option
export const calculateMaxLoss = (
  optionPrice: number,
  contractCount: number
): number => {
  return optionPrice * 100 * contractCount;
}; 