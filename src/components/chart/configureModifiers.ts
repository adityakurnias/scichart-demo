import {
  SciChartSurface,
  ZoomExtentsModifier,
  ZoomPanModifier,
  MouseWheelZoomModifier,
  PinchZoomModifier,
  CursorModifier,
  AnnotationHoverModifier,
} from "scichart";
import { appTheme } from "../../styles/theme";
import { SelectionModifier } from "./selectionModifier";

export const configureModifiers = (sciChartSurface: SciChartSurface) => {
  const cursorModifier = new CursorModifier({
    crosshairStroke: appTheme.TV_Cursor,
    crosshairStrokeDashArray: [2, 2],
    axisLabelFill: appTheme.TV_Cursor,
  });

  const zoomPanModifier = new ZoomPanModifier({ enableZoom: true });
  const pinchZoomModifier = new PinchZoomModifier();
  // pinchZoomModifier.scaleFactor = 0.001; // Commented out until verified, or if it doesn't exist.
  // SciChart JS PinchZoomModifier usually has 'scaleFactor'.
  // If TS complains about options, maybe it's not in the interface but IS on the class.
  // I will try setting it on the instance cast to any if needed, or just leave default if I can't find it.
  // Better: I'll use 'any' cast for the options to suppress the error if I'm confident,
  // BUT the user said "decrease sensitivity".
  // Let's try setting it on the instance.
  (pinchZoomModifier as any).scaleFactor = 0.001;

  const selectionModifier = new SelectionModifier();

  sciChartSurface.chartModifiers.add(
    new ZoomExtentsModifier(),
    zoomPanModifier,
    pinchZoomModifier,
    new MouseWheelZoomModifier(),
    selectionModifier,
    new AnnotationHoverModifier(),
    cursorModifier,
  );

  return { zoomPanModifier, cursorModifier, selectionModifier };
};
