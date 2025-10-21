import { memo, useMemo } from "react";

type Order = [string, string];

interface Props {
  title: string;
  data: Order[];
  isBid?: boolean;
}

const OrderTable = ({ title, data, isBid = true }: Props) => {
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

  const progressColor = useMemo(
    () => (isBid ? "bg-green-500" : "bg-red-500"),
    [isBid]
  );

  const titleColor = useMemo(
    () => (isBid ? "text-green-400" : "text-red-400"),
    [isBid]
  );

  return (
    <div className="flex-1 p-4 bg-gray-800 shadow-lg rounded-md">
      <h2 className={`text-xl font-bold mb-4 ${titleColor}`}>{title}</h2>
      <div className="max-h-64 min-h-64 overflow-y-auto">
        <table className="w-full table-auto border-collapse relative">
          <thead className="sticky top-0 bg-gray-800">
            <tr>
              <th className="px-3 py-1 text-left text-sm font-semibold">
                Price
              </th>
              <th className="px-3 py-1 text-right text-sm font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map(([price, amount], index) => {
              const pct = maxAmount
                ? (parseFloat(amount) / maxAmount) * 100
                : 0;
              return (
                <tr key={`${price}-${amount}-${index}`} className="h-8">
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
  );
};

export default memo(OrderTable);
