export interface Balance {
  usd: number;
  btc: number;
}

export interface OrderRequest {
  side: "buy" | "sell";
  quantity: number;
  price?: number;
}

export interface RiskCheckResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PnLCalculation {
  estimatedFillPrice: number;
  estimatedPnL: number;
  estimatedPnLPercentage: number;
  riskLevel: "low" | "medium" | "high";
}

export interface RiskConfig {
  maxPositionSize: number;
  maxLeverage: number;
  maxDailyLoss: number;
  minOrderSize: number;
  maxOrderSize: number;
}

const DEFAULT_RISK_CONFIG: RiskConfig = {
  maxPositionSize: 100000,
  maxLeverage: 1,
  maxDailyLoss: 1000,
  minOrderSize: 0.0001,
  maxOrderSize: 10,
};

export const validateOrderBalance = (
  order: OrderRequest,
  balance: Balance,
  currentPrice: number
): RiskCheckResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (order.quantity <= 0) {
    errors.push("Quantity must be greater than 0");
  }

  if (order.side === "buy") {
    const requiredUsd = order.quantity * (order.price || currentPrice);
    if (requiredUsd > balance.usd) {
      errors.push(
        `Insufficient USD balance. Required: $${requiredUsd.toFixed(
          2
        )}, Available: $${balance.usd.toFixed(2)}`
      );
    }

    if (requiredUsd > balance.usd * 0.9) {
      warnings.push("Order would use more than 90% of USD balance");
    }
  } else {
    if (order.quantity > balance.btc) {
      errors.push(
        `Insufficient BTC balance. Required: ${order.quantity.toFixed(
          8
        )} BTC, Available: ${balance.btc.toFixed(8)} BTC`
      );
    }

    if (order.quantity > balance.btc * 0.9) {
      warnings.push("Order would use more than 90% of BTC balance");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateOrderRisk = (
  order: OrderRequest,
  balance: Balance,
  currentPrice: number,
  config: RiskConfig = DEFAULT_RISK_CONFIG
): RiskCheckResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (order.quantity < config.minOrderSize) {
    errors.push(`Order size too small. Minimum: ${config.minOrderSize} BTC`);
  }

  if (order.quantity > config.maxOrderSize) {
    errors.push(`Order size too large. Maximum: ${config.maxOrderSize} BTC`);
  }

  const orderValue = order.quantity * (order.price || currentPrice);
  if (orderValue > config.maxPositionSize) {
    errors.push(
      `Order value exceeds maximum position size. Maximum: $${config.maxPositionSize}`
    );
  }

  const newBtcBalance =
    order.side === "buy"
      ? balance.btc + order.quantity
      : balance.btc - order.quantity;

  const newPositionValue = newBtcBalance * currentPrice;
  if (newPositionValue > config.maxPositionSize) {
    warnings.push(
      "Order would create a position larger than recommended maximum"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const calculatePnL = (
  order: OrderRequest,
  currentPrice: number,
  priceMovementPercentage: number = 0.5
): PnLCalculation => {
  const estimatedFillPrice = order.price || currentPrice;
  const priceChange = estimatedFillPrice * (priceMovementPercentage / 100);
  const newPrice =
    order.side === "buy"
      ? estimatedFillPrice + priceChange
      : estimatedFillPrice - priceChange;

  const estimatedPnL =
    order.side === "buy"
      ? order.quantity * (newPrice - estimatedFillPrice)
      : order.quantity * (estimatedFillPrice - newPrice);

  const estimatedPnLPercentage =
    (estimatedPnL / (order.quantity * estimatedFillPrice)) * 100;

  let riskLevel: "low" | "medium" | "high" = "low";
  if (Math.abs(estimatedPnLPercentage) > 2) {
    riskLevel = "high";
  } else if (Math.abs(estimatedPnLPercentage) > 1) {
    riskLevel = "medium";
  }

  return {
    estimatedFillPrice,
    estimatedPnL,
    estimatedPnLPercentage,
    riskLevel,
  };
};

export const calculateVWAP = (
  levels: Array<{ price: number; size: number }>
): number => {
  if (levels.length === 0) return 0;

  const totalVolume = levels.reduce((sum, level) => sum + level.size, 0);
  if (totalVolume === 0) return 0;

  const weightedSum = levels.reduce(
    (sum, level) => sum + level.price * level.size,
    0
  );
  return weightedSum / totalVolume;
};

export const calculateSpread = (
  bestBid: number,
  bestAsk: number
): { spread: number; midPrice: number; spreadPercentage: number } => {
  const spread = bestAsk - bestBid;
  const midPrice = (bestBid + bestAsk) / 2;
  const spreadPercentage = (spread / midPrice) * 100;

  return { spread, midPrice, spreadPercentage };
};

export const simulateOrderExecution = (
  order: OrderRequest,
  balance: Balance,
  fillPrice: number
): Balance => {
  if (order.side === "buy") {
    return {
      usd: balance.usd - order.quantity * fillPrice,
      btc: balance.btc + order.quantity,
    };
  } else {
    return {
      usd: balance.usd + order.quantity * fillPrice,
      btc: balance.btc - order.quantity,
    };
  }
};

export const calculatePortfolioValue = (
  balance: Balance,
  currentPrice: number
): number => {
  return balance.usd + balance.btc * currentPrice;
};

export const calculatePortfolioAllocation = (
  balance: Balance,
  currentPrice: number
): { usdPercentage: number; btcPercentage: number } => {
  const totalValue = calculatePortfolioValue(balance, currentPrice);
  if (totalValue === 0) return { usdPercentage: 0, btcPercentage: 0 };

  return {
    usdPercentage: (balance.usd / totalValue) * 100,
    btcPercentage: ((balance.btc * currentPrice) / totalValue) * 100,
  };
};

export const formatCurrency = (
  amount: number,
  currency: string = "USD"
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatBTC = (amount: number): string => {
  return `${amount.toFixed(8)} BTC`;
};

export const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? "+" : "";
  return `${sign}${percentage.toFixed(2)}%`;
};
