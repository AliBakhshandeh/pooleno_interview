"use client";
import MainLayout from "@/components/layout/mainLayout";
import TradeChart from "@/components/shared/LightweightChart";
import { useLiveCandles } from "@/services/webSocket/useLiveTrade";
import OrderHistory from "@/components/shared/OrderHistory";
import { DocumentCurrencyDollarIcon } from "@heroicons/react/24/outline";
import { useMemo, memo } from "react";
import OrderBook from "./components/orderBook";
import OrderTicket from "./components/orderTicket";

const MainContainer = () => {
  const { candles, livePrice } = useLiveCandles({
    symbol: "BTCUSDT",
    interval: "1m",
    limit: 500,
  });

  const rightSection = useMemo(() => {
    return (
      <div className="flex items-center gap-4">
        <span className="text-xl flex items-center gap-2">
          <DocumentCurrencyDollarIcon className="h-5 w-5" />
          {livePrice && <span className="text-lg font-mono">${livePrice}</span>}
        </span>
      </div>
    );
  }, [livePrice]);

  const memoizedCandles = useMemo(() => candles, [candles]);

  return (
    <MainLayout
      hasNavigationBar={true}
      title="BTC/USDT"
      rightSection={rightSection}
    >
      <div className="w-full h-[500px] rounded-md overflow-hidden">
        <TradeChart data={memoizedCandles} />
      </div>

      <div className="w-full mt-4">
        <OrderBook />
      </div>

      <div className="w-full mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OrderTicket livePrice={livePrice} />
        <OrderHistory />
      </div>
    </MainLayout>
  );
};

export default memo(MainContainer);
