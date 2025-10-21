export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type Kline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string
];
