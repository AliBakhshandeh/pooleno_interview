"use client";

import { Candle, createCandleAggregator, Trade } from "@/lib/candles";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHistoricalCandles } from "../api/historicalCandles";

type IntervalUnit = (readonly [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M"
])[number];

export type { Candle, Trade };

interface UseLiveCandlesParams {
  symbol: string;
  interval?: IntervalUnit;
  limit?: number;
}

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useLiveCandles = ({
  symbol,
  interval = "1m",
  limit = 20,
}: UseLiveCandlesParams) => {
  const { data: historicalCandles } = useHistoricalCandles(
    symbol,
    limit,
    interval
  );
  const [candles, setCandles] = useState<Candle[]>([]);
  const [livePrice, setLivePrice] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const [latency, setLatency] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<Trade[]>([]);
  const isConnectedRef = useRef(false);
  const candleAggregatorRef = useRef(createCandleAggregator(interval));

  const debouncedLivePrice = useDebounce(livePrice, 100);

  const updateCandles = useCallback(
    (trade: Trade) => {
      const newCandle = candleAggregatorRef.current.addTrade(trade);
      if (newCandle) {
        setCandles((prev) => {
          const filtered = prev.filter(
            (candle) => candle.time !== newCandle.time
          );
          const updated = [...filtered, newCandle];
          return updated.slice(-limit);
        });
      } else {
        const currentCandle = candleAggregatorRef.current.getCurrentCandle();
        if (currentCandle) {
          setCandles((prev) => {
            const filtered = prev.filter(
              (candle) => candle.time !== currentCandle.time
            );
            const updated = [...filtered, currentCandle];
            return updated.slice(-limit);
          });
        }
      }
    },
    [limit]
  );

  const processMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length === 0) return;

    const trades = messageQueueRef.current.splice(0, 10);
    trades.forEach(updateCandles);
  }, [updateCandles]);

  useEffect(() => {
    const interval = setInterval(processMessageQueue, 100);
    return () => clearInterval(interval);
  }, [processMessageQueue]);

  useEffect(() => {
    if (!symbol || !historicalCandles) return;
    setCandles(historicalCandles as Candle[]);
    candleAggregatorRef.current = createCandleAggregator(interval);
  }, [symbol, historicalCandles, interval]);

  useEffect(() => {
    if (!symbol) return;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseReconnectDelay = 1000;

    const connect = () => {
      try {
        const ws = new WebSocket(
          `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`
        );
        wsRef.current = ws;
        isConnectedRef.current = true;

        ws.onopen = () => {
          reconnectAttempts = 0;
          isConnectedRef.current = true;
          setIsConnected(true);
          setConnectionStatus("connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const price = parseFloat(data.p);

            setLivePrice(price.toFixed(2));

            const messageLatency = Date.now() - data.E;
            setLatency(messageLatency);

            const trade: Trade = {
              price,
              quantity: parseFloat(data.q),
              timestamp: data.T,
              isBuyerMaker: data.m,
              tradeId: data.t,
            };

            messageQueueRef.current.push(trade);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
            setConnectionStatus("error");
          }
        };

        ws.onclose = () => {
          isConnectedRef.current = false;
          setIsConnected(false);
          setConnectionStatus("disconnected");
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts++;
              connect();
            }, delay);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          isConnectedRef.current = false;
          setIsConnected(false);
          setConnectionStatus("error");
        };
      } catch (error) {
        console.error("Error creating WebSocket connection:", error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
      isConnectedRef.current = false;
    };
  }, [symbol]);

  return {
    candles,
    livePrice: debouncedLivePrice,
    isConnected,
    connectionStatus,
    latency,
  };
};
