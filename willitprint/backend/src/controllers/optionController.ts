import { Request, Response } from 'express';
import { calculateOptionProfitability } from '../services/optionService';
import { generateAIVerdict } from '../services/aiService';

export const analyzeOption = async (req: Request, res: Response) => {
  try {
    const { ticker, strikePrice, expirationDate, optionType, premiumPaid, contracts } = req.body;
    
    // Validate input
    if (!ticker || !strikePrice || !expirationDate || !optionType || !premiumPaid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Calculate option profitability
    const profitabilityData = await calculateOptionProfitability({
      ticker,
      strikePrice,
      expirationDate,
      optionType,
      premiumPaid,
      contracts: contracts || 1
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
    
    // Return combined data
    res.status(200).json({
      ...profitabilityData,
      aiVerdict
    });
    
  } catch (error) {
    console.error('Error analyzing option:', error);
    res.status(500).json({ error: 'Failed to analyze option' });
  }
}; 