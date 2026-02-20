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
  const { zoomPanModifier, measurmentModifier } = modifiers;

  zoomPanModifier.isEnabled = false;
  measurmentModifier.isEnabled = false;

  switch (tool) {
    case "pan":
      zoomPanModifier.isEnabled = true;
      break;
    case "measurement":
      measurmentModifier.isEnabled = true;
      zoomPanModifier.isEnabled = true;
      break;
    default:
      zoomPanModifier.isEnabled = true;
      break;
  }
};

export const toggleCursor = (
  modifiers: { [key: string]: ChartModifierBase2D },
  isEnabled: boolean,
  onCursorToggle?: (enabled: boolean) => void,
) => {
  const { cursorModifier, rolloverModifier } = modifiers;
  if (cursorModifier) cursorModifier.isEnabled = isEnabled;
  if (rolloverModifier) rolloverModifier.isEnabled = isEnabled;

  onCursorToggle?.(isEnabled);
};
