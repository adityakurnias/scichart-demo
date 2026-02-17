/**
 * Defines a price bar with Open, High, Low, Close and Date encoded as number
 */
export type TPriceBar = {
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type TRealtimePriceBar = {
  symbol: string;
  interval: string;
  eventTime: number;
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  lastTradeSize: number;
  lastTradeBuyOrSell: boolean;
};

export type TTrade = {
  eventTime: number;
  symbol: string;
  price: number;
  quantity: number;
  maker: boolean;
  isBuyerMaker: boolean;
  tradeId: number;
};
