import {
  ChartModifierBase2D,
  ModifierMouseArgs,
  Point,
  EExecuteOn,
  BoxAnnotation,
  ECoordinateMode,
  EAnnotationLayer,
  CustomAnnotation,
  OhlcDataSeries,
  EHorizontalAnchorPoint,
  EVerticalAnchorPoint,
  LineAnnotation,
  AxisMarkerAnnotation,
} from "scichart";
import { appTheme } from "../../../styles/theme";
import { calculateStats } from "../utils/ChartStats";
import { getMeasurementTooltip } from "../templates/DetailTooltip";
import { createAxisMarker } from "../utils/AxisMarkers";
import { formatDate, formatPrice } from "../../../utils/formatters";

export class Measurment extends ChartModifierBase2D {
  public type = "Measurment";
  private startPoint: Point | undefined;

  private activeBox: BoxAnnotation | undefined;
  private statsTooltip: CustomAnnotation | undefined;
  private hLine: LineAnnotation | undefined;
  private vLine: LineAnnotation | undefined;

  private hArrow: CustomAnnotation | undefined;
  private vArrow: CustomAnnotation | undefined;

  private x1Marker: AxisMarkerAnnotation | undefined;
  private x2Marker: AxisMarkerAnnotation | undefined;
  private y1Marker: AxisMarkerAnnotation | undefined;
  private y2Marker: AxisMarkerAnnotation | undefined;

  constructor() {
    super();
  }

  public modifierMouseDown(args: ModifierMouseArgs): void {
    super.modifierMouseDown(args);

    if (this.isEnabled && args.mousePoint) {
      this.startPoint = args.mousePoint;
      this.clearSelection();

      const themeColor = appTheme.VividSkyBlue;
      const sx = this.startPoint.x;
      const sy = this.startPoint.y;

      this.activeBox = new BoxAnnotation({
        xCoordinateMode: ECoordinateMode.Pixel,
        yCoordinateMode: ECoordinateMode.Pixel,
        fill: themeColor + "33",
        stroke: themeColor,
        strokeThickness: 1,
        x1: sx,
        y1: sy,
        x2: sx,
        y2: sy,
        annotationLayer: EAnnotationLayer.AboveChart,
      });

      this.hLine = new LineAnnotation({
        xCoordinateMode: ECoordinateMode.Pixel,
        yCoordinateMode: ECoordinateMode.Pixel,
        stroke: themeColor,
        strokeThickness: 1,
        annotationLayer: EAnnotationLayer.AboveChart,
      });

      this.vLine = new LineAnnotation({
        xCoordinateMode: ECoordinateMode.Pixel,
        yCoordinateMode: ECoordinateMode.Pixel,
        stroke: themeColor,
        strokeThickness: 1,
        annotationLayer: EAnnotationLayer.AboveChart,
      });

      // Set posisi awal arrow agar tidak muncul di (0,0)
      this.hArrow = new CustomAnnotation({
        xCoordinateMode: ECoordinateMode.Pixel,
        yCoordinateMode: ECoordinateMode.Pixel,
        x1: sx,
        y1: sy,
        verticalAnchorPoint: EVerticalAnchorPoint.Center,
        horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
        annotationLayer: EAnnotationLayer.AboveChart,
        svgString: this.getArrowSVG(themeColor, 0),
      });

      this.vArrow = new CustomAnnotation({
        xCoordinateMode: ECoordinateMode.Pixel,
        yCoordinateMode: ECoordinateMode.Pixel,
        x1: sx,
        y1: sy,
        verticalAnchorPoint: EVerticalAnchorPoint.Center,
        horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
        annotationLayer: EAnnotationLayer.AboveChart,
        svgString: this.getArrowSVG(themeColor, 90),
      });

      const xCalc = this.parentSurface.xAxes
        .get(0)
        .getCurrentCoordinateCalculator();
      const yCalc = this.parentSurface.yAxes
        .get(0)
        .getCurrentCoordinateCalculator();

      const xVal = xCalc.getDataValue(sx);
      const yVal = yCalc.getDataValue(sy);

      this.x1Marker = createAxisMarker(xVal, formatDate, true);
      this.x2Marker = createAxisMarker(xVal, formatDate, true);
      this.y1Marker = createAxisMarker(yVal, formatPrice, false);
      this.y2Marker = createAxisMarker(yVal, formatPrice, false);

      this.parentSurface.annotations.add(this.activeBox);
      this.parentSurface.annotations.add(this.hLine);
      this.parentSurface.annotations.add(this.vLine);
      this.parentSurface.annotations.add(this.hArrow);
      this.parentSurface.annotations.add(this.vArrow);

      this.parentSurface.annotations.add(this.x1Marker);
      this.parentSurface.annotations.add(this.x2Marker);
      this.parentSurface.annotations.add(this.y1Marker);
      this.parentSurface.annotations.add(this.y2Marker);
    }
  }

