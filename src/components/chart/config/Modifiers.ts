import {
  SciChartSurface,
  ZoomPanModifier,
  MouseWheelZoomModifier,
  PinchZoomModifier,
  AnnotationHoverModifier,
  EXyDirection,
} from "scichart";
import { Measurment } from "../tools/Measurment";
import { createCursorModifier } from "../tools/Cursor";

export const configureModifiers = (sciChartSurface: SciChartSurface) => {
  const zoomPanModifier = new ZoomPanModifier({ enableZoom: true });
  const pinchZoomModifier = new PinchZoomModifier({
    xyDirection: EXyDirection.XyDirection,
  });
  const mouseWheelZoomModifier = new MouseWheelZoomModifier({
    xyDirection: EXyDirection.XyDirection,
  });
  const cursorModifier = createCursorModifier();

  (pinchZoomModifier as any).scaleFactor = 0.0005;

  const measurmentModifier = new Measurment();

  sciChartSurface.chartModifiers.add(
    zoomPanModifier,
    pinchZoomModifier,
    mouseWheelZoomModifier,
    measurmentModifier,
    cursorModifier.cursorModifier,
    cursorModifier.rolloverModifier,
    new AnnotationHoverModifier(),
  );

  return {
    zoomPanModifier,
    cursorModifier: cursorModifier.cursorModifier,
    rolloverModifier: cursorModifier.rolloverModifier,
    measurmentModifier,
  };
};
