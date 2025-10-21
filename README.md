# Pooleno Frontend Challenge - Live Trading Micro-App

A real-time BTC/USDT trading micro-app built with Next.js, TypeScript, and Tailwind CSS. Features live price charts, order book, and order ticket with risk management.

## 🚀 Features

### Live Price Chart

- Real-time candlestick chart using TradingView Lightweight Charts
- Client-side aggregation of trades into 1-minute OHLC candles
- Live price display with connection status and latency indicators
- Last 60 minutes of data with smooth updates

### Level-2 Order Book

- Real-time order book with deterministic merging
- REST API snapshot + WebSocket diff updates
- Top 20 bids and asks with cumulative sizes
- Spread, mid-price, and VWAP calculations
- Visual connection status and latency monitoring

### Order Ticket

- Buy/Sell order placement with quantity input
- Client-side risk checks and balance validation
- Simulated balance tracking (USD: $10,000, BTC: 0.25)
- PnL estimation for ±0.5% price movements
- Real-time validation with error/warning messages

### UX and Resilience

- Auto-reconnect WebSockets with exponential backoff
- Visual connection status indicators
- Latency monitoring (WebSocket message to UI paint delay)
- Keyboard accessible forms
- Responsive desktop-first layout

## 🛠️ Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **TradingView Lightweight Charts** - Professional charting
- **React Query** - Server state management
- **Sonner** - Toast notifications
- **Jest** - Unit testing

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🏗️ Architecture

### Core Libraries (`/lib`)

- **`orderbook.ts`** - Deterministic order book reducer with sequence validation
- **`candles.ts`** - Trade-to-OHLC candle aggregator
- **`risk.ts`** - Risk checks, PnL calculations, and balance management

### Services (`/services`)

- **`useLiveTrade.tsx`** - WebSocket hook for live trade data and candle aggregation
- **`useOrderBook.tsx`** - WebSocket hook for order book with auto-reconnect
- **`historicalCandles.tsx`** - REST API hook for historical data

### Components (`/components`)

- **`LightweightChart.tsx`** - TradingView chart wrapper
- **`VirtualizedOrderTable.tsx`** - High-performance order book display
- **`ConnectionStatus.tsx`** - Connection status and latency indicator
- **`OrderTicket`** - Order placement with risk validation

## 🔧 Data Sources

Uses Binance public APIs:

- **Trades WebSocket**: `wss://stream.binance.com:9443/ws/btcusdt@trade`
- **Order Book WebSocket**: `wss://stream.binance.com:9443/ws/btcusdt@depth@100ms`
- **Historical Data**: `https://api.binance.com/api/v3/klines`

## 🧪 Testing

Comprehensive unit tests for core functionality:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage

- **Order Book Reducer** - Sequence validation, merging, pruning
- **Candle Aggregator** - Trade-to-OHLC conversion, interval handling
- **Risk Management** - Balance validation, PnL calculations, portfolio metrics

## 🎯 Key Features Implementation

### Deterministic Order Book Merging

- REST snapshot → cache last updateId → apply diffs only when sequences align
- Prune levels at size=0, keep sorted bids/asks
- Compute spread, mid-price, and VWAP in real-time

### Candle Aggregation

- Client-side trade aggregation into 1-minute OHLC candles
- Proper time alignment and volume calculations
- Support for multiple intervals (1m, 5m, 1h, etc.)

### Risk Management

- Balance validation (USD/BTC limits)
- Position size limits and leverage checks
- PnL estimation for price movements
- Portfolio value and allocation calculations

### WebSocket Resilience

- Auto-reconnect with exponential backoff
- Connection status monitoring
- Latency measurement and display
- Message queuing and error handling

## 🚀 Performance Optimizations

- **Virtualized Order Book** - Handles large datasets efficiently
- **Memoized Components** - Prevents unnecessary re-renders
- **Debounced Updates** - Reduces UI update frequency
- **Message Queuing** - Batches WebSocket updates
- **Lazy Loading** - Components loaded on demand

## 📱 Responsive Design

- Desktop-first layout optimized for trading interfaces
- Mobile-friendly responsive breakpoints
- Touch-friendly order ticket controls
- Keyboard navigation support

## 🔒 Security Features

- Input validation and sanitization
- XSS protection headers
- Content Security Policy
- No sensitive data in client-side code

## 🎨 UI/UX Features

- Dark theme optimized for trading
- Real-time visual feedback
- Color-coded order book (green bids, red asks)
- Connection status indicators
- Toast notifications for user actions
- Loading states and error handling

## 📊 Real-time Metrics

- Live price updates
- Spread and mid-price calculations
- VWAP (Volume Weighted Average Price)
- Portfolio value tracking

## 🧩 Modular Architecture

- Separated concerns with clear boundaries
- Reusable components and hooks
- Type-safe interfaces
- Comprehensive error handling
- Easy to extend and maintain

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)
5. View live BTC/USDT trading data

## 📝 License

This project is part of the Pooleno Frontend Challenge and is for demonstration purposes.
