"use client";

import { memo } from "react";
import { useTradingStore } from "@/lib/store";
import { formatCurrency, formatBTC } from "@/lib/risk";

const OrderHistory = () => {
  const { getOrderHistory } = useTradingStore();
  const orders = getOrderHistory();

  if (orders.length === 0) {
    return (
      <div className="p-4 bg-gray-800 text-white rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Order History</h3>
        <p className="text-gray-400 text-sm">No orders placed yet</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Order History</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {orders
          .slice(-10)
          .reverse()
          .map((order) => (
            <div
              key={order.id}
              className="flex justify-between items-center p-2 bg-gray-700 rounded text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    order.order.side === "buy"
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {order.order.side.toUpperCase()}
                </span>
                <span>{formatBTC(order.order.quantity)}</span>
              </div>
              <div className="text-right">
                <div className="font-mono">
                  {formatCurrency(order.fillPrice)}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(order.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default memo(OrderHistory);
