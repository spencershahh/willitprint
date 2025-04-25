import { useState } from 'react'
import Layout from './components/Layout'
import OptionForm from './components/OptionForm'
import ResultsDisplay from './components/ResultsDisplay'

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Call the backend API
const analyzeOption = async (formData: any) => {
  try {
    const response = await fetch(`${API_URL}/analyze-option`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      throw new Error('API request failed')
    }

    return await response.json()
  } catch (error) {
    console.error('Error calling API:', error)
    
    // Fall back to client-side calculation if API fails
    return clientSideAnalysis(formData)
  }
}

// Fallback client-side calculation (same as our mock in the backend)
const clientSideAnalysis = (formData: any) => {
  // Mock current price as slightly below strike for calls or above for puts
  const currentPrice = formData.optionType === 'call' 
    ? formData.strikePrice * 0.95 // slightly below strike for calls
    : formData.strikePrice * 1.05 // slightly above strike for puts
  
  // Calculate probability based on how far from strike
  const diffPercent = Math.abs((currentPrice - formData.strikePrice) / formData.strikePrice)
  const daysToExpiry = Math.floor((new Date(formData.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  
  // More time + closer to strike = better probability
  let probability = 50
  
  if (formData.optionType === 'call') {
    // For calls, we want current price > strike
    if (currentPrice > formData.strikePrice) {
      probability += 20 // already in the money
    } else {
      probability -= diffPercent * 100 // lower probability the further OTM
    }
  } else {
    // For puts, we want current price < strike
    if (currentPrice < formData.strikePrice) {
      probability += 20 // already in the money
    } else {
      probability -= diffPercent * 100 // lower probability the further OTM
    }
  }
  
  // More time = better chance
  probability += Math.min(daysToExpiry / 30 * 5, 15) // max 15% boost from time
  
  // Clamp probability between 5 and 95
  probability = Math.min(Math.max(probability, 5), 95)
  probability = Math.round(probability)
  
  // Breakeven calculation
  const breakEvenPrice = formData.optionType === 'call'
    ? formData.strikePrice + formData.premiumPaid
    : formData.strikePrice - formData.premiumPaid
  
  // Calculate max risk
  const maxRisk = formData.premiumPaid * 100 * formData.contracts
  
  // Fun AI verdict and commentary based on probability
  let memeVerdict, commentary
  
  if (probability >= 70) {
    memeVerdict = "🚀 THIS WILL FUCKING PRINT! 💸"
    commentary = `${formData.ticker} looks ready to make you tendies. You might actually be able to quit your job at Wendy's.`
  } else if (probability >= 50) {
    memeVerdict = "💰 DECENT CHANCE OF TENDIES"
    commentary = `Not bad, ape. This ${formData.optionType} might actually make your wife's boyfriend respect you.`
  } else if (probability >= 30) {
    memeVerdict = "🎲 CASINO ODDS DETECTED"
    commentary = `This play is like betting on black. You've got a shot, but don't bet the rent money.`
  } else {
    memeVerdict = "💀 YOUR MONEY IS ALREADY DEAD"
    commentary = `RIP to your premium. That money would've lasted longer if you'd just burned it for heat.`
  }
  
  return {
    ticker: formData.ticker.toUpperCase(),
    strikePrice: formData.strikePrice,
    expirationDate: formData.expirationDate,
    optionType: formData.optionType,
    currentPrice,
    breakEvenPrice,
    probabilityOfProfit: probability,
    maxRisk,
    maxProfit: formData.optionType === 'call' ? 'unlimited' : (formData.strikePrice * 100 * formData.contracts) - maxRisk,
    valueRange: {
      today: formData.premiumPaid * 100 * formData.contracts,
      nextWeek: probability > 50 
        ? (formData.premiumPaid * 100 * formData.contracts) * (1 + (probability - 50) / 100)
        : (formData.premiumPaid * 100 * formData.contracts) * (1 - (50 - probability) / 100),
      nextMonth: probability > 50 
        ? (formData.premiumPaid * 100 * formData.contracts) * (1 + (probability - 40) / 50)
        : (formData.premiumPaid * 100 * formData.contracts) * (1 - (60 - probability) / 50),
    },
    aiVerdict: {
      memeVerdict,
      commentary
    }
  }
}

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (formData: any) => {
    setIsLoading(true)
    try {
      const result = await analyzeOption(formData)
      setResult(result)
    } catch (error) {
      console.error("Error analyzing option:", error)
      // Handle error state
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
  }

  return (
    <Layout>
      <div className="py-6">
        {!result ? (
          <>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h1 className="text-4xl font-bold mb-4 text-green-500">WillItPrint.ai 💎</h1>
              <p className="text-gray-300 text-lg">
                Your Degenerate Options Whisperer
              </p>
              <p className="text-gray-400 mt-4">
                Enter your YOLO contract. We'll tell you if you're printing tendies or headed straight to Valhalla.
              </p>
            </div>
            <OptionForm onSubmit={handleSubmit} isLoading={isLoading} />
          </>
        ) : (
          <ResultsDisplay result={result} onReset={handleReset} />
        )}
      </div>
    </Layout>
  )
}

export default App