  public modifierMouseMove(args: ModifierMouseArgs): void {
    super.modifierMouseMove(args);

    if (
      this.startPoint &&
      this.activeBox &&
      this.hLine &&
      this.vLine &&
      this.hArrow &&
      this.vArrow
    ) {
      const sx = this.startPoint.x;
      const sy = this.startPoint.y;
      const cx = args.mousePoint.x;
      const cy = args.mousePoint.y;

      this.activeBox.x2 = cx;
      this.activeBox.y2 = cy;

      const minX = Math.min(sx, cx);
      const maxX = Math.max(sx, cx);
      const minY = Math.min(sy, cy);
      const maxY = Math.max(sy, cy);

      const midX = minX + (maxX - minX) / 2;
      const midY = minY + (maxY - minY) / 2;

      const isRight = cx >= sx;
      const isDown = cy >= sy;

      this.hLine.x1 = minX;
      this.hLine.x2 = maxX;
      this.hLine.y1 = midY;
      this.hLine.y2 = midY;

      this.vLine.x1 = midX;
      this.vLine.x2 = midX;
      this.vLine.y1 = minY;
      this.vLine.y2 = maxY;

      const themeColor = appTheme.VividSkyBlue;
      const arrowSize = -10;
      const halfArrow = arrowSize / 2;

      this.hArrow.x1 = isRight ? maxX + halfArrow : minX - halfArrow;
      this.hArrow.y1 = midY;

      const hRot = isRight ? 0 : 180;
      this.hArrow.svgString = this.getArrowSVG(themeColor, hRot);

      this.vArrow.x1 = midX;
      this.vArrow.y1 = isDown ? maxY + halfArrow : minY - halfArrow;

      const vRot = isDown ? 90 : 270;
      this.vArrow.svgString = this.getArrowSVG(themeColor, vRot);

      const xCalc = this.parentSurface.xAxes
        .get(0)
        .getCurrentCoordinateCalculator();
      const yCalc = this.parentSurface.yAxes
        .get(0)
        .getCurrentCoordinateCalculator();

      const x1Val = xCalc.getDataValue(minX);
      const x2Val = xCalc.getDataValue(maxX);
      const y1Val = yCalc.getDataValue(minY);
      const y2Val = yCalc.getDataValue(maxY);

      if (this.x1Marker && this.x2Marker && this.y1Marker && this.y2Marker) {
        this.x1Marker.x1 = x1Val;
        this.x1Marker.formattedValue = formatDate(x1Val);
        this.x2Marker.x1 = x2Val;
        this.x2Marker.formattedValue = formatDate(x2Val);
        this.y1Marker.y1 = y1Val;
        this.y1Marker.formattedValue = formatPrice(y1Val);
        this.y2Marker.y1 = y2Val;
        this.y2Marker.formattedValue = formatPrice(y2Val);
      }

      this.updateSmartTooltip(this.activeBox);
    }

    if (!this.startPoint && this.activeBox) {
      this.updateSmartTooltip(this.activeBox);
    }
  }

