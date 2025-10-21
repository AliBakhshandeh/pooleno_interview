"use client";

import { memo, useMemo, useCallback, useState, useEffect } from "react";

type Order = [string, string];

interface Props {
  title: string;
  data: Order[];
  isBid?: boolean;
  maxHeight?: number;
  itemHeight?: number;
}

const VirtualizedOrderTable = ({
  title,
  data,
  isBid = true,
  maxHeight = 256,
  itemHeight = 32,
}: Props) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(maxHeight);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) =>
      isBid
        ? parseFloat(b[0]) - parseFloat(a[0])
        : parseFloat(a[0]) - parseFloat(b[0])
    );
  }, [data, isBid]);

  const maxAmount = useMemo(() => {
    return Math.max(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ...sortedData.map(([_, amount]) => parseFloat(amount) || 0)
    );
  }, [sortedData]);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    sortedData.length
  );
  const visibleData = sortedData.slice(visibleStart, visibleEnd);

  const progressColor = useMemo(
    () => (isBid ? "bg-green-500" : "bg-red-500"),
    [isBid]
  );

  const titleColor = useMemo(
    () => (isBid ? "text-green-400" : "text-red-400"),
    [isBid]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(Math.min(maxHeight, window.innerHeight * 0.4));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [maxHeight]);

  const totalHeight = sortedData.length * itemHeight;

  return (
    <div className="flex-1 p-4 bg-gray-800 shadow-lg rounded-md">
      <h2 className={`text-xl font-bold mb-4 ${titleColor}`}>{title}</h2>
      <div className="relative">
        <div className="sticky top-0 bg-gray-800 z-10 border-b border-gray-700">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="px-3 py-1 text-left text-sm font-semibold">
                  Price
                </th>
                <th className="px-3 py-1 text-right text-sm font-semibold">
                  Amount
                </th>
              </tr>
            </thead>
          </table>
        </div>

        <div
          className="overflow-auto"
          style={{ height: containerHeight - 32 }}
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight, position: "relative" }}>
            <div
              style={{
                transform: `translateY(${visibleStart * itemHeight}px)`,
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              <table className="w-full table-auto border-collapse">
                <tbody>
                  {visibleData.map(([price, amount], index) => {
                    const pct = maxAmount
                      ? (parseFloat(amount) / maxAmount) * 100
                      : 0;
                    return (
                      <tr
                        key={`${price}-${amount}-${visibleStart + index}`}
                        className="h-8"
                        style={{ height: itemHeight }}
                      >
                        <td colSpan={2} className="p-0 relative">
                          <div
                            className={`${progressColor} opacity-30 absolute top-0 left-0 h-full`}
                            style={{ width: `${pct}%` }}
                          />
                          <div className="flex justify-between px-3 py-1 relative">
                            <span>{price}</span>
                            <span>{amount}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(VirtualizedOrderTable);
