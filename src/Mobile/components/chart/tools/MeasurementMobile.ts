import {
  ChartModifierBase2D,
  ModifierMouseArgs,
  Point,
  BoxAnnotation,
  ECoordinateMode,
  EAnnotationLayer,
  CustomAnnotation,
  OhlcDataSeries,
  EHorizontalAnchorPoint,
  EVerticalAnchorPoint,
  LineAnnotation,
  AxisMarkerAnnotation,
  ZoomPanModifier,
} from "scichart";
import { appTheme } from "../../../../Shared/styles/theme";
import { calculateStats } from "../../../../Desktop/components/chart/utils/ChartStats";
import { getMeasurementTooltip } from "../../../../Desktop/components/chart/props/DetailTooltip";
import {
  createAxisMarker,
  updateXAxisMarker,
  updateYAxisMarker,
} from "../../../../Desktop/components/chart/utils/Custom/AxisMarkersCustom";
import { formatDate, formatPrice } from "../../../../Desktop/utils/formatters";

interface MeasurementGroup {
  box: BoxAnnotation;
  hLine: LineAnnotation;
  vLine: LineAnnotation;
  hArrow: CustomAnnotation;
  vArrow: CustomAnnotation;
  x1Marker: AxisMarkerAnnotation;
  x2Marker: AxisMarkerAnnotation;
  y1Marker: AxisMarkerAnnotation;
  y2Marker: AxisMarkerAnnotation;
  statsTooltip: CustomAnnotation;
  deleteBtn?: CustomAnnotation;
  isBearish: boolean;
  color: string;
}

const LONG_PRESS_MS = 200;

export class MeasurementMobile extends ChartModifierBase2D {
  public type = "MeasurementMobile";

  private isDrawing = false;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private touchStartX = 0;
  private touchStartY = 0;
  private startDataX = 0;
  private startDataY = 0;

  private previewGroup: MeasurementGroup | null = null;
  private measurements: MeasurementGroup[] = [];

  private zoomPanModifier?: ZoomPanModifier;
  private wasPanEnabled = false;

  constructor(zoomPanModifier?: ZoomPanModifier) {
    super();
    this.zoomPanModifier = zoomPanModifier;
  }

  // ── Touch lifecycle ────────────────────────────────────────────────────────

  public modifierMouseDown(args: ModifierMouseArgs): void {
    super.modifierMouseDown(args);
    if (!this.isEnabled) return;

    // Check if tapping a delete button first
    if (this.handleDeleteBtnTap(args.mousePoint)) {
      args.handled = true;
      return;
    }

    this.touchStartX = args.mousePoint.x;
    this.touchStartY = args.mousePoint.y;

    this.clearLongPressTimer();
    const startX = this.touchStartX;
    const startY = this.touchStartY;

    this.longPressTimer = setTimeout(() => {
      this.startDrawing(startX, startY);
    }, LONG_PRESS_MS);
  }

  public modifierMouseMove(args: ModifierMouseArgs): void {
    super.modifierMouseMove(args);
    if (!this.isEnabled) return;

    if (!this.isDrawing && this.longPressTimer) {
      const dx = Math.abs(args.mousePoint.x - this.touchStartX);
      const dy = Math.abs(args.mousePoint.y - this.touchStartY);
      if (dx > 10 || dy > 10) {
        this.clearLongPressTimer();
      }
      return;
    }

    if (this.isDrawing && this.previewGroup) {
      this.updatePreview(args.mousePoint.x, args.mousePoint.y);
    }
  }

  public modifierMouseUp(args: ModifierMouseArgs): void {
    super.modifierMouseUp(args);
    this.clearLongPressTimer();

    if (this.isDrawing) {
      this.finalizeDrawing();
    }
  }

  public modifierMouseLeave(args: ModifierMouseArgs): void {
    super.modifierMouseLeave(args);
    this.clearLongPressTimer();
    if (this.isDrawing) {
      this.finalizeDrawing();
    }
  }

  // ── Drawing Logic ──────────────────────────────────────────────────────────

  private startDrawing(px: number, py: number): void {
    this.isDrawing = true;

    try {
      navigator?.vibrate?.(10);
    } catch (_) {}

    if (this.zoomPanModifier) {
      this.wasPanEnabled = this.zoomPanModifier.isEnabled;
      this.zoomPanModifier.isEnabled = false;
    }

    const xCalc = this.parentSurface.xAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const yCalc = this.parentSurface.yAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    this.startDataX = xCalc.getDataValue(px);
    this.startDataY = yCalc.getDataValue(py);

    this.createPreview(px, py);
  }

