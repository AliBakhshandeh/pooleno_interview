import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Balance, OrderRequest } from "./risk";

interface TradingState {
  balance: Balance;

  orders: Array<{
    id: string;
    timestamp: number;
    order: OrderRequest;
    fillPrice: number;
    status: "filled" | "cancelled";
  }>;

  updateBalance: (newBalance: Balance) => void;
  executeOrder: (order: OrderRequest, fillPrice: number) => void;
  resetBalance: () => void;
  getOrderHistory: () => Array<{
    id: string;
    timestamp: number;
    order: OrderRequest;
    fillPrice: number;
    status: "filled" | "cancelled";
  }>;
}

const initialBalance: Balance = {
  usd: 10000,
  btc: 0.25,
};

export const useTradingStore = create<TradingState>()(
  devtools(
    (set, get) => ({
      balance: initialBalance,
      orders: [],

      updateBalance: (newBalance: Balance) => {
        set({ balance: newBalance });
      },

      executeOrder: (order: OrderRequest, fillPrice: number) => {
        const { balance, orders } = get();

        let newBalance: Balance;
        if (order.side === "buy") {
          newBalance = {
            usd: balance.usd - order.quantity * fillPrice,
            btc: balance.btc + order.quantity,
          };
        } else {
          newBalance = {
            usd: balance.usd + order.quantity * fillPrice,
            btc: balance.btc - order.quantity,
          };
        }

        const orderRecord = {
          id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          order,
          fillPrice,
          status: "filled" as const,
        };

        set({
          balance: newBalance,
          orders: [...orders, orderRecord],
        });
      },

      resetBalance: () => {
        set({
          balance: initialBalance,
          orders: [],
        });
      },

      getOrderHistory: () => {
        return get().orders;
      },
    }),
    {
      name: "trading-store",
    }
  )
);
