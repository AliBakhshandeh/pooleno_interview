import {
  createChart,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface TradeChartProps {
  data: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
}

const TradeChart = ({ data }: TradeChartProps) => {
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastDataLength, setLastDataLength] = useState(0);

  const chartConfig = useMemo(
    () => ({
      layout: { background: { color: "#1e2939" }, textColor: "#d1d4dc" },
      grid: {
        vertLines: { color: "#2b2b2b" },
        horzLines: { color: "#2b2b2b" },
      },
      rightPriceScale: { borderColor: "#555" },
      timeScale: { borderColor: "#555", timeVisible: true },
    }),
    []
  );

  const seriesConfig = useMemo(
    () => ({
      upColor: "#1da1f2",
      downColor: "#f44336",
      borderUpColor: "#1da1f2",
      borderDownColor: "#f44336",
      wickUpColor: "#1da1f2",
      wickDownColor: "#f44336",
    }),
    []
  );

  const formattedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const sortedData = [...data]
      .sort((a, b) => a.time - b.time)
      .map((d) => ({
        ...d,
        time: d.time as UTCTimestamp,
      }));

    const uniqueData = sortedData.reduce((acc, current) => {
      const existingIndex = acc.findIndex((item) => item.time === current.time);
      if (existingIndex >= 0) {
        acc[existingIndex] = current;
      } else {
        acc.push(current);
      }
      return acc;
    }, [] as typeof sortedData);

    return uniqueData;
  }, [data]);

  const handleResize = useCallback(() => {
    if (chartRef.current && containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      chartRef.current.resize(clientWidth, clientHeight);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createChart(containerRef.current, chartConfig);
    candleSeriesRef.current =
      chartRef.current.addCandlestickSeries(seriesConfig);

    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
      chartRef.current?.remove();
      setIsInitialized(false);
      setLastDataLength(0);
    };
  }, [chartConfig, seriesConfig, handleResize]);

  useEffect(() => {
    if (candleSeriesRef.current && formattedData.length > 0) {
      if (!isInitialized) {
        candleSeriesRef.current.setData(formattedData);
        setIsInitialized(true);
        setLastDataLength(formattedData.length);
      } else {
        if (formattedData.length > lastDataLength) {
          const newCandles = formattedData.slice(lastDataLength);
          newCandles.forEach((candle) => {
            candleSeriesRef.current?.update(candle);
          });
          setLastDataLength(formattedData.length);
        } else if (
          formattedData.length === lastDataLength &&
          formattedData.length > 0
        ) {
          const lastCandle = formattedData[formattedData.length - 1];
          candleSeriesRef.current?.update(lastCandle);
        }
      }
    }
  }, [formattedData, isInitialized, lastDataLength]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};

export default memo(TradeChart);
