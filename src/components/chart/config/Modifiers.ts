import {
  SciChartSurface,
  ZoomPanModifier,
  MouseWheelZoomModifier,
  PinchZoomModifier,
  CursorModifier,
  AnnotationHoverModifier,
  EXyDirection,
} from "scichart";
import { appTheme } from "../../../styles/theme";
import { SelectionModifier } from "../features/SelectionModifier";

export const configureModifiers = (sciChartSurface: SciChartSurface) => {
  const cursorModifier = new CursorModifier({
    crosshairStroke: appTheme.TV_Cursor,
    crosshairStrokeDashArray: [2, 2],
    axisLabelFill: appTheme.TV_Cursor,
  });
  cursorModifier.isEnabled = false;

  const zoomPanModifier = new ZoomPanModifier({ enableZoom: true });
  const pinchZoomModifier = new PinchZoomModifier({
    xyDirection: EXyDirection.XDirection,
  });

  (pinchZoomModifier as any).scaleFactor = 0.0005;

  const selectionModifier = new SelectionModifier();

  sciChartSurface.chartModifiers.add(
    zoomPanModifier,
    pinchZoomModifier,
    new MouseWheelZoomModifier(),
    selectionModifier,
    new AnnotationHoverModifier(),
    cursorModifier,
  );

  return { zoomPanModifier, cursorModifier, selectionModifier };
};
