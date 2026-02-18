import {
  SciChartSurface,
  ZoomPanModifier,
  MouseWheelZoomModifier,
  PinchZoomModifier,
  AnnotationHoverModifier,
  EXyDirection,
  LegendModifier,
  ELegendPlacement,
  ELegendOrientation,
  TLegendItem,
} from "scichart";
import { SelectionModifier } from "../tools/Measurment";
import { createCursorModifier } from "../tools/Cursor";
import { appTheme } from "../../../styles/theme";

export const configureModifiers = (sciChartSurface: SciChartSurface) => {
  const zoomPanModifier = new ZoomPanModifier({ enableZoom: true });
  const pinchZoomModifier = new PinchZoomModifier({
    xyDirection: EXyDirection.XDirection,
  });
  const cursorModifier = createCursorModifier();

  (pinchZoomModifier as any).scaleFactor = 0.0005;

  const selectionModifier = new SelectionModifier();

  sciChartSurface.chartModifiers.add(
    zoomPanModifier,
    pinchZoomModifier,
    selectionModifier,
    cursorModifier.cursorModifier,
    cursorModifier.rolloverModifier,
    cursorModifier.legendModifier,

    new MouseWheelZoomModifier(),
    new AnnotationHoverModifier(),
  );

  return {
    zoomPanModifier,
    cursorModifier: cursorModifier.cursorModifier,
    rolloverModifier: cursorModifier.rolloverModifier,
    legendModifier: cursorModifier.legendModifier,
    selectionModifier,
  };
};
