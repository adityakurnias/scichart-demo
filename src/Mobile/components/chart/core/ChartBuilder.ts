//? Mobile-specific chart builder
//? Uses Mobile config for Axes/Modifiers, Desktop for Series/PriceAnnotation/tools/utils

import { SciChartSurface } from "scichart";
import { TPriceBar } from "../../../../Shared/types/types";
import { appTheme } from "../../../../Shared/styles/theme";
import { configureAxes } from "../config/Axes";
import { configureSeries } from "../../../../Desktop/components/chart/config/Series";
import { configureModifiers } from "../config/Modifiers";
import { PriceAnnotation } from "../../../../Desktop/components/chart/config/PriceAnnotation";
import { addLineAnnotation } from "../../../../Desktop/components/chart/tools/LineAnnotation";
import { addBoxAnnotation } from "../../../../Desktop/components/chart/tools/BoxAnnotation";
import { deleteSelectedAnnotations } from "../../../../Desktop/components/chart/tools/DeleteAnnotation";
import {
  setData,
  onNewTrade,
} from "../../../../Desktop/components/chart/utils/ChartData";
import { setXRange, setTool } from "./ChartControls";
import { OhlcLegendData } from "../../../../Shared/hooks/useChartLegend";
import { AnnotationSelectionCallback } from "../../../../Desktop/components/chart/utils/AnnotationSelection";

export const createCandlestickChart = async (
  rootElement: string | HTMLDivElement,
  onOhlcUpdate: (data: OhlcLegendData | null) => void,
  onAnnotationSelected?: AnnotationSelectionCallback,
) => {
  const { sciChartSurface, wasmContext } = await SciChartSurface.create(
    rootElement,
    { theme: appTheme.TradingViewTheme },
  );

  // Store callback on the surface so annotation tools can fire it without coupling
  (sciChartSurface as any).__onAnnotationSelected =
    onAnnotationSelected ?? null;

  const { xAxis } = configureAxes(sciChartSurface, wasmContext);
  const { candleDataSeries } = configureSeries(
    sciChartSurface,
    wasmContext,
    onOhlcUpdate,
  );
  const modifiers = configureModifiers(sciChartSurface, onOhlcUpdate);

  const { latestPriceAnnotation } = PriceAnnotation(sciChartSurface);

  const controls = {
    setData: (symbolName: string, priceBars: TPriceBar[]) =>
      setData(candleDataSeries, latestPriceAnnotation, symbolName, priceBars),
    onNewTrade: (
      priceBar: TPriceBar,
      tradeSize: number,
      lastTradeBuyOrSell: boolean,
    ) =>
      onNewTrade(
        candleDataSeries,
        xAxis,
        latestPriceAnnotation,
        priceBar,
        tradeSize,
        lastTradeBuyOrSell,
      ),
    setXRange: (startDate: Date, endDate: Date) =>
      setXRange(xAxis, startDate, endDate),
    setTool: (tool: string) => setTool(modifiers, tool),
    addLineAnnotation: () => addLineAnnotation(sciChartSurface, xAxis),
    addBoxAnnotation: () => addBoxAnnotation(sciChartSurface, xAxis),
    deleteSelectedAnnotations: () => deleteSelectedAnnotations(sciChartSurface),
    setAnnotationSelectionCallback: (
      cb: AnnotationSelectionCallback | null,
    ) => {
      (sciChartSurface as any).__onAnnotationSelected = cb;
    },
  };

  return { sciChartSurface, controls };
};