  private createPreview(_px: number, _py: number): void {
    const color = appTheme.VividSkyBlue;
    const dataX = this.startDataX;
    const dataY = this.startDataY;

    const group: MeasurementGroup = {
      box: new BoxAnnotation({
        xCoordinateMode: ECoordinateMode.DataValue,
        yCoordinateMode: ECoordinateMode.DataValue,
        fill: color + "33",
        stroke: color,
        strokeThickness: 1,
        x1: dataX,
        y1: dataY,
        x2: dataX,
        y2: dataY,
        annotationLayer: EAnnotationLayer.AboveChart,
      }),
      hLine: new LineAnnotation({
        xCoordinateMode: ECoordinateMode.DataValue,
        yCoordinateMode: ECoordinateMode.DataValue,
        stroke: color,
        strokeThickness: 1,
        annotationLayer: EAnnotationLayer.AboveChart,
        x1: dataX,
        y1: dataY,
        x2: dataX,
        y2: dataY,
      }),
      vLine: new LineAnnotation({
        xCoordinateMode: ECoordinateMode.DataValue,
        yCoordinateMode: ECoordinateMode.DataValue,
        stroke: color,
        strokeThickness: 1,
        annotationLayer: EAnnotationLayer.AboveChart,
        x1: dataX,
        y1: dataY,
        x2: dataX,
        y2: dataY,
      }),
      hArrow: new CustomAnnotation({
        xCoordinateMode: ECoordinateMode.Pixel,
        yCoordinateMode: ECoordinateMode.Pixel,
        x1: _px,
        y1: _py,
        verticalAnchorPoint: EVerticalAnchorPoint.Center,
        horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
        annotationLayer: EAnnotationLayer.AboveChart,
        svgString: this.getArrowSVG(color, 0),
      }),
      vArrow: new CustomAnnotation({
        xCoordinateMode: ECoordinateMode.Pixel,
        yCoordinateMode: ECoordinateMode.Pixel,
        x1: _px,
        y1: _py,
        verticalAnchorPoint: EVerticalAnchorPoint.Center,
        horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
        annotationLayer: EAnnotationLayer.AboveChart,
        svgString: this.getArrowSVG(color, 90),
      }),
      x1Marker: createAxisMarker(
        this.startDataX,
        formatDate,
        true,
        "start",
        color,
      ),
      x2Marker: createAxisMarker(
        this.startDataX,
        formatDate,
        true,
        "end",
        color,
      ),
      y1Marker: createAxisMarker(
        this.startDataY,
        formatPrice,
        false,
        "start",
        color,
      ),
      y2Marker: createAxisMarker(
        this.startDataY,
        formatPrice,
        false,
        "end",
        color,
      ),
      statsTooltip: new CustomAnnotation({
        xCoordinateMode: ECoordinateMode.DataValue,
        yCoordinateMode: ECoordinateMode.DataValue,
        x1: dataX,
        y1: dataY,
        annotationLayer: EAnnotationLayer.AboveChart,
        svgString: `<svg width="1" height="1" xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" fill="transparent"/></svg>`,
      }),
      isBearish: false,
      color,
    };

    [
      group.box,
      group.hLine,
      group.vLine,
      group.hArrow,
      group.vArrow,
      group.x1Marker,
      group.x2Marker,
      group.y1Marker,
      group.y2Marker,
      group.statsTooltip,
    ].forEach((a) => this.parentSurface.annotations.add(a));

    this.previewGroup = group;
  }

