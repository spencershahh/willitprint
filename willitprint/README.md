# 💎 WillItPrint.ai 💥

> "Your degenerate options whisperer."  
> Enter your YOLO contract. We'll tell you if you're printing tendies or headed straight to Valhalla.

## 🧠 What Is This?

WillItPrint.ai is a meme-powered webapp inspired by r/wallstreetbets where users input their options contracts (like $GOOGL 155C expiring May 9), and the app calculates whether that play has a high probability of making money.

We visualize:
- Risk/reward
- Breakeven price
- Live value range of the contract
- Degenerate-friendly commentary on whether it'll "print" 💸 or flop 💀

## 📊 Features

- Input your YOLO options play
- Get instant probability analysis
- View profit/loss projections
- Receive WSB-style commentary on your trade
- No financial advice, just memes and math

## 🚀 Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Express.js with TypeScript
- **AI**: OpenAI API for the degenerative commentary

## 🏁 Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Install dependencies for the project:
   ```
   npm install
   npm run install:frontend
   npm run install:backend
   ```

2. Set up environment variables:
   - Frontend: `.env.local` is already set up with `VITE_API_URL=http://localhost:3001/api`
   - Backend: Copy `.env.example` to `.env` and add your OpenAI API key if you want AI-generated commentary
     ```
     cp willitprint/backend/.env.example willitprint/backend/.env
     ```
     Then edit the `.env` file to add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```

### Running the App

1. Start both frontend and backend in development mode:
   ```
   npm run dev
   ```

   This will start:
   - Frontend at http://localhost:5173
   - Backend at http://localhost:3001

2. Alternatively, you can start them separately:
   ```
   # Frontend only
   npm run dev:frontend
   
   # Backend only
   npm run dev:backend
   ```

### Building for Production

1. Build both frontend and backend:
   ```
   npm run build
   ```

2. Start the production build:
   ```
   npm start
   ```

## 🧠 How It Works

1. Enter your options contract details (ticker, strike price, expiration, etc.)
2. Our backend calculates the probability of profit using options pricing algorithms
3. We generate a meme-worthy verdict on whether your play will "print"
4. You get WSB-style commentary that's both funny and informative

## 📱 Demo

![WillItPrint Demo](https://placeholder-for-demo-image.jpg)

## 📢 Disclaimer

This is not financial advice. This is for apes, by apes. Consult a real financial advisor if you're betting your house on YOLO calls. 