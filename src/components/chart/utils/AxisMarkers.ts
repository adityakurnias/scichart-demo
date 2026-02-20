import { AxisMarkerAnnotation } from "scichart";
import { appTheme } from "../../../styles/theme";

export const createAxisMarker = (
  value: number,
  formatFunc: (v: number) => string,
  isXAxis: boolean = false,
) => {
  const safeValue = isNaN(value) ? 0 : value;

  return new AxisMarkerAnnotation({
    fontSize: 10,
    backgroundColor: appTheme.MutedBlue,
    color: appTheme.TV_Background,
    formattedValue: formatFunc(safeValue),

    xAxisId: isXAxis ? "AxisX" : undefined,
    yAxisId: !isXAxis ? "AxisY" : undefined,

    [isXAxis ? "x1" : "y1"]: safeValue,
  });
};
