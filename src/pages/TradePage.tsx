import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  useMediaQuery,
  useTheme,
  Box,
} from "@mui/material";
import commonClasses from "../styles/Examples.module.scss";
import { SciChartReact, TResolvedReturnType } from "scichart-react";
import { appTheme } from "../styles/theme";
import { ChartToolbar } from "../components/ui/ChartToolbar";
import { TimeFrameSelector } from "../components/ui/TimeFrameSelector";
import { ChartLegend, OhlcLegendData } from "../components/ui/ChartLegend";
import { CHART_PROVIDERS } from "../services/ChartProviders";
import { createChartInitializer } from "../components/chart/core/ChartInitializer";
import { TPriceBar } from "../types/types";

export default function TradePage() {
  const chartControlsRef = useRef<{
    setData: (symbolName: string, priceBars: TPriceBar[]) => void;
    onNewTrade: (
      priceBar: TPriceBar,
      tradeSize: number,
      lastTradeBuyOrSell: boolean,
    ) => void;
    setXRange: (startDate: Date, endDate: Date) => void;
    setTool: (tool: string) => void;
    toggleCursor: (isEnabled: boolean, onToggle?: (e: boolean) => void) => void;
    addLineAnnotation: () => void;
    addBoxAnnotation: () => void;
    deleteSelectedAnnotations: () => void;
  }>(undefined);

  const [providerId, setProviderId] = useState<string>("random");
  const [activePeriod, setActivePeriod] = useState<string>("1D");
  const [activeTool, setActiveTool] = useState<string>("pan");
  const [isCursorEnabled, setIsCursorEnabled] = useState<boolean>(false);

  // Legend state — updated directly from SciChart rollover callback
  const [ohlcData, setOhlcData] = useState<OhlcLegendData | null>(null);
  const [legendVisible, setLegendVisible] = useState<boolean>(false);

  // Stable callback: passed into chart at init time — never changes identity
  const handleOhlcUpdate = useCallback((data: OhlcLegendData | null) => {
    setOhlcData(data);
  }, []);

  const handleProviderChanged = (event: any) =>
    setProviderId(event.target.value);

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    chartControlsRef.current?.setTool(tool);
  };

  const handleToggleCursor = () => {
    const newState = !isCursorEnabled;
    setIsCursorEnabled(newState);
    setLegendVisible(newState);
    if (!newState) setOhlcData(null);
    chartControlsRef.current?.toggleCursor(newState);
  };

  const handlePeriodChange = (period: string) => setActivePeriod(period);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      const isInput =
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.isContentEditable;
      if ((event.key === "Delete" || event.key === "Backspace") && !isInput) {
        chartControlsRef.current?.deleteSelectedAnnotations();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const initFunc = useMemo(
    () => createChartInitializer(providerId, activePeriod, handleOhlcUpdate),
    [providerId, activePeriod, handleOhlcUpdate],
  );

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      className={commonClasses.ChartWrapper}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        padding: "0",
        bgcolor: "background.default",
      }}
    >
      <div
        className={commonClasses.ToolbarRow}
        style={{
          flex: "none",
          borderBottom: "1px solid #2a2e39",
          display: "flex",
          alignItems: "center",
          paddingRight: "10px",
        }}
      >
        <FormControl sx={{ m: 1, minWidth: 150 }}>
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
            inputProps={{ MenuProps: { disableScrollLock: true } }}
            value={providerId}
            onChange={handleProviderChanged}
          >
            {Object.values(CHART_PROVIDERS).map((prov) => (
              <MenuItem key={prov.id} value={prov.id}>
                {prov.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          flex: 1,
        }}
      >
        <ChartToolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          isCursorEnabled={isCursorEnabled}
          onToggleCursor={handleToggleCursor}
          onAddLine={() => chartControlsRef.current?.addLineAnnotation()}
          onAddBox={() => chartControlsRef.current?.addBoxAnnotation()}
          onDeleteSelected={() =>
            chartControlsRef.current?.deleteSelectedAnnotations()
          }
          style={{ order: isMobile ? 2 : 0 }}
        />

        {/* Chart + legend overlay container */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            order: isMobile ? 1 : 0,
          }}
        >
          {/* React legend overlay — fully responsive, never overflows */}
          <ChartLegend data={ohlcData} visible={legendVisible} />

          <SciChartReact
            key={`${providerId}-${activePeriod}`}
            initChart={initFunc}
            onInit={(initResult: TResolvedReturnType<typeof initFunc>) => {
              const { subscription, controls } = initResult;
              chartControlsRef.current = controls;
              controls.setTool(activeTool);
              controls.toggleCursor(isCursorEnabled);
              return () => subscription.unsubscribe();
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              flex: 1,
              minHeight: 0,
              height: "100%",
            }}
            innerContainerProps={{ style: { width: "100%", height: "100%" } }}
          />
          <TimeFrameSelector
            selectedPeriod={activePeriod}
            onPeriodChange={handlePeriodChange}
          />
        </div>
      </div>
    </Box>
  );
}
