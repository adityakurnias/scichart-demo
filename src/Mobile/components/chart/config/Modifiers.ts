//? Mobile-specific modifiers — pinch zoom (no mousewheel), MeasurementMobile

import {
  SciChartSurface,
  ZoomPanModifier,
  PinchZoomModifier,
  AnnotationHoverModifier,
  EXyDirection,
} from "scichart";
import { Measurment } from "../../../../Desktop/components/chart/tools/Measurement";
import { CrosshairTool } from "../../../../Desktop/components/chart/tools/Crosshair";
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

  const measurmentModifier = new Measurment();
  measurmentModifier.isEnabled = false;

  const crosshairTool = new CrosshairTool(onOhlcUpdate);
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
