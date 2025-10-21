import { describe, it, expect } from "@jest/globals";
import {
  orderBookReducer,
  OrderBookState,
  OrderBookSnapshot,
  OrderBookUpdate,
} from "../lib/orderbook";

describe("OrderBook Reducer", () => {
  const initialState: OrderBookState = {
    bids: [],
    asks: [],
    lastUpdateId: 0,
    spread: 0,
    midPrice: 0,
    vwap: 0,
  };

  it("should handle initial snapshot", () => {
    const snapshot: OrderBookSnapshot = {
      bids: [
        ["50000", "1.5"],
        ["49999", "2.0"],
        ["49998", "0.5"],
      ],
      asks: [
        ["50001", "1.0"],
        ["50002", "1.5"],
        ["50003", "2.0"],
      ],
      lastUpdateId: 12345,
    };

    const result = orderBookReducer(initialState, {
      type: "SNAPSHOT",
      payload: snapshot,
    });

    expect(result.bids).toHaveLength(3);
    expect(result.asks).toHaveLength(3);
    expect(result.lastUpdateId).toBe(12345);
    expect(result.spread).toBe(1);
    expect(result.midPrice).toBe(50000.5);
  });

  it("should handle updates with sequence validation", () => {
    const snapshot: OrderBookSnapshot = {
      bids: [["50000", "1.0"]],
      asks: [["50001", "1.0"]],
      lastUpdateId: 100,
    };

    const stateWithSnapshot = orderBookReducer(initialState, {
      type: "SNAPSHOT",
      payload: snapshot,
    });

    const update: OrderBookUpdate = {
      bids: [["50000", "2.0"]],
      asks: [["50001", "1.5"]],
      lastUpdateId: 101,
      firstUpdateId: 101,
    };

    const result = orderBookReducer(stateWithSnapshot, {
      type: "UPDATE",
      payload: update,
    });

    expect(result.lastUpdateId).toBe(101);
    expect(result.bids[0].size).toBe(2.0);
    expect(result.asks[0].size).toBe(1.5);
  });

  it("should reject updates with sequence mismatch", () => {
    const stateWithSnapshot: OrderBookState = {
      bids: [{ price: 50000, size: 1.0 }],
      asks: [{ price: 50001, size: 1.0 }],
      lastUpdateId: 100,
      spread: 1,
      midPrice: 50000.5,
      vwap: 50000.5,
    };

    const invalidUpdate: OrderBookUpdate = {
      bids: [["50000", "2.0"]],
      asks: [["50001", "1.5"]],
      lastUpdateId: 103,
      firstUpdateId: 103,
    };

    const result = orderBookReducer(stateWithSnapshot, {
      type: "UPDATE",
      payload: invalidUpdate,
    });

    expect(result.lastUpdateId).toBe(100);
    expect(result.bids[0].size).toBe(1.0);
  });

  it("should remove levels with zero size", () => {
    const stateWithSnapshot: OrderBookState = {
      bids: [
        { price: 50000, size: 1.0 },
        { price: 49999, size: 2.0 },
      ],
      asks: [
        { price: 50001, size: 1.0 },
        { price: 50002, size: 1.5 },
      ],
      lastUpdateId: 100,
      spread: 1,
      midPrice: 50000.5,
      vwap: 50000.5,
    };

    const update: OrderBookUpdate = {
      bids: [["49999", "0"]],
      asks: [],
      lastUpdateId: 101,
      firstUpdateId: 101,
    };

    const result = orderBookReducer(stateWithSnapshot, {
      type: "UPDATE",
      payload: update,
    });

    expect(result.bids).toHaveLength(1);
    expect(result.bids[0].price).toBe(50000);
  });

  it("should sort bids in descending order and asks in ascending order", () => {
    const snapshot: OrderBookSnapshot = {
      bids: [
        ["49999", "1.0"],
        ["50000", "2.0"],
        ["49998", "0.5"],
      ],
      asks: [
        ["50002", "1.0"],
        ["50001", "2.0"],
        ["50003", "0.5"],
      ],
      lastUpdateId: 100,
    };

    const result = orderBookReducer(initialState, {
      type: "SNAPSHOT",
      payload: snapshot,
    });

    expect(result.bids[0].price).toBe(50000);
    expect(result.bids[1].price).toBe(49999);
    expect(result.bids[2].price).toBe(49998);

    expect(result.asks[0].price).toBe(50001);
    expect(result.asks[1].price).toBe(50002);
    expect(result.asks[2].price).toBe(50003);
  });

  it("should calculate VWAP correctly", () => {
    const snapshot: OrderBookSnapshot = {
      bids: [
        ["50000", "1.0"],
        ["49999", "2.0"],
        ["49998", "1.0"],
      ],
      asks: [
        ["50001", "1.0"],
        ["50002", "2.0"],
        ["50003", "1.0"],
      ],
      lastUpdateId: 100,
    };

    const result = orderBookReducer(initialState, {
      type: "SNAPSHOT",
      payload: snapshot,
    });

    expect(result.vwap).toBeGreaterThan(0);
    expect(result.vwap).toBeLessThanOrEqual(50003);
    expect(result.vwap).toBeGreaterThanOrEqual(49998);
  });
});
