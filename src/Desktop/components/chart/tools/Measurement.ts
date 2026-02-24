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
} from "scichart";
import { appTheme } from "../../../../Shared/styles/theme";
import { calculateStats } from "../utils/ChartStats";
import { getMeasurementTooltip } from "../props/DetailTooltip";
import {
  createAxisMarker,
  updateXAxisMarker,
  updateYAxisMarker,
} from "../utils/Custom/AxisMarkersCustom";
import { formatDate, formatPrice } from "../../../utils/formatters";

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
  deleteBtn: CustomAnnotation;
  isBearish: boolean;
  color: string;
}

type DrawingState = "idle" | "placing_end";

export class Measurment extends ChartModifierBase2D {
  public type = "Measurment";

  private drawingState: DrawingState = "idle";
  private startDataX: number | undefined;
  private startDataY: number | undefined;

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

  private isBearish: boolean = false;
  private measurements: MeasurementGroup[] = [];

  // Subscription token untuk visibleRangeChanged
  private rangeSubscription: (() => void) | undefined;

  constructor() {
    super();
  }

  // ── Called by SciChart when modifier is attached to a surface ─────────────────
  public onAttach(): void {
    super.onAttach();
    const xAxis = this.parentSurface.xAxes.get(0);
    const handler = () => {
      this.repositionAllGroups();
    };
    xAxis.visibleRangeChanged.subscribe(handler);
    this.rangeSubscription = () =>
      xAxis.visibleRangeChanged.unsubscribe(handler);
  }

  private getDragColor(isBearish: boolean): string {
    return isBearish ? appTheme.TV_Red : appTheme.VividSkyBlue;
  }

  private repositionAllGroups() {
    for (const group of this.measurements) {
      this.repositionTooltip(group.statsTooltip, group.box, group.isBearish);
      group.deleteBtn.isHidden = true;
    }
  }

  public modifierMouseDown(args: ModifierMouseArgs): void {
    super.modifierMouseDown(args);
    if (!this.isEnabled || !args.mousePoint) return;

    if (this.handleDeleteBtnClick(args.mousePoint)) {
      args.handled = true;
      return;
    }

    const xCalc = this.parentSurface.xAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const yCalc = this.parentSurface.yAxes
      .get(0)
      .getCurrentCoordinateCalculator();

    if (this.drawingState === "idle") {
      this.startDataX = xCalc.getDataValue(args.mousePoint.x);
      this.startDataY = yCalc.getDataValue(args.mousePoint.y);
      this.isBearish = false;
      this.drawingState = "placing_end";
      this.clearActive();
      this.createActiveAnnotations(args.mousePoint.x, args.mousePoint.y);
      args.handled = true;
    } else if (this.drawingState === "placing_end") {
      const sx = xCalc.getCoordinate(this.startDataX!);
      const sy = yCalc.getCoordinate(this.startDataY!);
      const dist = Math.sqrt(
        Math.pow(args.mousePoint.x - sx, 2) +
          Math.pow(args.mousePoint.y - sy, 2),
      );

      if (dist < 10) {
        this.clearActive();
        this.drawingState = "idle";
        this.startDataX = undefined;
        this.startDataY = undefined;
        return;
      }

      this.updateActiveAnnotations(args.mousePoint.x, args.mousePoint.y);
      this.finalizeAnnotations();
      this.drawingState = "idle";
      this.startDataX = undefined;
      this.startDataY = undefined;
      args.handled = true;
    }
  }

  public modifierMouseUp(args: ModifierMouseArgs): void {
    super.modifierMouseUp(args);
  }

  public modifierMouseMove(args: ModifierMouseArgs): void {
    super.modifierMouseMove(args);

    if (this.drawingState === "placing_end" && this.startDataX !== undefined) {
      this.updateActiveAnnotations(args.mousePoint.x, args.mousePoint.y);
    }

    this.updateDeleteBtnVisibility(args.mousePoint);
  }

