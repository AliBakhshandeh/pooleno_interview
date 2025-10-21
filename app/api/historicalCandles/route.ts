import { NextRequest, NextResponse } from "next/server";

interface BinanceKline {
  [0]: number; // Open time
  [1]: string; // Open price
  [2]: string; // High price
  [3]: string; // Low price
  [4]: string; // Close price
  [5]: string; // Volume
  [6]: number; // Close time
  [7]: string; // Quote asset volume
  [8]: number; // Number of trades
  [9]: string; // Taker buy base asset volume
  [10]: string; // Taker buy quote asset volume
  [11]: string; // Ignore
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") || "BTCUSDT";
    const interval = searchParams.get("interval") || "1m";
    const limit = parseInt(searchParams.get("limit") || "500");

    // Validate parameters
    if (!symbol || !interval) {
      return NextResponse.json(
        { error: "Missing required parameters: symbol, interval" },
        { status: 400 }
      );
    }

    if (limit > 1000) {
      return NextResponse.json(
        { error: "Limit cannot exceed 1000" },
        { status: 400 }
      );
    }

    // Fetch data from Binance API
    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    const response = await fetch(binanceUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const klines: BinanceKline[] = await response.json();

    // Transform data to our format
    const candles: Candle[] = klines.map((kline) => ({
      time: kline[0], // Open time in milliseconds
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
    }));

    return NextResponse.json(candles);
  } catch (error) {
    console.error("Error fetching historical candles:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical candles" },
      { status: 500 }
    );
  }
}
