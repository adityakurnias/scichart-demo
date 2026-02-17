import {
  TSciChart,
  SciChartSurface,
  OhlcDataSeries,
  FastCandlestickRenderableSeries,
  FastLineRenderableSeries,
  XyMovingAverageFilter,
} from "scichart";
import { appTheme } from "../../../styles/theme";

export const configureSeries = (
  sciChartSurface: SciChartSurface,
  wasmContext: TSciChart,
) => {
  const candleDataSeries = new OhlcDataSeries(wasmContext);

  const candlestickSeries = new FastCandlestickRenderableSeries(wasmContext, {
    dataSeries: candleDataSeries,
    strokeThickness: 1,
    brushUp: appTheme.TV_Green,
    brushDown: appTheme.TV_Red,
    strokeUp: appTheme.TV_Green,
    strokeDown: appTheme.TV_Red,
  });
  sciChartSurface.renderableSeries.add(candlestickSeries);

  // Add moving averages
  sciChartSurface.renderableSeries.add(
    new FastLineRenderableSeries(wasmContext, {
      dataSeries: new XyMovingAverageFilter(candleDataSeries, {
        dataSeriesName: "Moving Average (20)",
        length: 20,
      }),
      stroke: appTheme.VividSkyBlue,
    }),
  );

  sciChartSurface.renderableSeries.add(
    new FastLineRenderableSeries(wasmContext, {
      dataSeries: new XyMovingAverageFilter(candleDataSeries, {
        dataSeriesName: "Moving Average (50)",
        length: 50,
      }),
      stroke: appTheme.VividPink,
    }),
  );

  return {
    candleDataSeries,
    candlestickSeries,
  };
};
