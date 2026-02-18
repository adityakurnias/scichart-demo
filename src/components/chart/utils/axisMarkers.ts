import { AxisMarkerAnnotation } from "scichart";
import { appTheme } from "../../../styles/theme";

export const createAxisMarker = (
  value: number,
  formatFunc: (v: number) => string,
) => {
  return new AxisMarkerAnnotation({
    fontSize: 10,
    backgroundColor: appTheme.MutedBlue,
    color: appTheme.TV_Background,
    formattedValue: formatFunc(value),
  });
};
