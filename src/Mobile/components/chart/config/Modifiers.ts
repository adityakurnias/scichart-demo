//? Mobile-specific modifiers — pinch zoom (no mousewheel), MeasurementMobile

import {
  SciChartSurface,
  ZoomPanModifier,
  PinchZoomModifier,
  AnnotationHoverModifier,
} from "scichart";
import { MeasurementMobile } from "../tools/MeasurementMobile";
import { CrosshairMobile } from "../tools/CrosshairMobile";
import { OhlcLegendData } from "../../../../Shared/hooks/useChartLegend";

export const configureModifiers = (
  sciChartSurface: SciChartSurface,
  onOhlcUpdate: (data: OhlcLegendData | null) => void,
) => {
  const zoomPanModifier = new ZoomPanModifier({ enableZoom: false });
  zoomPanModifier.isEnabled = false;

  const pinchZoomModifier = new PinchZoomModifier({
    horizontalGrowFactor: 0.001,
    verticalGrowFactor: 0.001,
  });

  const measurmentModifier = new MeasurementMobile(zoomPanModifier);
  measurmentModifier.isEnabled = false;

  // Mobile crosshair: long-press → drag → release (TradingView-style)
  const crosshairTool = new CrosshairMobile(onOhlcUpdate, zoomPanModifier);
  crosshairTool.isEnabled = true;

  sciChartSurface.chartModifiers.add(
    crosshairTool,
    zoomPanModifier,
    pinchZoomModifier,
    measurmentModifier,
    new AnnotationHoverModifier(),
  );

  return {
    crosshairTool,
    zoomPanModifier,
    pinchZoomModifier,
    measurmentModifier,
  };
};
