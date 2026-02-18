import { CursorModifier, ELegendOrientation, ELegendPlacement, LegendModifier, RolloverModifier, TLegendItem } from "scichart";

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

    const legendModifier = new LegendModifier({
    placement: ELegendPlacement.TopLeft,
    orientation: ELegendOrientation.Vertical,
    showCheckboxes: true,
    showSeriesMarkers: true,
    showLegend: true,
  });

  legendModifier.sciChartLegend.getLegendItemHTML = (
    orientation: ELegendOrientation,
    showCheckboxes: boolean,
    showSeriesMarkers: boolean,
    item: TLegendItem,
  ): string => {
    const display =
      orientation === ELegendOrientation.Vertical ? "flex" : "inline-flex";
    let str = `<span class="scichart__legend-item" style="display: ${display}; align-items: center; margin: 4px; padding: 2px; white-space: nowrap; gap: 4px">`;

    str += `<label for="${item.id}" style="color: ${appTheme.LegendText}; text-align: center;">${item.name}</label>`;

    if (item.id === "candlestick-series") {
      str += `<span id="legend-ohlc-value" style="margin-left: 10px;"></span>`;
    }
    str += `</span>`;
    return str;
  };

  cursorModifier.isEnabled = false;
  rolloverModifier.isEnabled = false;
  legendModifier.isEnabled = false;
  return { cursorModifier, rolloverModifier, legendModifier };
};
