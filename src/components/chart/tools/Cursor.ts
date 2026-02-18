import { CursorModifier, RolloverModifier } from "scichart";

import { appTheme } from "../../../styles/theme";

export const createCursorModifier = () => {
  const cursorModifier = new CursorModifier({
    crosshairStroke: appTheme.TV_Cursor,
    crosshairStrokeDashArray: [2, 2],
    showXLine: false, // Vertical line
    showYLine: true, // Horizontal line
    axisLabelFill: appTheme.TV_Cursor,
    showAxisLabels: true,
  });

  const rolloverModifier = new RolloverModifier({
    rolloverLineStroke: appTheme.TV_Cursor,
    rolloverLineStrokeDashArray: [2, 2],
    showTooltip: false,
    showRolloverLine: true,
    showAxisLabel: true,
    snapToDataPoint: true,
  });

  cursorModifier.isEnabled = false;
  rolloverModifier.isEnabled = false;
  return { cursorModifier, rolloverModifier };
};
