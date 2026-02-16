import {
  DateTimeNumericAxis,
  NumericAxis,
  NumberRange,
  ENumericFormat,
  EAutoRange,
  SciChartSurface,
  TSciChart,
} from "scichart";

export const configureAxes = (
  sciChartSurface: SciChartSurface,
  wasmContext: TSciChart,
) => {
  // Add an XAxis of type DateTimeAxis
  const xAxis = new DateTimeNumericAxis(wasmContext);
  sciChartSurface.xAxes.add(xAxis);

  // Create a NumericAxis on the YAxis with 2 Decimal Places
  const yAxis = new NumericAxis(wasmContext, {
    growBy: new NumberRange(0.1, 0.1),
    labelFormat: ENumericFormat.Decimal,
    labelPrecision: 2,
    labelPrefix: "$",
    autoRange: EAutoRange.Always,
  });
  sciChartSurface.yAxes.add(yAxis);

  return { xAxis, yAxis };
};