  private updatePreview(cx: number, cy: number): void {
    if (!this.previewGroup) return;

    const xCalc = this.parentSurface.xAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const yCalc = this.parentSurface.yAxes
      .get(0)
      .getCurrentCoordinateCalculator();

    // Convert current touch position to data values
    const endDataX = xCalc.getDataValue(cx);
    const endDataY = yCalc.getDataValue(cy);

    // Get pixel coords for arrow/tooltip positioning (all via getCoordinate for consistency)
    const sx = xCalc.getCoordinate(this.startDataX);
    const sy = yCalc.getCoordinate(this.startDataY);
    const ex = xCalc.getCoordinate(endDataX);
    const ey = yCalc.getCoordinate(endDataY);

    const isBearish = ey > sy;
    this.previewGroup.isBearish = isBearish;
    const color = isBearish ? appTheme.TV_Red : appTheme.VividSkyBlue;
    this.previewGroup.color = color;

    const g = this.previewGroup;

    // Box uses DataValue mode
    g.box.x1 = this.startDataX;
    g.box.y1 = this.startDataY;
    g.box.x2 = endDataX;
    g.box.y2 = endDataY;
    g.box.fill = color + "33";
    g.box.stroke = color;

    // Lines use DataValue mode
    const dataMinX = Math.min(this.startDataX, endDataX);
    const dataMaxX = Math.max(this.startDataX, endDataX);
    const dataMinY = Math.min(this.startDataY, endDataY);
    const dataMaxY = Math.max(this.startDataY, endDataY);
    const dataMidX = (this.startDataX + endDataX) / 2;
    const dataMidY = (this.startDataY + endDataY) / 2;

    g.hLine.stroke = color;
    g.hLine.x1 = dataMinX;
    g.hLine.x2 = dataMaxX;
    g.hLine.y1 = dataMidY;
    g.hLine.y2 = dataMidY;
    g.vLine.stroke = color;
    g.vLine.x1 = dataMidX;
    g.vLine.x2 = dataMidX;
    g.vLine.y1 = dataMinY;
    g.vLine.y2 = dataMaxY;

    // Arrows use Pixel mode — compute pixel positions (all from getCoordinate)
    const minX = Math.min(sx, ex);
    const maxX = Math.max(sx, ex);
    const minY = Math.min(sy, ey);
    const maxY = Math.max(sy, ey);
    const midX = (sx + ex) / 2;
    const midY = (sy + ey) / 2;
    const isRight = ex >= sx;
    const isDown = ey >= sy;

    const halfArrow = -5;
    g.hArrow.x1 = isRight ? maxX + halfArrow : minX - halfArrow;
    g.hArrow.y1 = midY;
    g.hArrow.svgString = this.getArrowSVG(color, isRight ? 0 : 180);
    g.vArrow.x1 = midX;
    g.vArrow.y1 = isDown ? maxY + halfArrow : minY - halfArrow;
    g.vArrow.svgString = this.getArrowSVG(color, isDown ? 90 : 270);

    // Axis markers use data values
    updateXAxisMarker(g.x1Marker, dataMinX, formatDate, color, "start");
    updateXAxisMarker(g.x2Marker, dataMaxX, formatDate, color, "end");
    updateYAxisMarker(g.y1Marker, dataMaxY, formatPrice, color, "start");
    updateYAxisMarker(g.y2Marker, dataMinY, formatPrice, color, "end");

    this.updateTooltip(g, minX, maxX, minY, maxY, dataMinX, dataMaxX);
  }

  private updateTooltip(
    g: MeasurementGroup,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    x1: number,
    x2: number,
  ): void {
    const series = this.parentSurface.renderableSeries.get(0);
    if (!series?.dataSeries) return;

    const stats = calculateStats(
      series.dataSeries as OhlcDataSeries,
      Math.min(x1, x2),
      Math.max(x1, x2),
    );
    if (!stats) return;

    const { x, y, vAnchor, hAnchor } = this.computeTooltipPosition(
      minX,
      maxX,
      minY,
      maxY,
    );

    // Convert pixel position to data values (tooltip uses DataValue mode)
    const xCalc = this.parentSurface.xAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const yCalc = this.parentSurface.yAxes
      .get(0)
      .getCurrentCoordinateCalculator();

    g.statsTooltip.x1 = xCalc.getDataValue(x);
    g.statsTooltip.y1 = yCalc.getDataValue(y);
    g.statsTooltip.verticalAnchorPoint = vAnchor;
    g.statsTooltip.horizontalAnchorPoint = hAnchor;
    g.statsTooltip.svgString = getMeasurementTooltip(stats, g.isBearish);
  }

