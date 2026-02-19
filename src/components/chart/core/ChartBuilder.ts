import { SciChartSurface } from "scichart";
import { TPriceBar } from "../../../types/types";
import { appTheme } from "../../../styles/theme";
import { configureAxes } from "../config/Axes";
import { configureSeries } from "../config/Series";
import { configureModifiers } from "../config/Modifiers";
import { PriceAnnotation } from "../features/PriceAnnotation";
import { addLineAnnotation } from "../tools/LineAnnotaion";
import { addBoxAnnotation } from "../tools/BoxAnnotation";
import { deleteSelectedAnnotations } from "../tools/DeleteAnnotatation";
import { setData, onNewTrade } from "../utils/ChartData";
import { setXRange, setTool, toggleCursor } from "./ChartControls";
import { OhlcLegendData } from "../../ui/ChartLegend";

export const createCandlestickChart = async (
  rootElement: string | HTMLDivElement,
  onOhlcUpdate: (data: OhlcLegendData | null) => void,
) => {
  const { sciChartSurface, wasmContext } = await SciChartSurface.create(
    rootElement,
    { theme: appTheme.TradingViewTheme },
  );

  const { xAxis } = configureAxes(sciChartSurface, wasmContext);
  const { candleDataSeries } = configureSeries(
    sciChartSurface,
    wasmContext,
    onOhlcUpdate,
  );
  const modifiers = configureModifiers(sciChartSurface);
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
    toggleCursor: (isEnabled: boolean, onToggle?: (e: boolean) => void) =>
      toggleCursor(modifiers, isEnabled, onToggle),
    addLineAnnotation: () => addLineAnnotation(sciChartSurface, xAxis),
    addBoxAnnotation: () => addBoxAnnotation(sciChartSurface, xAxis),
    deleteSelectedAnnotations: () => deleteSelectedAnnotations(sciChartSurface),
  };

  return { sciChartSurface, controls };
};
