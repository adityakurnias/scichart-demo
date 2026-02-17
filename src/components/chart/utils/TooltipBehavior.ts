import {
  SciChartSurface,
  AxisBase2D,
  CustomAnnotation,
  OhlcDataSeries,
  EAnnotationLayer,
  ECoordinateMode,
  EHorizontalAnchorPoint,
  EVerticalAnchorPoint,
} from "scichart";
import { appTheme } from "../../../styles/theme";
import { calculateStats } from "./ChartStats";
import { getStatsTooltipSvg } from "../templates/DetailTooltip";

export const attachStatsTooltip = (
  sciChartSurface: SciChartSurface,
  parentAnnotation: any,
  dataSeries: OhlcDataSeries,
  xAxis: AxisBase2D,
  yAxis: AxisBase2D,
) => {
  let isMinimized = false;

  const tooltipId = Math.random().toString(36).substring(7);

  const x1 = parentAnnotation.x1 as number;
  const x2 = parentAnnotation.x2 as number;
  const y1 = parentAnnotation.y1 as number;
  const y2 = parentAnnotation.y2 as number;

  let currentStats = calculateStats(
    dataSeries,
    Math.min(x1, x2),
    Math.max(x1, x2),
  );

  let tooltipAnnotation: CustomAnnotation | undefined;

  if (currentStats) {
    tooltipAnnotation = new CustomAnnotation({
      xCoordinateMode: ECoordinateMode.DataValue,
      yCoordinateMode: ECoordinateMode.DataValue,
      x1: Math.max(x1, x2),
      y1: Math.max(y1, y2),
      svgString: getStatsTooltipSvg(currentStats, isMinimized, tooltipId),
      annotationLayer: EAnnotationLayer.AboveChart,
    });
    sciChartSurface.annotations.add(tooltipAnnotation);
  }

  const adjustTooltipPosition = (dataX: number, dataY: number) => {
    if (!tooltipAnnotation) return;

    const xCalc = xAxis.getCurrentCoordinateCalculator();
    const yCalc = yAxis.getCurrentCoordinateCalculator();

    if (!xCalc || !yCalc) return;

    const xPix = xCalc.getCoordinate(dataX);
    const yPix = yCalc.getCoordinate(dataY);

    const viewportWidth = sciChartSurface.seriesViewRect.width;

    const tooltipWidth = isMinimized ? 120 : 220;
    const tooltipHeight = isMinimized ? 30 : 130;

    if (xPix + tooltipWidth > viewportWidth) {
      tooltipAnnotation.horizontalAnchorPoint = EHorizontalAnchorPoint.Right;
    } else {
      tooltipAnnotation.horizontalAnchorPoint = EHorizontalAnchorPoint.Left;
    }

    if (yPix - tooltipHeight < 0) {
      tooltipAnnotation.verticalAnchorPoint = EVerticalAnchorPoint.Top;
    } else {
      tooltipAnnotation.verticalAnchorPoint = EVerticalAnchorPoint.Bottom;
    }
  };

  let lastX1 = x1,
    lastX2 = x2,
    lastY1 = y1,
    lastY2 = y2;
  const uniqueBtnClass = `tooltip-minimize-btn-${tooltipId}`;

  const syncTooltip = () => {
    if (!sciChartSurface.annotations.contains(parentAnnotation)) {
      if (
        tooltipAnnotation &&
        sciChartSurface.annotations.contains(tooltipAnnotation)
      ) {
        sciChartSurface.annotations.remove(tooltipAnnotation);
      }
      sciChartSurface.rendered.unsubscribe(syncTooltip);
      sciChartSurface.domSvgContainer.removeEventListener(
        "click",
        handleContainerClick,
      );
      return;
    }

    if (tooltipAnnotation) {
      const cX1 = parentAnnotation.x1 as number;
      const cX2 = parentAnnotation.x2 as number;
      const cY1 = parentAnnotation.y1 as number;
      const cY2 = parentAnnotation.y2 as number;

      const isXChanged = cX1 !== lastX1 || cX2 !== lastX2;
      const isYChanged = cY1 !== lastY1 || cY2 !== lastY2;

      const maxX = Math.max(cX1, cX2);
      const maxY = Math.max(cY1, cY2);

      tooltipAnnotation.x1 = maxX;
      tooltipAnnotation.y1 = maxY;

      if (isXChanged || isYChanged) {
        if (isXChanged) {
          const minX = Math.min(cX1, cX2);
          currentStats = calculateStats(dataSeries, minX, maxX);
          if (currentStats) {
            tooltipAnnotation.svgString = getStatsTooltipSvg(
              currentStats,
              isMinimized,
              tooltipId,
            );
          }
        }

        adjustTooltipPosition(maxX, maxY);

        lastX1 = cX1;
        lastX2 = cX2;
        lastY1 = cY1;
        lastY2 = cY2;
      }
    }
  };

  const handleContainerClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | SVGElement;

    if (
      target &&
      target.classList &&
      target.classList.contains(uniqueBtnClass)
    ) {
      isMinimized = !isMinimized;
      if (currentStats && tooltipAnnotation) {
        tooltipAnnotation.svgString = getStatsTooltipSvg(
          currentStats,
          isMinimized,
          tooltipId,
        );

        adjustTooltipPosition(
          Math.max(
            parentAnnotation.x1 as number,
            parentAnnotation.x2 as number,
          ),
          Math.max(
            parentAnnotation.y1 as number,
            parentAnnotation.y2 as number,
          ),
        );
      }
    }
  };

  sciChartSurface.domSvgContainer.addEventListener(
    "click",
    handleContainerClick,
  );
  sciChartSurface.rendered.subscribe(syncTooltip);

  adjustTooltipPosition(Math.max(x1, x2), Math.max(y1, y2));
};
