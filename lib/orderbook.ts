export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface OrderBookState {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdateId: number;
  spread: number;
  midPrice: number;
  vwap: number;
}

export interface OrderBookUpdate {
  bids: [string, string][];
  asks: [string, string][];
  lastUpdateId: number;
  firstUpdateId?: number;
}

export interface OrderBookSnapshot {
  bids: [string, string][];
  asks: [string, string][];
  lastUpdateId: number;
}

const parseLevels = (levels: [string, string][]): OrderBookLevel[] => {
  return levels
    .map(([price, size]) => ({
      price: parseFloat(price),
      size: parseFloat(size),
    }))
    .filter((level) => level.size > 0);
};

const parseLevelsWithZeros = (levels: [string, string][]): OrderBookLevel[] => {
  return levels.map(([price, size]) => ({
    price: parseFloat(price),
    size: parseFloat(size),
  }));
};

const sortLevels = (
  levels: OrderBookLevel[],
  isBid: boolean
): OrderBookLevel[] => {
  return [...levels].sort((a, b) =>
    isBid ? b.price - a.price : a.price - b.price
  );
};

const mergeLevels = (
  existing: OrderBookLevel[],
  updates: OrderBookLevel[],
  isBid: boolean
): OrderBookLevel[] => {
  const levelMap = new Map<number, number>();

  existing.forEach((level) => {
    levelMap.set(level.price, level.size);
  });

  updates.forEach((level) => {
    if (level.size === 0) {
      levelMap.delete(level.price);
    } else {
      levelMap.set(level.price, level.size);
    }
  });

  const merged = Array.from(levelMap.entries()).map(([price, size]) => ({
    price,
    size,
  }));

  return sortLevels(merged, isBid);
};

const calculateMetrics = (bids: OrderBookLevel[], asks: OrderBookLevel[]) => {
  const bestBid = bids[0]?.price || 0;
  const bestAsk = asks[0]?.price || 0;
  const spread = bestAsk - bestBid;
  const midPrice = (bestBid + bestAsk) / 2;

  return { spread, midPrice };
};

const calculateVWAP = (levels: OrderBookLevel[]): number => {
  const top20 = levels.slice(0, 20);
  if (top20.length === 0) return 0;

  const totalVolume = top20.reduce((sum, level) => sum + level.size, 0);
  if (totalVolume === 0) return 0;

  const weightedSum = top20.reduce(
    (sum, level) => sum + level.price * level.size,
    0
  );
  return weightedSum / totalVolume;
};

export const orderBookReducer = (
  state: OrderBookState,
  action:
    | { type: "SNAPSHOT"; payload: OrderBookSnapshot }
    | { type: "UPDATE"; payload: OrderBookUpdate }
): OrderBookState => {
  switch (action.type) {
    case "SNAPSHOT": {
      const { bids: bidLevels, asks: askLevels, lastUpdateId } = action.payload;

      const bids = sortLevels(parseLevels(bidLevels), true);
      const asks = sortLevels(parseLevels(askLevels), false);

      const { spread, midPrice } = calculateMetrics(bids, asks);
      const vwap = (calculateVWAP(bids) + calculateVWAP(asks)) / 2;

      return {
        bids,
        asks,
        lastUpdateId,
        spread,
        midPrice,
        vwap,
      };
    }

    case "UPDATE": {
      const {
        bids: bidUpdates,
        asks: askUpdates,
        lastUpdateId,
        firstUpdateId,
      } = action.payload;

      if (firstUpdateId && state.lastUpdateId + 1 !== firstUpdateId) {
        console.warn("Order book sequence mismatch, ignoring update");
        return state;
      }

      if (lastUpdateId <= state.lastUpdateId) {
        return state;
      }

      const bidUpdatesParsed = parseLevelsWithZeros(bidUpdates);
      const askUpdatesParsed = parseLevelsWithZeros(askUpdates);

      const newBids = mergeLevels(state.bids, bidUpdatesParsed, true);
      const newAsks = mergeLevels(state.asks, askUpdatesParsed, false);

      const { spread, midPrice } = calculateMetrics(newBids, newAsks);
      const vwap = (calculateVWAP(newBids) + calculateVWAP(newAsks)) / 2;

      return {
        bids: newBids,
        asks: newAsks,
        lastUpdateId,
        spread,
        midPrice,
        vwap,
      };
    }

    default:
      return state;
  }
};

export const getTopLevels = (
  levels: OrderBookLevel[],
  count: number
): OrderBookLevel[] => {
  return levels.slice(0, count);
};

export const calculateCumulativeSizes = (
  levels: OrderBookLevel[]
): OrderBookLevel[] => {
  let cumulative = 0;
  return levels.map((level) => {
    cumulative += level.size;
    return {
      ...level,
      size: cumulative,
    };
  });
};
