import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { OhlcLegendData } from "./useChartLegend";
import { TPriceBar } from "../types/types";
import { createChartInitializer as createDesktopInitializer } from "../../Desktop/components/chart/core/ChartAllPeriod";
import { createChartInitializer as createMobileInitializer } from "../../Mobile/components/chart/core/ChartAllPeriod";

export function useTradePage(platform: "desktop" | "mobile" = "desktop") {
  const chartControlsRef = useRef<{
    setData: (symbolName: string, priceBars: TPriceBar[]) => void;
    onNewTrade: (
      priceBar: TPriceBar,
      tradeSize: number,
      lastTradeBuyOrSell: boolean,
    ) => void;
    setXRange: (startDate: Date, endDate: Date) => void;
    setTool: (tool: string) => void;
    addLineAnnotation: () => void;
    addBoxAnnotation: () => void;
    deleteSelectedAnnotations: () => void;
  }>(undefined);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [providerId, setProviderId] = useState<string>("random");
  const [activePeriod, setActivePeriod] = useState<string>("1D");
  const [activeTool, setActiveTool] = useState<string>("pan");

  const [ohlcData, setOhlcData] = useState<OhlcLegendData | null>(null);
  const legendVisible = activeTool === "pan";

  const [annotationPopup, setAnnotationPopup] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });

  const handleOhlcUpdate = useCallback((data: OhlcLegendData | null) => {
    setOhlcData(data);
  }, []);

  const handleAnnotationSelected = useCallback(
    (event: { selected: boolean; pixelX: number; pixelY: number }) => {
      if (event.selected) {
        const containerRect =
          chartContainerRef.current?.getBoundingClientRect();
        const canvasEl = chartContainerRef.current?.querySelector("canvas");
        const canvasRect = canvasEl?.getBoundingClientRect();
        const offsetX =
          canvasRect && containerRect
            ? canvasRect.left - containerRect.left
            : 0;
        const offsetY =
          canvasRect && containerRect ? canvasRect.top - containerRect.top : 0;
        setAnnotationPopup({
          visible: true,
          x: event.pixelX + offsetX,
          y: event.pixelY + offsetY - 8,
        });
      } else {
        setAnnotationPopup((prev) => ({ ...prev, visible: false }));
      }
    },
    [],
  );

  const handleProviderChanged = (event: any) =>
    setProviderId(event.target.value);

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    chartControlsRef.current?.setTool(tool);
    if (tool !== "pan") {
      setOhlcData(null);
    }
  };

  const handlePeriodChange = (period: string) => setActivePeriod(period);

  const handleDeleteSelected = useCallback(() => {
    chartControlsRef.current?.deleteSelectedAnnotations();
    setAnnotationPopup((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      const isInput =
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.isContentEditable;
      if ((event.key === "Delete" || event.key === "Backspace") && !isInput) {
        handleDeleteSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteSelected]);

  const createInitializer =
    platform === "mobile" ? createMobileInitializer : createDesktopInitializer;

  const initFunc = useMemo(
    () =>
      createInitializer(
        providerId,
        activePeriod,
        handleOhlcUpdate,
        handleAnnotationSelected,
      ),
    [
      providerId,
      activePeriod,
      handleOhlcUpdate,
      handleAnnotationSelected,
      createInitializer,
    ],
  );

  return {
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
  };
}