  private handleDeleteBtnClick(point: Point): boolean {
    for (let i = this.measurements.length - 1; i >= 0; i--) {
      const group = this.measurements[i];
      if (group.deleteBtn.isHidden) continue;

      // deleteBtn.x1/y1 are pixel coords we set in updateDeleteBtnVisibility
      const bx = group.deleteBtn.x1 as number;
      const by = group.deleteBtn.y1 as number;
      const HIT = 14; // half hit-box size in pixels

      if (
        point.x >= bx - HIT &&
        point.x <= bx + HIT &&
        point.y >= by - HIT &&
        point.y <= by + HIT
      ) {
        this.removeMeasurementGroup(group);
        this.measurements.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  private updateDeleteBtnVisibility(point: Point) {
    for (const group of this.measurements) {
      const xCalc = this.parentSurface.xAxes
        .get(0)
        .getCurrentCoordinateCalculator();
      const yCalc = this.parentSurface.yAxes
        .get(0)
        .getCurrentCoordinateCalculator();

      const x1Pix = xCalc.getCoordinate(group.box.x1);
      const x2Pix = xCalc.getCoordinate(group.box.x2);
      const y1Pix = yCalc.getCoordinate(group.box.y1);
      const y2Pix = yCalc.getCoordinate(group.box.y2);

      const minX = Math.min(x1Pix, x2Pix);
      const maxX = Math.max(x1Pix, x2Pix);
      const minY = Math.min(y1Pix, y2Pix);
      const maxY = Math.max(y1Pix, y2Pix);

      const isHovered =
        point.x >= minX &&
        point.x <= maxX &&
        point.y >= minY &&
        point.y <= maxY;

      group.deleteBtn.isHidden = !isHovered;

      if (isHovered) {
        group.deleteBtn.x1 = maxX - 16;
        group.deleteBtn.y1 = minY + 16;
      }
    }
  }

  public deleteSelected(): void {
    const idx = this.measurements.findIndex((m) => m.box.isSelected);
    if (idx !== -1) {
      this.removeMeasurementGroup(this.measurements[idx]);
      this.measurements.splice(idx, 1);
    }
  }

  public cancelDrawing(): void {
    this.clearActive();
    this.drawingState = "idle";
    this.startDataX = undefined;
    this.startDataY = undefined;
  }

  private createActiveAnnotations(sx: number, sy: number) {
    const color = this.getDragColor(false);

    this.activeBox = new BoxAnnotation({
      xCoordinateMode: ECoordinateMode.Pixel,
      yCoordinateMode: ECoordinateMode.Pixel,
      fill: color + "33",
      stroke: color,
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
      stroke: color,
      strokeThickness: 1,
      annotationLayer: EAnnotationLayer.AboveChart,
      x1: sx,
      y1: sy,
      x2: sx,
      y2: sy,
    });

    this.vLine = new LineAnnotation({
      xCoordinateMode: ECoordinateMode.Pixel,
      yCoordinateMode: ECoordinateMode.Pixel,
      stroke: color,
      strokeThickness: 1,
      annotationLayer: EAnnotationLayer.AboveChart,
      x1: sx,
      y1: sy,
      x2: sx,
      y2: sy,
    });

    this.hArrow = new CustomAnnotation({
      xCoordinateMode: ECoordinateMode.Pixel,
      yCoordinateMode: ECoordinateMode.Pixel,
      x1: sx,
      y1: sy,
      verticalAnchorPoint: EVerticalAnchorPoint.Center,
      horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
      annotationLayer: EAnnotationLayer.AboveChart,
      svgString: this.getArrowSVG(color, 0),
    });

    this.vArrow = new CustomAnnotation({
      xCoordinateMode: ECoordinateMode.Pixel,
      yCoordinateMode: ECoordinateMode.Pixel,
      x1: sx,
      y1: sy,
      verticalAnchorPoint: EVerticalAnchorPoint.Center,
      horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
      annotationLayer: EAnnotationLayer.AboveChart,
      svgString: this.getArrowSVG(color, 90),
    });

    this.x1Marker = createAxisMarker(
      this.startDataX!,
      formatDate,
      true,
      "start",
      color,
    );
    this.x2Marker = createAxisMarker(
      this.startDataX!,
      formatDate,
      true,
      "end",
      color,
    );
    this.y1Marker = createAxisMarker(
      this.startDataY!,
      formatPrice,
      false,
      "start",
      color,
    );
    this.y2Marker = createAxisMarker(
      this.startDataY!,
      formatPrice,
      false,
      "end",
      color,
    );

    [
      this.activeBox,
      this.hLine,
      this.vLine,
      this.hArrow,
      this.vArrow,
      this.x1Marker,
      this.x2Marker,
      this.y1Marker,
      this.y2Marker,
    ].forEach((a) => this.parentSurface.annotations.add(a!));
  }

  private updateActiveAnnotations(cx: number, cy: number) {
    const xCalc = this.parentSurface.xAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const yCalc = this.parentSurface.yAxes
      .get(0)
      .getCurrentCoordinateCalculator();

    const sx = xCalc.getCoordinate(this.startDataX!);
    const sy = yCalc.getCoordinate(this.startDataY!);

    const isBearish = cy > sy;
    this.isBearish = isBearish;
    const color = this.getDragColor(isBearish);

    this.activeBox!.x1 = sx;
    this.activeBox!.y1 = sy;
    this.activeBox!.x2 = cx;
    this.activeBox!.y2 = cy;
    this.activeBox!.fill = color + "33";
    this.activeBox!.stroke = color;

    const minX = Math.min(sx, cx);
    const maxX = Math.max(sx, cx);
    const minY = Math.min(sy, cy);
    const maxY = Math.max(sy, cy);
    const midX = minX + (maxX - minX) / 2;
    const midY = minY + (maxY - minY) / 2;
    const isRight = cx >= sx;
    const isDown = cy >= sy;

    this.hLine!.stroke = color;
    this.hLine!.x1 = minX;
    this.hLine!.x2 = maxX;
    this.hLine!.y1 = midY;
    this.hLine!.y2 = midY;

    this.vLine!.stroke = color;
    this.vLine!.x1 = midX;
    this.vLine!.x2 = midX;
    this.vLine!.y1 = minY;
    this.vLine!.y2 = maxY;

    const halfArrow = -5;
    this.hArrow!.x1 = isRight ? maxX + halfArrow : minX - halfArrow;
    this.hArrow!.y1 = midY;
    this.hArrow!.svgString = this.getArrowSVG(color, isRight ? 0 : 180);

    this.vArrow!.x1 = midX;
    this.vArrow!.y1 = isDown ? maxY + halfArrow : minY - halfArrow;
    this.vArrow!.svgString = this.getArrowSVG(color, isDown ? 90 : 270);

    updateXAxisMarker(
      this.x1Marker!,
      xCalc.getDataValue(minX),
      formatDate,
      color,
      "start",
    );
    updateXAxisMarker(
      this.x2Marker!,
      xCalc.getDataValue(maxX),
      formatDate,
      color,
      "end",
    );
    updateYAxisMarker(
      this.y1Marker!,
      yCalc.getDataValue(minY),
      formatPrice,
      color,
      "start",
    );
    updateYAxisMarker(
      this.y2Marker!,
      yCalc.getDataValue(maxY),
      formatPrice,
      color,
      "end",
    );

    this.updateActiveTooltip(
      minX,
      maxX,
      minY,
      maxY,
      xCalc.getDataValue(minX),
      xCalc.getDataValue(maxX),
      isBearish,
    );
  }

  private updateActiveTooltip(
    minXPix: number,
    maxXPix: number,
    minYPix: number,
    maxYPix: number,
    x1Data: number,
    x2Data: number,
    isBearish: boolean,
  ) {
    const renderableSeries = this.parentSurface.renderableSeries.get(0);
    if (!renderableSeries?.dataSeries) return;

    const stats = calculateStats(
      renderableSeries.dataSeries as OhlcDataSeries,
      Math.min(x1Data, x2Data),
      Math.max(x1Data, x2Data),
    );
    if (!stats) return;

    const { x, y, vAnchor, hAnchor } = this.computeTooltipPosition(
      minXPix,
      maxXPix,
      minYPix,
      maxYPix,
    );

    if (!this.statsTooltip) {
      this.statsTooltip = new CustomAnnotation({
        xCoordinateMode: ECoordinateMode.Pixel,
        yCoordinateMode: ECoordinateMode.Pixel,
        x1: x,
        y1: y,
        verticalAnchorPoint: vAnchor,
        horizontalAnchorPoint: hAnchor,
        svgString: getMeasurementTooltip(stats, isBearish),
        annotationLayer: EAnnotationLayer.AboveChart,
      });
      this.parentSurface.annotations.add(this.statsTooltip);
    } else {
      this.statsTooltip.x1 = x;
      this.statsTooltip.y1 = y;
      this.statsTooltip.verticalAnchorPoint = vAnchor;
      this.statsTooltip.horizontalAnchorPoint = hAnchor;
      this.statsTooltip.svgString = getMeasurementTooltip(stats, isBearish);
    }
  }

  private finalizeAnnotations() {
    if (!this.activeBox || this.startDataX === undefined) return;

    const xCalc = this.parentSurface.xAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const yCalc = this.parentSurface.yAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const toDataX = (pix: number) => xCalc.getDataValue(pix);
    const toDataY = (pix: number) => yCalc.getDataValue(pix);

    [this.activeBox, this.hLine, this.vLine].forEach((ann) => {
      if (!ann) return;
      ann.x1 = toDataX(ann.x1);
      ann.x2 = toDataX(ann.x2);
      ann.y1 = toDataY(ann.y1);
      ann.y2 = toDataY(ann.y2);
      ann.xCoordinateMode = ECoordinateMode.DataValue;
      ann.yCoordinateMode = ECoordinateMode.DataValue;
    });

    [this.hArrow, this.vArrow].forEach((ann) => {
      if (!ann) return;
      ann.x1 = toDataX(ann.x1);
      ann.y1 = toDataY(ann.y1);
      ann.xCoordinateMode = ECoordinateMode.DataValue;
      ann.yCoordinateMode = ECoordinateMode.DataValue;
    });

    if (this.statsTooltip) {
      this.parentSurface.annotations.remove(this.statsTooltip);
      this.statsTooltip = undefined;
    }

    const isBearish = this.isBearish;
    const color = this.getDragColor(isBearish);

    // Build tooltip from finalized DataValue box
    const finalTooltip = this.buildTooltipForBox(this.activeBox!, isBearish);
    const deleteBtn = this.buildDeleteBtn(this.activeBox!);

    const group: MeasurementGroup = {
      box: this.activeBox!,
      hLine: this.hLine!,
      vLine: this.vLine!,
      hArrow: this.hArrow!,
      vArrow: this.vArrow!,
      x1Marker: this.x1Marker!,
      x2Marker: this.x2Marker!,
      y1Marker: this.y1Marker!,
      y2Marker: this.y2Marker!,
      statsTooltip: finalTooltip,
      deleteBtn,
      isBearish,
      color,
    };

    this.parentSurface.annotations.add(finalTooltip);
    this.parentSurface.annotations.add(deleteBtn);

    // On box drag: update axis markers + reposition tooltip
    group.box.dragDelta.subscribe(() => {
      const {
        box,
        x1Marker,
        x2Marker,
        y1Marker,
        y2Marker,
        statsTooltip: tip,
        isBearish: bear,
        color: c,
      } = group;
      updateXAxisMarker(x1Marker, box.x1, formatDate, c, "start");
      updateXAxisMarker(x2Marker, box.x2, formatDate, c, "end");
      updateYAxisMarker(y1Marker, box.y1, formatPrice, c, "start");
      updateYAxisMarker(y2Marker, box.y2, formatPrice, c, "end");
      this.repositionTooltip(tip, box, bear);
    });

    group.box.selectedChanged.subscribe(() => {
      const { box } = group;
      const cb = (this.parentSurface as any).__onAnnotationSelected;
      if (cb) {
        if (box.isSelected) {
          const xc = this.parentSurface.xAxes
            .get(0)
            .getCurrentCoordinateCalculator();
          const yc = this.parentSurface.yAxes
            .get(0)
            .getCurrentCoordinateCalculator();
          const px = (xc.getCoordinate(box.x1) + xc.getCoordinate(box.x2)) / 2;
          const py = Math.min(
            yc.getCoordinate(box.y1),
            yc.getCoordinate(box.y2),
          );
          cb({ selected: true, pixelX: px, pixelY: py });
        } else {
          cb({ selected: false, pixelX: 0, pixelY: 0 });
        }
      }
    });

    this.measurements.push(group);

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

  private buildTooltipForBox(
    box: BoxAnnotation,
    isBearish: boolean,
  ): CustomAnnotation {
    const xCalc = this.parentSurface.xAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const yCalc = this.parentSurface.yAxes
      .get(0)
      .getCurrentCoordinateCalculator();

    const x1Pix = xCalc.getCoordinate(box.x1);
    const x2Pix = xCalc.getCoordinate(box.x2);
    const y1Pix = yCalc.getCoordinate(box.y1);
    const y2Pix = yCalc.getCoordinate(box.y2);

    const minX = Math.min(x1Pix, x2Pix);
    const maxX = Math.max(x1Pix, x2Pix);
    const minY = Math.min(y1Pix, y2Pix);
    const maxY = Math.max(y1Pix, y2Pix);

    const { x, y, vAnchor, hAnchor } = this.computeTooltipPosition(
      minX,
      maxX,
      minY,
      maxY,
    );

    const renderableSeries = this.parentSurface.renderableSeries.get(0);
    const stats = calculateStats(
      renderableSeries!.dataSeries as OhlcDataSeries,
      Math.min(box.x1, box.x2),
      Math.max(box.x1, box.x2),
    );

    return new CustomAnnotation({
      xCoordinateMode: ECoordinateMode.Pixel,
      yCoordinateMode: ECoordinateMode.Pixel,
      x1: x,
      y1: y,
      verticalAnchorPoint: vAnchor,
      horizontalAnchorPoint: hAnchor,
      svgString: stats ? getMeasurementTooltip(stats, isBearish) : "",
      annotationLayer: EAnnotationLayer.AboveChart,
    });
  }

  private repositionTooltip(
    tip: CustomAnnotation,
    box: BoxAnnotation,
    isBearish: boolean,
  ) {
    const xCalc = this.parentSurface.xAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const yCalc = this.parentSurface.yAxes
      .get(0)
      .getCurrentCoordinateCalculator();

    const x1Pix = xCalc.getCoordinate(box.x1);
    const x2Pix = xCalc.getCoordinate(box.x2);
    const y1Pix = yCalc.getCoordinate(box.y1);
    const y2Pix = yCalc.getCoordinate(box.y2);

    const minX = Math.min(x1Pix, x2Pix);
    const maxX = Math.max(x1Pix, x2Pix);
    const minY = Math.min(y1Pix, y2Pix);
    const maxY = Math.max(y1Pix, y2Pix);

    const { x, y, vAnchor, hAnchor } = this.computeTooltipPosition(
      minX,
      maxX,
      minY,
      maxY,
    );

    tip.x1 = x;
    tip.y1 = y;
    tip.verticalAnchorPoint = vAnchor;
    tip.horizontalAnchorPoint = hAnchor;

    const renderableSeries = this.parentSurface.renderableSeries.get(0);
    const stats = calculateStats(
      renderableSeries!.dataSeries as OhlcDataSeries,
      Math.min(box.x1, box.x2),
      Math.max(box.x1, box.x2),
    );
    if (stats) tip.svgString = getMeasurementTooltip(stats, isBearish);
  }

  private buildDeleteBtn(box: BoxAnnotation): CustomAnnotation {
    const xCalc = this.parentSurface.xAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const yCalc = this.parentSurface.yAxes
      .get(0)
      .getCurrentCoordinateCalculator();

    const maxX = Math.max(
      xCalc.getCoordinate(box.x1),
      xCalc.getCoordinate(box.x2),
    );
    const minY = Math.min(
      yCalc.getCoordinate(box.y1),
      yCalc.getCoordinate(box.y2),
    );

    return new CustomAnnotation({
      xCoordinateMode: ECoordinateMode.Pixel,
      yCoordinateMode: ECoordinateMode.Pixel,
      x1: maxX - 16,
      y1: minY + 16,
      verticalAnchorPoint: EVerticalAnchorPoint.Center,
      horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
      svgString: this.getDeleteBtnSVG(),
      annotationLayer: EAnnotationLayer.AboveChart,
      isHidden: true,
    });
  }

  private getDeleteBtnSVG(): string {
    return `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" fill="#1a1a2e" stroke="#666" stroke-width="1.5"/>
      <line x1="6" y1="6" x2="14" y2="14" stroke="#ff4444" stroke-width="2" stroke-linecap="round"/>
      <line x1="14" y1="6" x2="6" y2="14" stroke="#ff4444" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
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

  private removeMeasurementGroup(group: MeasurementGroup) {
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
      group.deleteBtn,
    ].forEach((a) => {
      if (a) {
        try {
          this.parentSurface.annotations.remove(a);
        } catch (_) {}
      }
    });
  }

  private clearActive() {
    [
      this.activeBox,
      this.hLine,
      this.vLine,
      this.hArrow,
      this.vArrow,
      this.x1Marker,
      this.x2Marker,
      this.y1Marker,
      this.y2Marker,
      this.statsTooltip,
    ].forEach((a) => {
      if (a) {
        try {
          this.parentSurface.annotations.remove(a);
        } catch (_) {}
      }
    });
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

  private getArrowSVG(color: string, rotation: number): string {
    return `<svg width="10" height="10" overflow="visible" viewBox="0 0 10 10">
      <polygon points="0,0 10,5 0,10" fill="${color}" transform="rotate(${rotation} 5 5)"/>
    </svg>`;
  }

  public onDetach(): void {
    this.rangeSubscription?.();
    this.cancelDrawing();
    this.measurements.forEach((g) => this.removeMeasurementGroup(g));
    this.measurements = [];
    super.onDetach();
  }
}
