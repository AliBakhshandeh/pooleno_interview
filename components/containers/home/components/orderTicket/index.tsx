"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { toast } from "sonner";
import {
  validateOrderBalance,
  validateOrderRisk,
  calculatePnL,
  formatCurrency,
  formatBTC,
  type OrderRequest,
} from "@/lib/risk";
import { useTradingStore } from "@/lib/store";
import { NumberInput, Button, Badge } from "@/components/ui";

type Side = "Buy" | "Sell";

interface OrderTicketProps {
  livePrice: string | null;
}

const OrderTicket = ({ livePrice }: OrderTicketProps) => {
  const [side, setSide] = useState<Side>("Buy");
  const [quantity, setQuantity] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [inputMode, setInputMode] = useState<"quantity" | "cost">("quantity");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const { balance, executeOrder, resetBalance } = useTradingStore();

  const currentPrice = Number(livePrice) || 0;

  const orderRequest: OrderRequest = useMemo(() => {
    let calculatedQuantity = 0;

    if (inputMode === "quantity") {
      calculatedQuantity = parseFloat(quantity) || 0;
    } else {
      const costValue = parseFloat(cost) || 0;
      calculatedQuantity = currentPrice > 0 ? costValue / currentPrice : 0;
    }

    return {
      side: side.toLowerCase() as "buy" | "sell",
      quantity: calculatedQuantity,
      price: currentPrice,
    };
  }, [side, quantity, cost, currentPrice, inputMode]);

  const riskChecks = useMemo(() => {
    const balanceCheck = validateOrderBalance(
      orderRequest,
      balance,
      currentPrice
    );
    const riskCheck = validateOrderRisk(orderRequest, balance, currentPrice);

    return {
      isValid: balanceCheck.isValid && riskCheck.isValid,
      errors: [...balanceCheck.errors, ...riskCheck.errors],
      warnings: [...balanceCheck.warnings, ...riskCheck.warnings],
    };
  }, [orderRequest, balance, currentPrice]);

  const pnLCalculation = useMemo(() => {
    if (orderRequest.quantity <= 0) return null;
    return calculatePnL(orderRequest, currentPrice, 0.5);
  }, [orderRequest, currentPrice]);

  const handleSideChange = useCallback((newSide: Side) => {
    setSide(newSide);
  }, []);

  const handleQuantityChange = useCallback(
    (value: string, numberValue: number) => {
      setQuantity(value);
      if (inputMode === "quantity" && currentPrice > 0) {
        setCost((numberValue * currentPrice).toFixed(2));
      }
    },
    [inputMode, currentPrice]
  );

  const handleCostChange = useCallback(
    (value: string, numberValue: number) => {
      setCost(value);
      if (inputMode === "cost" && currentPrice > 0) {
        setQuantity((numberValue / currentPrice).toFixed(8));
      }
    },
    [inputMode, currentPrice]
  );

  const handleInputModeChange = useCallback((mode: "quantity" | "cost") => {
    setInputMode(mode);
    if (mode === "quantity") {
      setCost("");
    } else {
      setQuantity("");
    }
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (!riskChecks.isValid) {
      toast.error(riskChecks.errors[0] || "Order validation failed");
      return;
    }

    if (orderRequest.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    setIsPlacingOrder(true);

    try {
      if (riskChecks.warnings.length > 0) {
        riskChecks.warnings.forEach((warning) => {
          toast.warning(warning);
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const fillPrice = currentPrice;
      executeOrder(orderRequest, fillPrice);

      const orderValue = orderRequest.quantity * fillPrice;
      toast.success(
        `${side} order executed! ${orderRequest.quantity.toFixed(
          8
        )} BTC at $${fillPrice.toFixed(2)} (Total: $${orderValue.toFixed(2)})`
      );

      setQuantity("");
      setCost("");
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  }, [riskChecks, orderRequest, side, currentPrice, executeOrder]);

  return (
    <div className="w-full p-4 bg-gray-800 rounded-lg space-y-4">
      <div className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Order Ticket</h3>
          <Badge variant={livePrice ? "success" : "error"}>
            {livePrice ? "Live" : "Offline"}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button
            onClick={() => handleSideChange("Buy")}
            variant={side === "Buy" ? "primary" : "secondary"}
            className="flex-1"
          >
            Buy
          </Button>
          <Button
            onClick={() => handleSideChange("Sell")}
            variant={side === "Sell" ? "primary" : "secondary"}
            className="flex-1"
          >
            Sell
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex space-x-2">
            <Button
              onClick={() => handleInputModeChange("quantity")}
              variant={inputMode === "quantity" ? "primary" : "secondary"}
              size="sm"
              className="flex-1"
            >
              Quantity
            </Button>
            <Button
              onClick={() => handleInputModeChange("cost")}
              variant={inputMode === "cost" ? "primary" : "secondary"}
              size="sm"
              className="flex-1"
            >
              Cost
            </Button>
          </div>

          {inputMode === "quantity" && (
            <>
              <NumberInput
                label="Quantity (BTC)"
                value={quantity}
                onChange={handleQuantityChange}
                placeholder="0.0000"
                decimalPlaces={8}
                error={
                  riskChecks.errors.length > 0
                    ? riskChecks.errors[0]
                    : undefined
                }
                className={`w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 ${
                  riskChecks.errors.length > 0
                    ? "focus:ring-red-500"
                    : "focus:ring-blue-500"
                }`}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    riskChecks.isValid &&
                    orderRequest.quantity > 0
                  ) {
                    handlePlaceOrder();
                  }
                }}
              />
              {cost && (
                <div className="text-sm text-gray-400">
                  Cost: {formatCurrency(parseFloat(cost))}
                </div>
              )}
            </>
          )}

          {inputMode === "cost" && (
            <>
              <NumberInput
                label="Cost (USD)"
                value={cost}
                onChange={handleCostChange}
                placeholder="0.00"
                decimalPlaces={2}
                prefix="$"
                error={
                  riskChecks.errors.length > 0
                    ? riskChecks.errors[0]
                    : undefined
                }
                className={`w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 ${
                  riskChecks.errors.length > 0
                    ? "focus:ring-red-500"
                    : "focus:ring-blue-500"
                }`}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    riskChecks.isValid &&
                    orderRequest.quantity > 0
                  ) {
                    handlePlaceOrder();
                  }
                }}
              />
              {quantity && (
                <div className="text-sm text-gray-400">
                  Quantity: {formatBTC(parseFloat(quantity))}
                </div>
              )}
            </>
          )}

          {riskChecks.warnings.length > 0 && (
            <div className="text-sm text-yellow-400">
              {riskChecks.warnings[0]}
            </div>
          )}

          <div className="flex items-center justify-between p-2 bg-gray-900 rounded">
            <span className="text-sm text-gray-400">Live Price:</span>
            <span className="text-lg font-mono font-semibold text-white">
              {formatCurrency(currentPrice)}
            </span>
          </div>

          {pnLCalculation && (
            <div className="p-3 bg-gray-900 rounded-lg space-y-2">
              <div className="text-sm font-medium text-gray-300">
                Order Preview
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fill Price:</span>
                  <span className="text-white">
                    {formatCurrency(pnLCalculation.estimatedFillPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Est. PnL (±0.5%):</span>
                  <span
                    className={`${
                      pnLCalculation.estimatedPnL >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {pnLCalculation.estimatedPnL >= 0 ? "+" : ""}
                    {formatCurrency(pnLCalculation.estimatedPnL)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Risk Level:</span>
                  <span
                    className={`${
                      pnLCalculation.riskLevel === "high"
                        ? "text-red-400"
                        : pnLCalculation.riskLevel === "medium"
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {pnLCalculation.riskLevel.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handlePlaceOrder}
          className="w-full"
          variant="primary"
          disabled={
            !riskChecks.isValid || orderRequest.quantity <= 0 || isPlacingOrder
          }
        >
          {isPlacingOrder ? "Placing Order..." : `Place ${side} Order`}
        </Button>

        <div className="p-3 bg-transparent border border-gray-600 rounded-lg">
          <div className="text-sm font-medium text-gray-300 mb-2">
            Portfolio
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">USD Balance:</span>
              <span className="text-green-400">
                {formatCurrency(balance.usd)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">BTC Balance:</span>
              <span className="text-orange-400">{formatBTC(balance.btc)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-700 pt-1">
              <span className="text-gray-400">Total Value:</span>
              <span className="text-white font-medium">
                {formatCurrency(balance.usd + balance.btc * currentPrice)}
              </span>
            </div>
          </div>
          <Button
            onClick={resetBalance}
            className="mt-2 w-full"
            variant="secondary"
            size="sm"
          >
            Reset Balance
          </Button>
        </div>
      </div>
    </div>
  );
};

export default memo(OrderTicket);