  private finalizeDrawing(): void {
    if (!this.previewGroup) return;

    const xCalc = this.parentSurface.xAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const yCalc = this.parentSurface.yAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const g = this.previewGroup;

    // Box and lines are already in DataValue mode — no conversion needed

    // Arrows: convert from pixel to DataValue
    [g.hArrow, g.vArrow].forEach((ann) => {
      ann.x1 = xCalc.getDataValue(ann.x1 as number);
      ann.y1 = yCalc.getDataValue(ann.y1 as number);
      ann.xCoordinateMode = ECoordinateMode.DataValue;
      ann.yCoordinateMode = ECoordinateMode.DataValue;
    });

    // Create delete button at top-right corner of box (DataValue mode)
    const boxMaxX = Math.max(g.box.x1 as number, g.box.x2 as number);
    const boxMaxY = Math.max(g.box.y1 as number, g.box.y2 as number);
    g.deleteBtn = new CustomAnnotation({
      xCoordinateMode: ECoordinateMode.DataValue,
      yCoordinateMode: ECoordinateMode.DataValue,
      x1: boxMaxX,
      y1: boxMaxY,
      verticalAnchorPoint: EVerticalAnchorPoint.Center,
      horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
      annotationLayer: EAnnotationLayer.AboveChart,
      svgString: this.getDeleteBtnSVG(),
    });
    this.parentSurface.annotations.add(g.deleteBtn);

    this.measurements.push(g);
    this.previewGroup = null;
    this.isDrawing = false;

    if (this.zoomPanModifier && this.wasPanEnabled) {
      this.zoomPanModifier.isEnabled = true;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private getArrowSVG(color: string, rotation: number): string {
    return `<svg width="10" height="10" overflow="visible" viewBox="0 0 10 10">
      <polygon points="0,0 10,5 0,10" fill="${color}" transform="rotate(${rotation} 5 5)"/>
    </svg>`;
  }

  private getDeleteBtnSVG(): string {
    return `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" fill="#1a1a2e" stroke="#666" stroke-width="1.5"/>
      <line x1="6" y1="6" x2="14" y2="14" stroke="#ff4444" stroke-width="2" stroke-linecap="round"/>
      <line x1="14" y1="6" x2="6" y2="14" stroke="#ff4444" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  private handleDeleteBtnTap(point: Point): boolean {
    const xCalc = this.parentSurface.xAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const yCalc = this.parentSurface.yAxes
      .get(0)
      .getCurrentCoordinateCalculator();

    for (let i = this.measurements.length - 1; i >= 0; i--) {
      const group = this.measurements[i];
      if (!group.deleteBtn) continue;

      // Convert button data position to pixel for hit detection
      const bx = xCalc.getCoordinate(group.deleteBtn.x1 as number);
      const by = yCalc.getCoordinate(group.deleteBtn.y1 as number);
      const HIT = 20; // larger hit area for touch

      if (
        point.x >= bx - HIT &&
        point.x <= bx + HIT &&
        point.y >= by - HIT &&
        point.y <= by + HIT
      ) {
        this.removeGroup(group);
        this.measurements.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  private computeTooltipPosition(
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
  ): {
    x: number;
    y: number;
    vAnchor: EVerticalAnchorPoint;
    hAnchor: EHorizontalAnchorPoint;
  } {
    const rect = this.parentSurface.seriesViewRect;
    const TOOLTIP_H = 80;
    const TOOLTIP_W = 170;
    const GAP = 6;

    let x = minX + (maxX - minX) / 2;
    let y = minY - GAP;
    let vAnchor = EVerticalAnchorPoint.Bottom;
    let hAnchor = EHorizontalAnchorPoint.Center;

    if (minY - TOOLTIP_H < rect.top) {
      y = maxY + GAP;
      vAnchor = EVerticalAnchorPoint.Top;
    }

    if (x - TOOLTIP_W / 2 < rect.left) {
      x = minX;
      hAnchor = EHorizontalAnchorPoint.Left;
    } else if (x + TOOLTIP_W / 2 > rect.right) {
      x = maxX;
      hAnchor = EHorizontalAnchorPoint.Right;
    }

    return { x, y, vAnchor, hAnchor };
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  public onDetach(): void {
    this.clearLongPressTimer();
    this.measurements.forEach((g) => this.removeGroup(g));
    if (this.previewGroup) this.removeGroup(this.previewGroup);
    super.onDetach();
  }

  private removeGroup(g: MeasurementGroup): void {
    const annotations: (
      | BoxAnnotation
      | LineAnnotation
      | CustomAnnotation
      | AxisMarkerAnnotation
      | undefined
    )[] = [
      g.box,
      g.hLine,
      g.vLine,
      g.hArrow,
      g.vArrow,
      g.x1Marker,
      g.x2Marker,
      g.y1Marker,
      g.y2Marker,
      g.statsTooltip,
      g.deleteBtn,
    ];
    annotations.forEach((a) => {
      if (!a) return;
      try {
        this.parentSurface.annotations.remove(a);
      } catch (_) {}
    });
  }
}
