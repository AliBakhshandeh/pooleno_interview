import { useQuery } from "@tanstack/react-query";
import { request } from "./request";
interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}
export const useHistoricalCandles = (
  symbol: string,
  limit: number,
  interval = "1m"
) => {
  return useQuery({
    queryKey: ["historicalCandles", symbol, limit, interval],
    queryFn: () =>
      request<Candle[]>(
        `/api/historicalCandles?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`
      ),
  });
};
