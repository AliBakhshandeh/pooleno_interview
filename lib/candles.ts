export interface Trade {
  price: number;
  quantity: number;
  timestamp: number;
  isBuyerMaker: boolean;
  tradeId: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeCount: number;
}

export interface CandleAggregator {
  addTrade(trade: Trade): Candle | null;
  getCurrentCandle(): Candle | null;
  getCandles(): Candle[];
  clear(): void;
}

export const intervalToMs = (interval: string): number => {
  const intervalMap: Record<string, number> = {
    "1m": 60 * 1000,
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "2h": 2 * 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "8h": 8 * 60 * 60 * 1000,
    "12h": 12 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
    "3d": 3 * 24 * 60 * 60 * 1000,
    "1w": 7 * 24 * 60 * 60 * 1000,
    "1M": 30 * 24 * 60 * 60 * 1000,
  };

  return intervalMap[interval] || 60 * 1000;
};

export const getCandleStartTime = (
  timestamp: number,
  interval: string
): number => {
  const intervalMs = intervalToMs(interval);
  return Math.floor(timestamp / intervalMs) * intervalMs;
};

const createCandle = (trade: Trade, startTime: number): Candle => ({
  time: startTime,
  open: trade.price,
  high: trade.price,
  low: trade.price,
  close: trade.price,
  volume: trade.quantity,
  tradeCount: 1,
});

const updateCandle = (candle: Candle, trade: Trade): Candle => ({
  ...candle,
  high: Math.max(candle.high, trade.price),
  low: Math.min(candle.low, trade.price),
  close: trade.price,
  volume: candle.volume + trade.quantity,
  tradeCount: candle.tradeCount + 1,
});

export class CandleAggregatorImpl implements CandleAggregator {
  private candles: Candle[] = [];
  private currentCandle: Candle | null = null;
  private interval: string;
  private intervalMs: number;

  constructor(interval: string = "1m") {
    this.interval = interval;
    this.intervalMs = intervalToMs(interval);
  }

  addTrade(trade: Trade): Candle | null {
    const candleStartTime = getCandleStartTime(trade.timestamp, this.interval);

    if (!this.currentCandle || this.currentCandle.time !== candleStartTime) {
      if (this.currentCandle) {
        this.candles.push(this.currentCandle);
      }

      this.currentCandle = createCandle(trade, candleStartTime);
      return this.currentCandle;
    } else {
      this.currentCandle = updateCandle(this.currentCandle, trade);
      return null;
    }
  }

  getCurrentCandle(): Candle | null {
    return this.currentCandle;
  }

  getCandles(): Candle[] {
    return [...this.candles];
  }

  getAllCandles(): Candle[] {
    const result = [...this.candles];
    if (this.currentCandle) {
      result.push(this.currentCandle);
    }
    return result;
  }

  clear(): void {
    this.candles = [];
    this.currentCandle = null;
  }

  getCandlesInRange(startTime: number, endTime: number): Candle[] {
    return this.getAllCandles().filter(
      (candle) => candle.time >= startTime && candle.time <= endTime
    );
  }

  getLatestCandles(count: number): Candle[] {
    const allCandles = this.getAllCandles();
    return allCandles.slice(-count);
  }
}

export const createCandleAggregator = (
  interval: string = "1m"
): CandleAggregator => {
  return new CandleAggregatorImpl(interval);
};

export const aggregateTradesToCandles = (
  trades: Trade[],
  interval: string = "1m"
): Candle[] => {
  const aggregator = createCandleAggregator(interval);

  const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);

  sortedTrades.forEach((trade) => {
    aggregator.addTrade(trade);
  });

  const allCandles = aggregator.getCandles();
  const currentCandle = aggregator.getCurrentCandle();
  if (currentCandle) {
    return [...allCandles, currentCandle];
  }
  return allCandles;
};

export const calculatePriceChange = (
  currentPrice: number,
  previousPrice: number
): number => {
  if (previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
};

export const formatPriceChange = (change: number): string => {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
};
