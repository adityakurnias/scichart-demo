import {
  SciChartSurface,
  AxisBase2D,
  BoxAnnotation,
  AxisMarkerAnnotation,
  ECoordinateMode,
  EAnnotationLayer,
} from "scichart";
import { appTheme } from "../../../styles/theme";
import { calculateCenter } from "../../../utils/calculateCenter";
import { formatDate, formatPrice } from "../../../utils/formatters";
import { createAxisMarker } from "../utils/axisMarkers";

export const addBoxAnnotation = (
  sciChartSurface: SciChartSurface,
  xAxis: AxisBase2D,
) => {
  const yAxis = sciChartSurface.yAxes.get(0);

  const xRange = xAxis.visibleRange;
  const yRange = yAxis.visibleRange;

  const { x1, x2, y1, y2 } = calculateCenter(xRange, yRange);

  const boxAnnotation = new BoxAnnotation({
    xCoordinateMode: ECoordinateMode.DataValue,
    yCoordinateMode: ECoordinateMode.DataValue,
    fill: appTheme.VividPurple + "33",
    stroke: appTheme.VividPurple,
    strokeThickness: 1,
    x1,
    y1,
    x2,
    y2,
    isEditable: true,
    annotationLayer: EAnnotationLayer.AboveChart,
  });

  const y1Marker = createAxisMarker(y1, formatPrice);
  const y2Marker = createAxisMarker(y2, formatPrice);
  const x1Marker = createAxisMarker(x1, formatDate);
  const x2Marker = createAxisMarker(x2, formatDate);

  const updateMarkers = () => {
    y1Marker.y1 = boxAnnotation.y1;
    y1Marker.formattedValue = formatPrice(boxAnnotation.y1);

    y2Marker.y1 = boxAnnotation.y2;
    y2Marker.formattedValue = formatPrice(boxAnnotation.y2);

    x1Marker.x1 = boxAnnotation.x1;
    x1Marker.formattedValue = formatDate(boxAnnotation.x1);

    x2Marker.x1 = boxAnnotation.x2;
    x2Marker.formattedValue = formatDate(boxAnnotation.x2);
  };

  const onSelected = () => {
    const markers = (boxAnnotation as any).markers as AxisMarkerAnnotation[];
    if (markers) {
      markers.forEach((m) => (m.isHidden = !boxAnnotation.isSelected));
    }
  };

  boxAnnotation.dragDelta.subscribe(updateMarkers);
  boxAnnotation.selectedChanged.subscribe(onSelected);

  (boxAnnotation as any).markers = [x1Marker, x2Marker, y1Marker, y2Marker];

  sciChartSurface.annotations.add(boxAnnotation);
  sciChartSurface.annotations.add(y1Marker);
  sciChartSurface.annotations.add(y2Marker);
  sciChartSurface.annotations.add(x1Marker);
  sciChartSurface.annotations.add(x2Marker);

  return {
    boxAnnotation,
    markers: {
      y1Marker,
      y2Marker,
      x1Marker,
      x2Marker,
    },
  };
};
