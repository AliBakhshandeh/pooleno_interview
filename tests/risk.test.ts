import { describe, it, expect } from "@jest/globals";
import {
  type Balance,
  type OrderRequest,
  calculatePnL,
  calculatePortfolioAllocation,
  calculatePortfolioValue,
  formatBTC,
  formatCurrency,
  formatPercentage,
  simulateOrderExecution,
  validateOrderBalance,
  validateOrderRisk,
} from "../lib/risk";

describe("Risk Management", () => {
  const mockBalance: Balance = {
    usd: 10000,
    btc: 0.25,
  };

  const mockOrder: OrderRequest = {
    side: "buy",
    quantity: 0.1,
    price: 50000,
  };

  describe("validateOrderBalance", () => {
    it("should validate buy orders correctly", () => {
      const result = validateOrderBalance(mockOrder, mockBalance, 50000);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject buy orders with insufficient USD", () => {
      const largeOrder: OrderRequest = {
        side: "buy",
        quantity: 1.0,
        price: 50000,
      };

      const result = validateOrderBalance(largeOrder, mockBalance, 50000);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Insufficient USD balance");
    });

    it("should validate sell orders correctly", () => {
      const sellOrder: OrderRequest = {
        side: "sell",
        quantity: 0.1,
        price: 50000,
      };

      const result = validateOrderBalance(sellOrder, mockBalance, 50000);
      expect(result.isValid).toBe(true);
    });

    it("should reject sell orders with insufficient BTC", () => {
      const largeSellOrder: OrderRequest = {
        side: "sell",
        quantity: 1.0,
        price: 50000,
      };

      const result = validateOrderBalance(largeSellOrder, mockBalance, 50000);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Insufficient BTC balance");
    });

    it("should warn when using more than 90% of balance", () => {
      const largeOrder: OrderRequest = {
        side: "buy",
        quantity: 0.19,
        price: 50000,
      };

      const result = validateOrderBalance(largeOrder, mockBalance, 50000);
      expect(result.warnings[0]).toContain("90% of USD balance");
    });
  });

  describe("validateOrderRisk", () => {
    it("should validate orders within risk limits", () => {
      const result = validateOrderRisk(mockOrder, mockBalance, 50000);
      expect(result.isValid).toBe(true);
    });

    it("should reject orders below minimum size", () => {
      const smallOrder: OrderRequest = {
        side: "buy",
        quantity: 0.00001,
        price: 50000,
      };

      const result = validateOrderRisk(smallOrder, mockBalance, 50000);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Order size too small");
    });

    it("should reject orders above maximum size", () => {
      const largeOrder: OrderRequest = {
        side: "buy",
        quantity: 20,
        price: 50000,
      };

      const result = validateOrderRisk(largeOrder, mockBalance, 50000);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Order size too large");
    });

    it("should reject orders exceeding position limits", () => {
      const hugeOrder: OrderRequest = {
        side: "buy",
        quantity: 2.1,
        price: 50000,
      };

      const result = validateOrderRisk(hugeOrder, mockBalance, 50000);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain(
        "Order value exceeds maximum position size"
      );
    });
  });

  describe("calculatePnL", () => {
    it("should calculate PnL for buy orders correctly", () => {
      const result = calculatePnL(mockOrder, 50000, 0.5);

      expect(result.estimatedFillPrice).toBe(50000);
      expect(result.estimatedPnL).toBe(25);
      expect(result.estimatedPnLPercentage).toBe(0.5);
      expect(result.riskLevel).toBe("low");
    });

    it("should calculate PnL for sell orders correctly", () => {
      const sellOrder: OrderRequest = {
        side: "sell",
        quantity: 0.1,
        price: 50000,
      };

      const result = calculatePnL(sellOrder, 50000, 0.5);

      expect(result.estimatedFillPrice).toBe(50000);
      expect(result.estimatedPnL).toBe(25);
      expect(result.estimatedPnLPercentage).toBe(0.5);
    });

    it("should classify risk levels correctly", () => {
      const highRiskOrder: OrderRequest = {
        side: "buy",
        quantity: 0.1,
        price: 50000,
      };

      const result = calculatePnL(highRiskOrder, 50000, 3.0);

      expect(result.estimatedPnLPercentage).toBe(3.0);
      expect(result.riskLevel).toBe("high");
    });
  });

  describe("simulateOrderExecution", () => {
    it("should simulate buy order execution", () => {
      const result = simulateOrderExecution(mockOrder, mockBalance, 50000);

      expect(result.usd).toBe(5000);
      expect(result.btc).toBe(0.35);
    });

    it("should simulate sell order execution", () => {
      const sellOrder: OrderRequest = {
        side: "sell",
        quantity: 0.1,
        price: 50000,
      };

      const result = simulateOrderExecution(sellOrder, mockBalance, 50000);

      expect(result.usd).toBe(15000);
      expect(result.btc).toBe(0.15);
    });
  });

  describe("Portfolio calculations", () => {
    it("should calculate portfolio value correctly", () => {
      const value = calculatePortfolioValue(mockBalance, 50000);
      expect(value).toBe(22500);
    });

    it("should calculate portfolio allocation correctly", () => {
      const allocation = calculatePortfolioAllocation(mockBalance, 50000);

      expect(allocation.usdPercentage).toBeCloseTo(44.44, 2);
      expect(allocation.btcPercentage).toBeCloseTo(55.56, 2);
    });

    it("should handle zero portfolio value", () => {
      const zeroBalance: Balance = { usd: 0, btc: 0 };
      const allocation = calculatePortfolioAllocation(zeroBalance, 50000);

      expect(allocation.usdPercentage).toBe(0);
      expect(allocation.btcPercentage).toBe(0);
    });
  });

  describe("Formatting functions", () => {
    it("should format currency correctly", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
      expect(formatCurrency(0)).toBe("$0.00");
      expect(formatCurrency(-100)).toBe("-$100.00");
    });

    it("should format BTC correctly", () => {
      expect(formatBTC(0.12345678)).toBe("0.12345678 BTC");
      expect(formatBTC(1)).toBe("1.00000000 BTC");
    });

    it("should format percentage correctly", () => {
      expect(formatPercentage(2.5)).toBe("+2.50%");
      expect(formatPercentage(-1.8)).toBe("-1.80%");
      expect(formatPercentage(0)).toBe("+0.00%");
    });
  });
});
