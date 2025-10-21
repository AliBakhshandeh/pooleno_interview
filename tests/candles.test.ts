import { describe, it, expect } from "@jest/globals";
import {
  createCandleAggregator,
  aggregateTradesToCandles,
  intervalToMs,
  getCandleStartTime,
  calculatePriceChange,
  formatPriceChange,
  type Trade,
} from "../lib/candles";

describe("Candle Aggregator", () => {
  const mockTrades: Trade[] = [
    {
      price: 50000,
      quantity: 0.1,
      timestamp: 1640995200000,
      isBuyerMaker: false,
      tradeId: 1,
    },
    {
      price: 50050,
      quantity: 0.2,
      timestamp: 1640995205000,
      isBuyerMaker: true,
      tradeId: 2,
    },
    {
      price: 49950,
      quantity: 0.15,
      timestamp: 1640995210000,
      isBuyerMaker: false,
      tradeId: 3,
    },
    {
      price: 50100,
      quantity: 0.3,
      timestamp: 1640995260000,
      isBuyerMaker: true,
      tradeId: 4,
    },
  ];

  it("should create candles from trades", () => {
    const aggregator = createCandleAggregator("1m");

    const candle1 = aggregator.addTrade(mockTrades[0]);
    expect(candle1).toBeTruthy();
    expect(candle1?.time).toBe(1640995200000);
    expect(candle1?.open).toBe(50000);
    expect(candle1?.high).toBe(50000);
    expect(candle1?.low).toBe(50000);
    expect(candle1?.close).toBe(50000);

    const candle2 = aggregator.addTrade(mockTrades[1]);
    expect(candle2).toBeNull();

    const candle3 = aggregator.addTrade(mockTrades[2]);
    expect(candle3).toBeNull();

    const candle4 = aggregator.addTrade(mockTrades[3]);
    expect(candle4).toBeTruthy();
    expect(candle4?.time).toBe(1640995260000);
    expect(candle4?.open).toBe(50100);
    expect(candle4?.high).toBe(50100);
    expect(candle4?.low).toBe(50100);
    expect(candle4?.close).toBe(50100);
  });

  it("should correctly calculate OHLC values", () => {
    const aggregator = createCandleAggregator("1m");

    aggregator.addTrade(mockTrades[0]);
    aggregator.addTrade(mockTrades[1]);
    aggregator.addTrade(mockTrades[2]);

    const currentCandle = aggregator.getCurrentCandle();
    expect(currentCandle).toBeTruthy();
    expect(currentCandle?.open).toBe(50000);
    expect(currentCandle?.high).toBe(50050);
    expect(currentCandle?.low).toBe(49950);
    expect(currentCandle?.close).toBe(49950);
    expect(currentCandle?.volume).toBeCloseTo(0.45, 5);
    expect(currentCandle?.tradeCount).toBe(3);
  });

  it("should handle different intervals", () => {
    const trades5m: Trade[] = [
      {
        price: 50000,
        quantity: 0.1,
        timestamp: 1640995200000,
        isBuyerMaker: false,
        tradeId: 1,
      },
      {
        price: 50100,
        quantity: 0.2,
        timestamp: 1640995205000,
        isBuyerMaker: true,
        tradeId: 2,
      },
      {
        price: 50200,
        quantity: 0.3,
        timestamp: 1640995800000,
        isBuyerMaker: false,
        tradeId: 3,
      },
    ];

    const aggregator = createCandleAggregator("5m");

    const candle1 = aggregator.addTrade(trades5m[0]);
    expect(candle1).toBeTruthy();

    const candle2 = aggregator.addTrade(trades5m[1]);
    expect(candle2).toBeNull();

    const candle3 = aggregator.addTrade(trades5m[2]);
    expect(candle3).toBeTruthy();
  });

  it("should aggregate trades to candles correctly", () => {
    const candles = aggregateTradesToCandles(mockTrades, "1m");

    expect(candles).toHaveLength(2);

    expect(candles[0].time).toBe(1640995200000);
    expect(candles[0].open).toBe(50000);
    expect(candles[0].high).toBe(50050);
    expect(candles[0].low).toBe(49950);
    expect(candles[0].close).toBe(49950);
    expect(candles[0].volume).toBeCloseTo(0.45, 5);
    expect(candles[0].tradeCount).toBe(3);

    expect(candles[1].time).toBe(1640995260000);
    expect(candles[1].open).toBe(50100);
    expect(candles[1].high).toBe(50100);
    expect(candles[1].low).toBe(50100);
    expect(candles[1].close).toBe(50100);
    expect(candles[1].volume).toBe(0.3);
    expect(candles[1].tradeCount).toBe(1);
  });

  it("should handle interval conversion correctly", () => {
    expect(intervalToMs("1m")).toBe(60000);
    expect(intervalToMs("5m")).toBe(300000);
    expect(intervalToMs("1h")).toBe(3600000);
    expect(intervalToMs("1d")).toBe(86400000);
  });

  it("should calculate candle start time correctly", () => {
    const timestamp = 1640995230000;

    expect(getCandleStartTime(timestamp, "1m")).toBe(1640995200000);
    expect(getCandleStartTime(timestamp, "5m")).toBe(1640995200000);
    expect(getCandleStartTime(timestamp, "1h")).toBe(1640995200000);
  });

  it("should calculate price change correctly", () => {
    expect(calculatePriceChange(51000, 50000)).toBe(2);
    expect(calculatePriceChange(49000, 50000)).toBe(-2);
    expect(calculatePriceChange(50000, 50000)).toBe(0);
    expect(calculatePriceChange(50000, 0)).toBe(0);
  });

  it("should format price change correctly", () => {
    expect(formatPriceChange(2.5)).toBe("+2.50%");
    expect(formatPriceChange(-1.8)).toBe("-1.80%");
    expect(formatPriceChange(0)).toBe("+0.00%");
  });
});
