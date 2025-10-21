"use client";

import VirtualizedOrderTable from "@/components/shared/VirtualizedOrderTable";
import { useOrderBook } from "@/services/webSocket/useOrderBook";
import { memo } from "react";

const OrderBook = () => {
  const { bids, asks, spread, midPrice, vwap } = useOrderBook("BTCUSDT");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm text-gray-400">
          <div>
            Spread:{" "}
            <span className="text-white font-mono">${spread.toFixed(2)}</span>
          </div>
          <div>
            Mid:{" "}
            <span className="text-white font-mono">${midPrice.toFixed(2)}</span>
          </div>
          <div>
            VWAP:{" "}
            <span className="text-white font-mono">${vwap.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <VirtualizedOrderTable title="Bids" data={bids} isBid />
        <VirtualizedOrderTable title="Asks" data={asks} isBid={false} />
      </div>
    </div>
  );
};

export default memo(OrderBook);