  public modifierMouseUp(args: ModifierMouseArgs): void {
    super.modifierMouseUp(args);

    if (this.startPoint) {
      const dist = Math.sqrt(
        Math.pow(args.mousePoint.x - this.startPoint.x, 2) +
          Math.pow(args.mousePoint.y - this.startPoint.y, 2),
      );

      if (dist < 20 && this.activeBox) {
        this.clearSelection();
        this.updateSmartTooltip(undefined, args.mousePoint);
      } else if (this.activeBox) {
        const xCalc = this.parentSurface.xAxes
          .get(0)
          .getCurrentCoordinateCalculator();
        const yCalc = this.parentSurface.yAxes
          .get(0)
          .getCurrentCoordinateCalculator();

        const toDataX = (pix: number) => xCalc.getDataValue(pix);
        const toDataY = (pix: number) => yCalc.getDataValue(pix);

        [this.activeBox, this.hLine, this.vLine].forEach((ann) => {
          if (ann) {
            ann.x1 = toDataX(ann.x1);
            ann.x2 = toDataX(ann.x2);
            ann.y1 = toDataY(ann.y1);
            ann.y2 = toDataY(ann.y2);
            ann.xCoordinateMode = ECoordinateMode.DataValue;
            ann.yCoordinateMode = ECoordinateMode.DataValue;
          }
        });

        [this.hArrow, this.vArrow].forEach((ann) => {
          if (ann) {
            ann.x1 = toDataX(ann.x1);
            ann.y1 = toDataY(ann.y1);
            ann.xCoordinateMode = ECoordinateMode.DataValue;
            ann.yCoordinateMode = ECoordinateMode.DataValue;
          }
        });

        this.updateSmartTooltip(this.activeBox);

        const box = this.activeBox;
        const x1M = this.x1Marker;
        const x2M = this.x2Marker;
        const y1M = this.y1Marker;
        const y2M = this.y2Marker;

        if (box && x1M && x2M && y1M && y2M) {
          const updateMarkers = () => {
            x1M.x1 = box.x1;
            x1M.formattedValue = formatDate(box.x1);
            x2M.x1 = box.x2;
            x2M.formattedValue = formatDate(box.x2);
            y1M.y1 = box.y1;
            y1M.formattedValue = formatPrice(box.y1);
            y2M.y1 = box.y2;
            y2M.formattedValue = formatPrice(box.y2);
          };

          const onSelected = () => {
            [x1M, x2M, y1M, y2M].forEach((m) => (m.isHidden = !box.isSelected));
          };

          box.dragDelta.subscribe(updateMarkers);
          box.selectedChanged.subscribe(onSelected);
        }
      }

      this.startPoint = undefined;
    }
  }

  private clearSelection() {
    if (this.activeBox) this.parentSurface.annotations.remove(this.activeBox);
    if (this.hLine) this.parentSurface.annotations.remove(this.hLine);
    if (this.vLine) this.parentSurface.annotations.remove(this.vLine);
    if (this.hArrow) this.parentSurface.annotations.remove(this.hArrow);
    if (this.vArrow) this.parentSurface.annotations.remove(this.vArrow);
    if (this.x1Marker) this.parentSurface.annotations.remove(this.x1Marker);
    if (this.x2Marker) this.parentSurface.annotations.remove(this.x2Marker);
    if (this.y1Marker) this.parentSurface.annotations.remove(this.y1Marker);
    if (this.y2Marker) this.parentSurface.annotations.remove(this.y2Marker);
    if (this.statsTooltip)
      this.parentSurface.annotations.remove(this.statsTooltip);

    this.activeBox = undefined;
    this.hLine = undefined;
    this.vLine = undefined;
    this.hArrow = undefined;
    this.vArrow = undefined;
    this.x1Marker = undefined;
    this.x2Marker = undefined;
    this.y1Marker = undefined;
    this.y2Marker = undefined;
    this.statsTooltip = undefined;
  }

