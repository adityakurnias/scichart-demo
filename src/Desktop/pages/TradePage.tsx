import { FormControl, InputLabel, MenuItem, Select, Box } from "@mui/material";
import commonClasses from "../../Shared/styles/Examples.module.scss";
import { SciChartReact, TResolvedReturnType } from "scichart-react";
import { appTheme } from "../../Shared/styles/theme";
import { ChartToolbarDesktop } from "../components/chart/ui/ChartToolbarDesktop";
import { TimeFrameSelectorDesktop } from "../components/chart/ui/TimeFrameSelectorDesktop";
import { ChartLegendDesktop } from "../components/chart/ui/ChartLegendDesktop";
import { AnnotationPopupDesktop } from "../components/chart/ui/AnnotationPopupDesktop";
import { CHART_PROVIDERS } from "../../Shared/services/ChartProviders";
import { useTradePage } from "../../Shared/hooks/useTradePage";
import { createChartInitializer } from "../../Desktop/components/chart/core/ChartAllPeriod";

export default function TradePageDesktop() {
  const {
    chartControlsRef,
    chartContainerRef,
    providerId,
    activePeriod,
    activeTool,
    ohlcData,
    legendVisible,
    annotationPopup,
    handleProviderChanged,
    handleToolChange,
    handlePeriodChange,
    handleDeleteSelected,
    initFunc,
  } = useTradePage(createChartInitializer);

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
          flexDirection: "row",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          flex: 1,
        }}
      >
        <ChartToolbarDesktop
          activeTool={activeTool}
          onToolChange={handleToolChange}
          onAddLine={() => chartControlsRef.current?.addLineAnnotation()}
          onAddBox={() => chartControlsRef.current?.addBoxAnnotation()}
        />

        <div
          ref={chartContainerRef}
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
          }}
        >
          <ChartLegendDesktop data={ohlcData} visible={legendVisible} />

          <AnnotationPopupDesktop
            visible={annotationPopup.visible}
            x={annotationPopup.x}
            y={annotationPopup.y}
            onDelete={handleDeleteSelected}
          />

          <SciChartReact
            key={`${providerId}-${activePeriod}`}
            initChart={initFunc}
            onInit={(initResult: TResolvedReturnType<typeof initFunc>) => {
              const { subscription, controls } = initResult;
              chartControlsRef.current = controls;
              controls.setTool(activeTool);
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
          <TimeFrameSelectorDesktop
            selectedPeriod={activePeriod}
            onPeriodChange={handlePeriodChange}
          />
        </div>
      </div>
    </Box>
  );
}
