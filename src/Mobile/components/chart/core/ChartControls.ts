//? this code for control our components

import { NumberRange, AxisBase2D, ChartModifierBase2D } from "scichart";
import { SniperMeasurement } from "../tools/SniperMeasurement";

export const setXRange = (xAxis: AxisBase2D, startDate: Date, endDate: Date) => {
  xAxis.visibleRange = new NumberRange(
    startDate.getTime() / 1000,
    endDate.getTime() / 1000,
  );
};

export const setTool = (
  modifiers: { [key: string]: ChartModifierBase2D },
  tool: string,
) => {
  const {
    crosshairTool,
    zoomPanModifier,
    measurmentModifier,
    sniperModifier,
    pinchZoomModifier,
  } = modifiers;

  // Reset standard modifiers
  if (crosshairTool)      crosshairTool.isEnabled      = false;
  if (zoomPanModifier)    zoomPanModifier.isEnabled    = false;
  if (measurmentModifier) measurmentModifier.isEnabled = false;
  if (pinchZoomModifier)  pinchZoomModifier.isEnabled  = false;

  // Sniper uses its own phase system — tell it to exit drawing mode
  // but keep it "on" at SciChart level so it can intercept box taps in pan mode
  const sniper = sniperModifier as SniperMeasurement | undefined;
  if (sniper) sniper.isEnabled = false; // triggers exitDrawingMode(), keeps receiveHandledEvents

  switch (tool) {
    case "pan":
      zoomPanModifier.isEnabled   = true;
      crosshairTool.isEnabled     = true;
      pinchZoomModifier.isEnabled = true;
      break;

    // case "measurement":
    //   measurmentModifier.isEnabled = true;
    //   zoomPanModifier.isEnabled    = true;
    //   break;

    case "sniper":
      // isEnabled = true triggers enterCrosshairPhase() → crosshair spawns at center
      if (sniper) sniper.isEnabled = true;
      break;

    default:
      zoomPanModifier.isEnabled   = true;
      crosshairTool.isEnabled     = true;
      pinchZoomModifier.isEnabled = true;
      break;
  }
};