  private updateSmartTooltip(
    box: BoxAnnotation | undefined,
    fallbackPoint?: Point,
  ) {
    if (!box && !fallbackPoint) return;

    const xCalc = this.parentSurface.xAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const yCalc = this.parentSurface.yAxes
      .get(0)
      .getCurrentCoordinateCalculator();

    let x1Data, x2Data, x1Pix, x2Pix, y1Pix, y2Pix;

    if (box) {
      if (box.xCoordinateMode === ECoordinateMode.DataValue) {
        x1Data = box.x1;
        x2Data = box.x2;
        x1Pix = xCalc.getCoordinate(x1Data);
        x2Pix = xCalc.getCoordinate(x2Data);
        y1Pix = yCalc.getCoordinate(box.y1);
        y2Pix = yCalc.getCoordinate(box.y2);
      } else {
        x1Pix = box.x1;
        x2Pix = box.x2;
        y1Pix = box.y1;
        y2Pix = box.y2;
        x1Data = xCalc.getDataValue(x1Pix);
        x2Data = xCalc.getDataValue(x2Pix);
      }
    } else if (fallbackPoint) {
      x1Pix = x2Pix = fallbackPoint.x;
      y1Pix = y2Pix = fallbackPoint.y;
      x1Data = x2Data = xCalc.getDataValue(fallbackPoint.x);
    }

    const minX = Math.min(x1Pix, x2Pix);
    const maxX = Math.max(x1Pix, x2Pix);
    const minY = Math.min(y1Pix, y2Pix);
    const maxY = Math.max(y1Pix, y2Pix);

    let targetX = minX + (maxX - minX) / 2;
    let targetY = minY;

    let vAnchor = EVerticalAnchorPoint.Bottom;
    let hAnchor = EHorizontalAnchorPoint.Center;

    const viewWidth = this.parentSurface.seriesViewRect.width;

    const tooltipEstHeight = 60;
    const tooltipEstHalfWidth = 100;

    if (targetY - tooltipEstHeight < 0) {
      targetY = maxY;
      vAnchor = EVerticalAnchorPoint.Top;
    }
    if (targetX - tooltipEstHalfWidth < 0) {
      targetX = minX;
      hAnchor = EHorizontalAnchorPoint.Left;
    } else if (targetX + tooltipEstHalfWidth > viewWidth) {
      targetX = maxX;
      hAnchor = EHorizontalAnchorPoint.Right;
    }

    const renderableSeries = this.parentSurface.renderableSeries.get(0);
    if (!renderableSeries || !renderableSeries.dataSeries) return;

    const stats = calculateStats(
      renderableSeries.dataSeries as OhlcDataSeries,
      Math.min(x1Data, x2Data),
      Math.max(x1Data, x2Data),
    );
    if (!stats) return;

    const yPadding = vAnchor === EVerticalAnchorPoint.Bottom ? 5 : -5;

    if (!this.statsTooltip) {
      this.statsTooltip = new CustomAnnotation({
        xCoordinateMode: ECoordinateMode.Pixel,
        yCoordinateMode: ECoordinateMode.Pixel,
        x1: targetX,
        y1: targetY - yPadding,
        verticalAnchorPoint: vAnchor,
        horizontalAnchorPoint: hAnchor,
        svgString: getMeasurementTooltip(stats),
        annotationLayer: EAnnotationLayer.AboveChart,
      });
      this.parentSurface.annotations.add(this.statsTooltip);
    } else {
      this.statsTooltip.x1 = targetX;
      this.statsTooltip.y1 = targetY - yPadding;
      this.statsTooltip.verticalAnchorPoint = vAnchor;
      this.statsTooltip.horizontalAnchorPoint = hAnchor;
      this.statsTooltip.svgString = getMeasurementTooltip(stats);
    }
  }

  private getArrowSVG(color: string, rotation: number): string {
    return `<svg width="10" height="10" overflow="visible" viewBox="0 0 10 10">
    <polygon points="0,0 10,5 0,10" fill="${color}" 
      transform="rotate(${rotation} 5 5)"/>
  </svg>`;
  }
}
