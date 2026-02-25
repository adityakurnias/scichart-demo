//? this code for control our components, if we dont wanna use it, dont regist it at the switch case code!

import { NumberRange, AxisBase2D, ChartModifierBase2D } from "scichart";

export const setXRange = (
  xAxis: AxisBase2D,
  startDate: Date,
  endDate: Date,
) => {
  console.log(
    `createCandlestickChart(): Setting chart range to ${startDate} - ${endDate}`,
  );
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
    pinchZoomModifier,
  } = modifiers;

  // Mobile crosshair always enabled — it activates only on long-press,
  // so it never conflicts with pan/pinch/measurement gestures.
  zoomPanModifier.isEnabled = false;
  measurmentModifier.isEnabled = false;
  pinchZoomModifier.isEnabled = false;
  if (crosshairTool) crosshairTool.isEnabled = true;

  switch (tool) {
    case "pan":
      zoomPanModifier.isEnabled = true;
      pinchZoomModifier.isEnabled = true;
      break;
    case "measurement":
      measurmentModifier.isEnabled = true;
      zoomPanModifier.isEnabled = true;
      pinchZoomModifier.isEnabled = true;
      break;
    default:
      zoomPanModifier.isEnabled = true;
      pinchZoomModifier.isEnabled = true;
      break;
  }
};
