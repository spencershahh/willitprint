import OpenAI from 'openai';

interface ProfitabilityData {
  ticker: string;
  strikePrice: number;
  expirationDate: string;
  optionType: 'call' | 'put';
  currentPrice: number;
  breakEvenPrice: number;
  probabilityOfProfit: number;
  maxRisk: number;
  maxProfit: string | number;
}

interface AIVerdict {
  memeVerdict: string;
  commentary: string;
}

// Initialize OpenAI client if API key exists
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const generateAIVerdict = async (data: ProfitabilityData): Promise<AIVerdict> => {
  try {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    
    // Format expiration date
    const formattedDate = new Date(data.expirationDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Format currency values
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    };
    
    // Create prompt for OpenAI
    const prompt = `
Write a funny and sarcastic verdict for the following options trade in r/wallstreetbets style:
- Ticker: ${data.ticker}
- Strike: ${formatCurrency(data.strikePrice)}
- Expiration: ${formattedDate}
- Type: ${data.optionType}
- Premium: ${formatCurrency(data.maxRisk / 100)} per contract
- Current Price: ${formatCurrency(data.currentPrice)}
- Probability of Profit: ${data.probabilityOfProfit}%

Respond with JSON containing two fields:
1. "memeVerdict": A short, funny title/verdict with emojis (30 chars max)
2. "commentary": A longer sarcastic take in r/wallstreetbets style (2-3 sentences, with wallstreetbets slang)
`;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a degenerate options trader from wallstreetbets who loves memes and uses terms like tendies, apes, diamond hands, wife\'s boyfriend, and Wendy\'s dumpster.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Fallback if AI response doesn't contain expected fields
    if (!result.memeVerdict || !result.commentary) {
      return generateLocalVerdict(data);
    }
    
    return {
      memeVerdict: result.memeVerdict,
      commentary: result.commentary
    };
    
  } catch (error) {
    console.error('Error generating AI verdict:', error);
    return generateLocalVerdict(data);
  }
};

// Fallback function if OpenAI call fails
const generateLocalVerdict = (data: ProfitabilityData): AIVerdict => {
  const { ticker, optionType, probabilityOfProfit } = data;
  
  let memeVerdict, commentary;
  
  if (probabilityOfProfit >= 70) {
    memeVerdict = "🚀 THIS WILL FUCKING PRINT! 💸";
    commentary = `${ticker} looks ready to make you tendies. You might actually be able to quit your job at Wendy's.`;
  } else if (probabilityOfProfit >= 50) {
    memeVerdict = "💰 DECENT CHANCE OF TENDIES";
    commentary = `Not bad, ape. This ${optionType} might actually make your wife's boyfriend respect you.`;
  } else if (probabilityOfProfit >= 30) {
    memeVerdict = "🎲 CASINO ODDS DETECTED";
    commentary = `This play is like betting on black. You've got a shot, but don't bet the rent money.`;
  } else {
    memeVerdict = "💀 YOUR MONEY IS ALREADY DEAD";
    commentary = `RIP to your premium. That money would've lasted longer if you'd just burned it for heat.`;
  }
  
  return { memeVerdict, commentary };
}; 