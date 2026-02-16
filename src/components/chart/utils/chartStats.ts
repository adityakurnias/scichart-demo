import { OhlcDataSeries } from "scichart";

export interface Stats {
  startPrice: number;
  endPrice: number;
  change: number;
  changePercent: number;
  maxHigh: number;
  minLow: number;
  avg: number;
  count: number;
  volume: number;
  duration: number;
}

export const calculateStats = (
  dataSeries: OhlcDataSeries,
  xMin: number,
  xMax: number,
): Stats | null => {
  const xValues = dataSeries.getNativeXValues();
  const openValues = dataSeries.getNativeOpenValues();
  const highValues = dataSeries.getNativeHighValues();
  const lowValues = dataSeries.getNativeLowValues();
  const closeValues = dataSeries.getNativeCloseValues();

  let startPrice = 0;
  let endPrice = 0;
  let maxHigh = Number.MIN_VALUE;
  let minLow = Number.MAX_VALUE;
  let volumeSum = 0;
  let count = 0;
  let startTime = 0;
  let endTime = 0;
  let sumClose = 0;
  let foundStart = false;

  for (let i = 0; i < dataSeries.count(); i++) {
    const x = xValues.get(i);
    if (x >= xMin && x <= xMax) {
      if (!foundStart) {
        startPrice = openValues.get(i);
        startTime = x;
        foundStart = true;
      }
      endPrice = closeValues.get(i);
      endTime = x;
      maxHigh = Math.max(maxHigh, highValues.get(i));
      minLow = Math.min(minLow, lowValues.get(i));

      const metadata = dataSeries.getMetadataAt(i) as { volume?: number };
      if (metadata && typeof metadata.volume === "number") {
        volumeSum += metadata.volume;
      }

      sumClose += closeValues.get(i);
      count++;
    }
  }

  if (!foundStart) return null;

  const change = endPrice - startPrice;
  const changePercent = (change / startPrice) * 100;
  const avg = sumClose / count;
  const duration = (endTime - startTime) * 1000;

  return {
    startPrice,
    endPrice,
    change,
    changePercent,
    maxHigh,
    minLow,
    avg,
    count,
    volume: volumeSum,
    duration,
  };
};
