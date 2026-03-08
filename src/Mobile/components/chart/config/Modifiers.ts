//? this code for add some custom feature or chart behaviour that you've been made

import {
  SciChartSurface,
  ZoomPanModifier,
  MouseWheelZoomModifier,
  PinchZoomModifier,
  AnnotationHoverModifier,
  EXyDirection,
} from "scichart";
import { MeasurementMobile } from "../tools/MeasurementMobile";
import { CrosshairMobile } from "../tools/CrosshairMobile";
import { SniperMeasurement } from "../tools/SniperMeasurement"; // 👈 NEW
import { OhlcLegendData } from "../../../../Shared/hooks/useChartLegend";

export const configureModifiers = (
  sciChartSurface: SciChartSurface,
  onOhlcUpdate: (data: OhlcLegendData | null) => void,
  onSniperDeactivate?: () => void, // 👈 NEW — callback ke React buat matiin tombol
) => {
  const zoomPanModifier = new ZoomPanModifier({ enableZoom: true });
  zoomPanModifier.isEnabled = false;

  const pinchZoomModifier = new PinchZoomModifier({
    xyDirection: EXyDirection.XDirection,
  });
  (pinchZoomModifier as any).scaleFactor = 0.0005;

  const mouseWheelZoomModifier = new MouseWheelZoomModifier({
    xyDirection: EXyDirection.XDirection,
  });

  const measurmentModifier = new MeasurementMobile();
  measurmentModifier.isEnabled = false;

  // 👇 NEW
  const sniperModifier = new SniperMeasurement(zoomPanModifier, onSniperDeactivate);
  sniperModifier.isEnabled = false;

  const crosshairTool = new CrosshairMobile(onOhlcUpdate);
  crosshairTool.isEnabled = true;

  sciChartSurface.chartModifiers.add(
    crosshairTool,
    zoomPanModifier,
    pinchZoomModifier,
    mouseWheelZoomModifier,
    measurmentModifier,
    sniperModifier, // 👈 NEW
    new AnnotationHoverModifier(),
  );

  return {
    crosshairTool,
    zoomPanModifier,
    pinchZoomModifier,
    measurmentModifier,
    sniperModifier, // 👈 NEW
  };
};