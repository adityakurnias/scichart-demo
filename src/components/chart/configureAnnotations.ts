import { SciChartSurface, HorizontalLineAnnotation } from "scichart";
import { appTheme } from "../../styles/theme";

export const configureAnnotations = (sciChartSurface: SciChartSurface) => {
  // Add a vertical line annotation at the latest price
  const latestPriceAnnotation = new HorizontalLineAnnotation({
    isHidden: true,
    strokeDashArray: [2, 2],
    strokeThickness: 1,
    axisFontSize: 13,
    axisLabelStroke: appTheme.ForegroundColor,
    showLabel: true,
  });
  sciChartSurface.annotations.add(latestPriceAnnotation);

  return { latestPriceAnnotation };
};
