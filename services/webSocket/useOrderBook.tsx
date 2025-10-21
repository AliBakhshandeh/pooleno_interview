"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { orderBookReducer, OrderBookState } from "@/lib/orderbook";

type Order = [string, string];

interface DepthUpdateEvent {
  e: string;
  E: number;
  s: string;
  U: number;
  u: number;
  b: Order[];
  a: Order[];
}

interface OrderBookHookResult {
  bids: Order[];
  asks: Order[];
  spread: number;
  midPrice: number;
  vwap: number;
  isConnected: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  latency: number;
}

export const useOrderBook = (symbol: string): OrderBookHookResult => {
  const [orderBookState, setOrderBookState] = useState<OrderBookState>({
    bids: [],
    asks: [],
    lastUpdateId: 0,
    spread: 0,
    midPrice: 0,
    vwap: 0,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const [latency, setLatency] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const lastMessageTimeRef = useRef(0);
  const messageStartTimeRef = useRef(0);

  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const connect = useCallback(() => {
    if (!symbol) return;

    setConnectionStatus("connecting");
    setIsConnected(false);

    try {
      const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@100ms`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Order book WebSocket connected");
        setConnectionStatus("connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        fetchInitialSnapshot();
      };

      ws.onmessage = (event) => {
        try {
          messageStartTimeRef.current = Date.now();
          const data: DepthUpdateEvent = JSON.parse(event.data);

          const messageLatency = Date.now() - data.E;
          setLatency(messageLatency);

          setOrderBookState((prevState) => {
            if (prevState.lastUpdateId === 0) {
              return orderBookReducer(prevState, {
                type: "SNAPSHOT",
                payload: {
                  bids: data.b || [],
                  asks: data.a || [],
                  lastUpdateId: data.u,
                },
              });
            } else {
              return orderBookReducer(prevState, {
                type: "UPDATE",
                payload: {
                  bids: data.b || [],
                  asks: data.a || [],
                  lastUpdateId: data.u,
                  firstUpdateId: data.U,
                },
              });
            }
          });

          lastMessageTimeRef.current = Date.now();
        } catch (error) {
          console.error("Error parsing order book data:", error);
          setConnectionStatus("error");
        }
      };

      ws.onclose = () => {
        console.log("Order book WebSocket disconnected");
        setConnectionStatus("disconnected");
        setIsConnected(false);

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay =
            baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error("Order book WebSocket error:", error);
        setConnectionStatus("error");
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Error creating order book WebSocket:", error);
      setConnectionStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const fetchInitialSnapshot = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=1000`
      );
      const data = await response.json();

      setOrderBookState((prevState) =>
        orderBookReducer(prevState, {
          type: "SNAPSHOT",
          payload: {
            bids: data.bids || [],
            asks: data.asks || [],
            lastUpdateId: data.lastUpdateId,
          },
        })
      );
    } catch (error) {
      console.error("Error fetching initial snapshot:", error);
    }
  }, [symbol]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect, fetchInitialSnapshot]);

  const bids: Order[] = orderBookState.bids.map((level) => [
    level.price.toString(),
    level.size.toString(),
  ]);

  const asks: Order[] = orderBookState.asks.map((level) => [
    level.price.toString(),
    level.size.toString(),
  ]);

  return {
    bids,
    asks,
    spread: orderBookState.spread,
    midPrice: orderBookState.midPrice,
    vwap: orderBookState.vwap,
    isConnected,
    connectionStatus,
    latency,
  };
};
