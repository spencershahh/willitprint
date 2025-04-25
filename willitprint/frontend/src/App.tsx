import { useState, Component, ErrorInfo, ReactNode } from 'react'
import Layout from './components/Layout'
import OptionForm from './components/OptionForm'
import ResultsDisplay from './components/ResultsDisplay'

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="glass-card p-8 mb-10 depth-effect">
          <h3 className="text-xl font-bold mb-4 text-red-400">Something went wrong</h3>
          <p className="text-gray-300 mb-4">
            There was an error calculating your options data. Please try again with different inputs.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-primary px-4 py-2 rounded-md"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    memeVerdict = "💀 PROBABLY NOT PRINTING"
    commentary = `This call is looking like a trip behind the Wendy's dumpster.`
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

  const handleErrorBoundaryError = (error: Error) => {
    console.error("Error boundary caught an error:", error);
    // Could add analytics or logging here
  }

  return (
    <Layout>
      <div className="py-8 md:py-12 min-h-screen">
        {!result ? (
          <>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="diamond-accent mb-4">
                <h1 className="text-5xl md:text-6xl font-bold mb-6">
                  <span className="gradient-text-large">WillItPrint.ai</span>
                </h1>
              </div>
              <p className="text-gray-200 text-xl mb-10">
                Your Degenerate Options Whisperer
              </p>
              
              <div className="glass-card p-8 mb-10 depth-effect transform transition-all duration-300 hover:scale-[1.01]">
                <div className="grid grid-cols-3 gap-4 md:gap-8">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-400 mb-2">200,000+</div>
                    <div className="text-gray-400 text-xs sm:text-sm">Trades Analyzed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-400 mb-2">$400M+</div>
                    <div className="text-gray-400 text-xs sm:text-sm">Portfolio Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-400 mb-2">45%</div>
                    <div className="text-gray-400 text-xs sm:text-sm">Win Rate</div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-300 text-lg max-w-2xl mx-auto animate-fade-in mb-6">
                Enter your YOLO contract below. Our AI will analyze whether your options play will print tendies or leave you behind the Wendy's dumpster.
              </p>
            </div>
            <OptionForm onSubmit={handleSubmit} isLoading={isLoading} />
          </>
        ) : (
          <ErrorBoundary 
            onError={handleErrorBoundaryError}
            fallback={
              <div className="max-w-4xl mx-auto px-4">
                <div className="glass-card p-8 mb-10 depth-effect">
                  <h3 className="text-xl font-bold mb-4 text-red-400">Calculation Error</h3>
                  <p className="text-gray-300 mb-4">
                    There was an error calculating your options data. This might be due to invalid inputs or date values.
                  </p>
                  <button 
                    onClick={handleReset}
                    className="btn btn-secondary py-2.5 px-5 rounded-full transition-all text-sm flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Try Again
                  </button>
                </div>
              </div>
            }
          >
            <ResultsDisplay result={result} onReset={handleReset} />
          </ErrorBoundary>
        )}
      </div>
    </Layout>
  )
}

export default App
