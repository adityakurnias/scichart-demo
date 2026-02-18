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

  candlestickSeries.rolloverModifierProps.tooltipLegendTemplate = (
    tooltipProps: any,
    seriesInfo: any,
  ) => {
    const ohlc = seriesInfo;
    if (!ohlc || !ohlc.openValue) {
      return "";
    }

    const open = ohlc.openValue.toFixed(2);
    const high = ohlc.highValue.toFixed(2);
    const low = ohlc.lowValue.toFixed(2);
    const close = ohlc.closeValue.toFixed(2);
    const change = ohlc.closeValue - ohlc.openValue;
    const percentChange = ((change / ohlc.openValue) * 100).toFixed(2);
    const color = change >= 0 ? appTheme.TV_Green : appTheme.TV_Red;
    const labelColor = "#787B86";

    return `
      <svg width="100%" height="30">
        <text x="5" y="20" font-size="13" font-family="Roboto" fill="${appTheme.VividSkyBlue}">${seriesInfo.seriesName}</text>
        <text x="80" y="20" font-size="13" font-family="Roboto" fill="${labelColor}">O <tspan fill="${color}">${open}</tspan></text>
        <text x="160" y="20" font-size="13" font-family="Roboto" fill="${labelColor}">H <tspan fill="${color}">${high}</tspan></text>
        <text x="240" y="20" font-size="13" font-family="Roboto" fill="${labelColor}">L <tspan fill="${color}">${low}</tspan></text>
        <text x="320" y="20" font-size="13" font-family="Roboto" fill="${labelColor}">C <tspan fill="${color}">${close}</tspan></text>
        <text x="400" y="20" font-size="13" font-family="Roboto" fill="${color}">
           ${change >= 0 ? "+" : ""}${change.toFixed(2)} (${change >= 0 ? "+" : ""}${percentChange}%)
        </text>
      </svg>
    `;
  };

  sciChartSurface.renderableSeries.add(candlestickSeries);

  // Add moving averages
  // sciChartSurface.renderableSeries.add(
  //   new FastLineRenderableSeries(wasmContext, {
  //     dataSeries: new XyMovingAverageFilter(candleDataSeries, {
  //       dataSeriesName: "Moving Average (20)",
  //       length: 20,
  //     }),
  //     stroke: appTheme.VividSkyBlue,
  //   }),
  // );

  // sciChartSurface.renderableSeries.add(
  //   new FastLineRenderableSeries(wasmContext, {
  //     dataSeries: new XyMovingAverageFilter(candleDataSeries, {
  //       dataSeriesName: "Moving Average (50)",
  //       length: 50,
  //     }),
  //     stroke: appTheme.VividPink,
  //   }),
  // );

  return {
    candleDataSeries,
    candlestickSeries,
  };
};
