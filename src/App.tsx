import * as React from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import commonClasses from "./styles/Examples.module.scss";
import { createCandlestickChart } from "./components/chart/createCandlestickChart";
import { SciChartReact, TResolvedReturnType } from "scichart-react";
import {
  binanceSocketClient,
  TRealtimePriceBar,
} from "./services/binanceSocketClient";
import { Observable, Subscription } from "rxjs";
import {
  simpleBinanceRestClient,
  TPriceBar,
} from "./services/binanceRestClient";
import { appTheme } from "./styles/theme";
import { ExampleDataProvider } from "./services/ExampleDataProvider";
import { ChartToolbar } from "./components/ui/ChartToolbar";

// SCICHART EXAMPLE
// const drawExample = async (rootElement: string | HTMLDivElement) => {
//     const { sciChartSurface, sciChartOverview, controls } = await createCandlestickChart(rootElement);
export const drawExample =
  (dataSource: string) => async (rootElement: string | HTMLDivElement) => {
    // Create the candlestick chart example. Contains Candlestick series, tooltips, volume, zooming panning behaviour and more
    const { sciChartSurface, controls } =
      await createCandlestickChart(rootElement);

    const endDate = new Date(Date.now());
    const startDate = new Date();
    startDate.setMinutes(endDate.getMinutes() - 300);

    let priceBars: TPriceBar[];
    if (dataSource !== "Random") {
      priceBars = await simpleBinanceRestClient.getCandles(
        "BTCUSDT",
        "1m",
        startDate,
        endDate,
        500,
        dataSource,
      );
      // Set the candles data on the chart
      controls.setData("BTC/USDT", priceBars);
    } else {
      priceBars = ExampleDataProvider.getRandomCandles(
        300,
        60000,
        startDate,
        60,
      );
      controls.setData("Random", priceBars);
    }

    const startViewportRange = new Date();
    startViewportRange.setMinutes(endDate.getMinutes() - 100);
    endDate.setMinutes(endDate.getMinutes() + 10);
    controls.setXRange(startViewportRange, endDate);

    // Susbscribe to price updates from the exchange
    let obs: Observable<TRealtimePriceBar>;
    if (dataSource !== "Random") {
      obs = binanceSocketClient.getRealtimeCandleStream("BTCUSDT", "1m");
    } else {
      const lastBar = priceBars[priceBars.length - 1];
      const startBar: TRealtimePriceBar = {
        symbol: "Random",
        close: lastBar.close,
        high: lastBar.high,
        low: lastBar.low,
        volume: lastBar.volume,
        eventTime: new Date().getTime(),
        open: lastBar.open,
        openTime: lastBar.date * 1000,
        closeTime: (lastBar.date + 60) * 1000,
        interval: "1m",
        lastTradeSize: 0,
        lastTradeBuyOrSell: false,
      };
      obs = binanceSocketClient.getRandomCandleStream(startBar, 60000);
    }
    const subscription = obs.subscribe((pb) => {
      const priceBar = {
        date: pb.openTime,
        open: pb.open,
        high: pb.high,
        low: pb.low,
        close: pb.close,
        volume: pb.volume,
      };
      controls.onNewTrade(priceBar, pb.lastTradeSize, pb.lastTradeBuyOrSell);
    });

    return { sciChartSurface, subscription, controls };
  };

export default function RealtimeTickingStockCharts() {
  const chartControlsRef = React.useRef<{
    setData: (symbolName: string, priceBars: TPriceBar[]) => void;
    onNewTrade: (
      priceBar: TPriceBar,
      tradeSize: number,
      lastTradeBuyOrSell: boolean,
    ) => void;
    setXRange: (startDate: Date, endDate: Date) => void;
    setTool: (tool: string) => void;
  }>(undefined);
  const [dataSource, setDataSource] = React.useState<string>("Random");
  const [activeTool, setActiveTool] = React.useState<string>("pan");

  const handleDataSourceChanged = (event: any) => {
    setDataSource(event.target.value);
  };

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    if (chartControlsRef.current?.setTool) {
      chartControlsRef.current.setTool(tool);
    }
  };

  const initFunc = drawExample(dataSource);

  return (
    <div
      className={commonClasses.ChartWrapper}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div className={commonClasses.ToolbarRow} style={{ flex: "none" }}>
        <FormControl sx={{ marginTop: "1em" }}>
          <InputLabel
            id="data-source-label"
            sx={{ color: appTheme.VividGreen }}
          >
            Data Source
          </InputLabel>
          <Select
            variant="outlined"
            labelId="data-source-label"
            id="data-source-select"
            label="Data Source"
            sx={{
              color: "inherit",
              "& .MuiSvgIcon-root": { color: "inherit" },
            }}
            size="small"
            inputProps={{
              MenuProps: { disableScrollLock: true },
              "aria-label": "Without label",
            }}
            value={dataSource}
            onChange={handleDataSourceChanged}
          >
            <MenuItem value={"Random"}>Random</MenuItem>
            <MenuItem value={"com"}>Binance.com</MenuItem>
          </Select>
        </FormControl>
      </div>

      <SciChartReact
        key={dataSource}
        initChart={initFunc}
        onInit={(initResult: TResolvedReturnType<typeof initFunc>) => {
          const { subscription, controls } = initResult;
          chartControlsRef.current = controls;
          // Apply initial tool
          controls.setTool(activeTool);

          return () => {
            subscription.unsubscribe();
          };
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          flex: "auto",
        }}
        innerContainerProps={{
          style: { flexBasis: "100%", flexGrow: 1, flexShrink: 1 },
        }}
      />
      <ChartToolbar activeTool={activeTool} onToolChange={handleToolChange} />
    </div>
  );
}
