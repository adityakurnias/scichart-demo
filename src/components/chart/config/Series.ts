import {
  TSciChart,
  SciChartSurface,
  OhlcDataSeries,
  FastCandlestickRenderableSeries,
} from "scichart";
import { appTheme } from "../../../styles/theme";
import { OhlcLegendData } from "../../ui/ChartLegend";

export const configureSeries = (
  sciChartSurface: SciChartSurface,
  wasmContext: TSciChart,
  onOhlcUpdate: (data: OhlcLegendData | null) => void,
) => {
  const candleDataSeries = new OhlcDataSeries(wasmContext, {
    dataSeriesName: "BTC/USDT",
  });

  const candlestickSeries = new FastCandlestickRenderableSeries(wasmContext, {
    dataSeries: candleDataSeries,
    strokeThickness: 1,
    brushUp: appTheme.TV_Green,
    brushDown: appTheme.TV_Red,
    strokeUp: appTheme.TV_Green,
    strokeDown: appTheme.TV_Red,
    id: "candlestick-series",
  });

  // Push OHLC data to React state via callback (replaces document.getElementById hack)
  candlestickSeries.rolloverModifierProps.tooltipLegendTemplate = (
    _tooltipProps: any,
    seriesInfo: any,
  ): string => {
    if (seriesInfo?.openValue != null) {
      onOhlcUpdate({
        name: "BTC/USDT",
        open: seriesInfo.openValue,
        high: seriesInfo.highValue,
        low: seriesInfo.lowValue,
        close: seriesInfo.closeValue,
      });
    }
    return ""; // legend rendering is handled by ChartLegend React component
  };

  sciChartSurface.renderableSeries.add(candlestickSeries);

  return { candleDataSeries, candlestickSeries };
};
