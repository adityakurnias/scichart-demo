/**
 * SniperMeasurement
 *
 * ── Draw flow ──────────────────────────────────────────────────────────────
 *  isEnabled = true  → crosshair spawns at chart CENTER (fixed)
 *  Touch down        → record finger anchor position
 *  Drag finger       → crosshair moves RELATIVE to anchor (joystick/delta mode)
 *                      crosshair never sits under finger — always offset-free
 *  TAP #1 (quick up) → start dot placed at current crosshair position
 *  Drag finger again → box forms from start dot, crosshair still joystick
 *  TAP #2 (quick up) → finalize, crosshair removed, tool returns to pan
 *
 * ── Pan mode (after finalize, isEnabled = false) ──────────────────────────
 *  Modifier stays ALWAYS-ON for hit testing finalized measurements.
 *  Tap box           → SELECT: dots = resize handles, fixed toolbar at top
 *  Drag dot          → resize
 *  Toolbar delete    → remove
 *  Toolbar edit      → placeholder
 *  Tap outside       → deselect
 */

import {
  ChartModifierBase2D,
  ModifierMouseArgs,
  Point,
  ECoordinateMode,
  EAnnotationLayer,
  EHorizontalAnchorPoint,
  EVerticalAnchorPoint,
  BoxAnnotation,
  LineAnnotation,
  CustomAnnotation,
  AxisMarkerAnnotation,
  OhlcDataSeries,
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectedMeasurementInfo {
  selected: boolean;
}

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
  startDot: CustomAnnotation;
  endDot: CustomAnnotation;
  x1: number; y1: number;
  x2: number; y2: number;
  isBearish: boolean;
  color: string;
}

type SniperPhase =
  | "idle"            // tool off, but still intercepts box taps
  | "crosshair"       // tool on, crosshair visible at center, waiting TAP #1
  | "dragging"        // TAP #1 done, box forming, waiting TAP #2
  | "selected"        // a box is selected in pan mode
  | "resizing_start"
  | "resizing_end"
  | "moving";         // drag selected box to new position

// ─── Constants ────────────────────────────────────────────────────────────────

const CROSSHAIR_COLOR  = "#9B9B9B";
const LABEL_BG         = "#2B2B43";
const LABEL_FG         = "#FFFFFF";
const DOT_RADIUS       = 8;
const HIT_SLOP         = 24;
/** How sensitive the joystick is. 1.0 = 1:1 pixel delta. */
const JOYSTICK_SENSITIVITY = 1.0;
/** Max pixel distance finger can move and still count as a "tap" (not drag) */
const TAP_THRESHOLD = 8;

// ─── Class ────────────────────────────────────────────────────────────────────

export class SniperMeasurement extends ChartModifierBase2D {
  public type = "SniperMeasurement";

  private phase: SniperPhase = "idle";

  // ── Crosshair annotations ──────────────────────────────────────────────────
  private chHLine:   LineAnnotation       | undefined;
  private chVLine:   LineAnnotation       | undefined;
  private chXMarker: AxisMarkerAnnotation | undefined;
  private chYMarker: AxisMarkerAnnotation | undefined;

  // ── Joystick state ─────────────────────────────────────────────────────────
  /** Pixel position of crosshair center (updated via delta) */
  private chPixelX = 0;
  private chPixelY = 0;
  /** Finger position when touch started (for delta calc) */
  private fingerAnchorX = 0;
  private fingerAnchorY = 0;
  /** Crosshair pixel position when touch started */
  private chAnchorX = 0;
  private chAnchorY = 0;
  /** Track if finger moved enough to be a drag vs tap */
  private fingerMoved = false;

  // ── Move drag state ──────────────────────────────────────────────────────────────
  /** Finger pixel position when move-drag started */
  private moveAnchorX = 0;
  private moveAnchorY = 0;
  /** Data coords of box corners when move-drag started */
  private moveOriginX1 = 0; private moveOriginY1 = 0;
  private moveOriginX2 = 0; private moveOriginY2 = 0;

  // ── Draw state ─────────────────────────────────────────────────────────────
  private startDataX = 0;
  private startDataY = 0;
  private previewGroup:  MeasurementGroup | null = null;
  private measurements:  MeasurementGroup[]      = [];
  private selectedGroup: MeasurementGroup | null = null;

  // ── External deps ──────────────────────────────────────────────────────────
  private zoomPanModifier?: ZoomPanModifier;
  private wasPanEnabled = false;
  private onDeactivate?: () => void;
  public  onSelectionChange?: (info: SelectedMeasurementInfo) => void;

  constructor(
    zoomPanModifier?: ZoomPanModifier,
    onDeactivate?: () => void,
    onSelectionChange?: (info: SelectedMeasurementInfo) => void,
  ) {
    super();
    // CRITICAL: receiveHandledEvents = true so we get events even in pan mode
    this.receiveHandledEvents = true;
    this.zoomPanModifier   = zoomPanModifier;
    this.onDeactivate      = onDeactivate;
    this.onSelectionChange = onSelectionChange;
  }

  // ── isEnabled ──────────────────────────────────────────────────────────────

  public override set isEnabled(value: boolean) {
    // NOTE: We do NOT call super.isEnabled = value because we want the modifier
    // to ALWAYS receive events (for pan-mode box tapping).
    // Instead we use our own phase system as the gatekeeper.
    super.isEnabled = true; // always enabled at SciChart level
    if (value) {
      this.deselectAll();
      this.enterCrosshairPhase();
    } else {
      this.exitDrawingMode();
    }
  }
  public override get isEnabled(): boolean { return super.isEnabled; }

  /** True only when actively drawing (crosshair / dragging phase) */
  private get isDrawing(): boolean {
    return this.phase === "crosshair" || this.phase === "dragging";
  }

  public override onAttach(): void {
    super.onAttach();
    // If activated before attach, spawn crosshair now
    if (this.phase === "crosshair" && this.parentSurface) {
      this.spawnCrosshairAtCenter();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Phase transitions
  // ═══════════════════════════════════════════════════════════════════════════

  private enterCrosshairPhase(): void {
    this.phase = "crosshair";
    this.disablePan();
    try { navigator?.vibrate?.(10); } catch (_) {}
    if (this.parentSurface) {
      this.spawnCrosshairAtCenter();
    }
  }

  private exitDrawingMode(): void {
    // Only exit drawing — keep idle so pan-mode tap still works
    if (this.previewGroup) {
      this.removeGroup(this.previewGroup);
      this.previewGroup = null;
    }
    this.removeCrosshairAnnotations();
    this.phase = "idle";
    this.enablePan();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Crosshair — spawn at center, move via joystick delta
  // ═══════════════════════════════════════════════════════════════════════════

  private spawnCrosshairAtCenter(): void {
    // Remove any stale crosshair first
    this.removeCrosshairAnnotations();

    const rect   = this.parentSurface.seriesViewRect;
    this.chPixelX = rect.left + rect.width  / 2;
    this.chPixelY = rect.top  + rect.height / 2;

    const xVal = this.xCalc().getDataValue(this.chPixelX);
    const yVal = this.yCalc().getDataValue(this.chPixelY);

    this.chHLine = new LineAnnotation({
      xCoordinateMode: ECoordinateMode.Relative,
      yCoordinateMode: ECoordinateMode.DataValue,
      stroke: CROSSHAIR_COLOR, strokeThickness: 1, strokeDashArray: [4, 4],
      annotationLayer: EAnnotationLayer.AboveChart,
      x1: 0, x2: 1, y1: yVal, y2: yVal, isEditable: false,
    });

    this.chVLine = new LineAnnotation({
      xCoordinateMode: ECoordinateMode.DataValue,
      yCoordinateMode: ECoordinateMode.Relative,
      stroke: CROSSHAIR_COLOR, strokeThickness: 1, strokeDashArray: [4, 4],
      annotationLayer: EAnnotationLayer.AboveChart,
      x1: xVal, x2: xVal, y1: 0, y2: 1, isEditable: false,
    });

    this.chXMarker = new AxisMarkerAnnotation({
      fontSize: 11, fontStyle: "Bold",
      backgroundColor: LABEL_BG, color: LABEL_FG,
      formattedValue: formatDate(xVal), xAxisId: "AxisX",
      x1: xVal, isEditable: false,
    });

    this.chYMarker = new AxisMarkerAnnotation({
      fontSize: 11, fontStyle: "Bold",
      backgroundColor: LABEL_BG, color: LABEL_FG,
      formattedValue: formatPrice(yVal), yAxisId: "AxisY",
      y1: yVal, isEditable: false,
    });

    [this.chHLine, this.chVLine, this.chXMarker, this.chYMarker]
      .forEach((a) => this.parentSurface.annotations.add(a));
  }

  /**
   * Move crosshair to an absolute pixel position.
   * This is always called with the joystick-computed position,
   * never with raw finger position.
   */
  private setCrosshairPixel(px: number, py: number): void {
    if (!this.chHLine || !this.chVLine || !this.chXMarker || !this.chYMarker) return;

    // Clamp to seriesViewRect
    const rect = this.parentSurface.seriesViewRect;
    px = Math.max(rect.left, Math.min(rect.right,  px));
    py = Math.max(rect.top,  Math.min(rect.bottom, py));

    this.chPixelX = px;
    this.chPixelY = py;

    const xVal = this.xCalc().getDataValue(px);
    const yVal = this.yCalc().getDataValue(py);

    this.chHLine.y1 = yVal; this.chHLine.y2 = yVal; this.chHLine.isHidden = false;
    this.chVLine.x1 = xVal; this.chVLine.x2 = xVal; this.chVLine.isHidden = false;
    this.chXMarker.x1 = xVal; this.chXMarker.formattedValue = formatDate(xVal);  this.chXMarker.isHidden = false;
    this.chYMarker.y1 = yVal; this.chYMarker.formattedValue = formatPrice(yVal); this.chYMarker.isHidden = false;
  }

  private removeCrosshairAnnotations(): void {
    [this.chHLine, this.chVLine, this.chXMarker, this.chYMarker].forEach((a) => {
      if (!a) return;
      try { this.parentSurface.annotations.remove(a); } catch (_) {}
    });
    this.chHLine = this.chVLine = this.chXMarker = this.chYMarker = undefined;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Mouse / Touch events
  // ═══════════════════════════════════════════════════════════════════════════

  public modifierMouseDown(args: ModifierMouseArgs): void {
    super.modifierMouseDown(args);
    const pt = args.mousePoint;

    // ── Drawing mode: record finger anchor for joystick ───────────────────
    if (this.isDrawing) {
      this.fingerAnchorX = pt.x;
      this.fingerAnchorY = pt.y;
      this.chAnchorX     = this.chPixelX;
      this.chAnchorY     = this.chPixelY;
      this.fingerMoved   = false;
      args.handled = true;
      return;
    }

    // ── Pan mode: intercept box/dot interactions ──────────────────────────
    if (this.phase === "idle" || this.phase === "selected") {
      // Dot resize (only when selected)
      const dotHit = this.hitTestDot(pt);
      if (dotHit) {
        this.phase = dotHit.handle === "start" ? "resizing_start" : "resizing_end";
        this.disablePan();
        args.handled = true;
        return;
      }

      // Box tap → select + record anchor for potential move-drag
      const boxHit = this.hitTestBox(pt);
      if (boxHit) {
        this.selectGroup(boxHit);
        // Record finger + box origin so move-drag can start immediately
        this.moveAnchorX = pt.x; this.moveAnchorY = pt.y;
        this.moveOriginX1 = boxHit.x1; this.moveOriginY1 = boxHit.y1;
        this.moveOriginX2 = boxHit.x2; this.moveOriginY2 = boxHit.y2;
        args.handled = true;
        return;
      }

      // Outside tap → deselect
      if (this.selectedGroup) {
        this.deselectAll();
        args.handled = true;
        return;
      }
    }
  }

  public modifierMouseMove(args: ModifierMouseArgs): void {
    super.modifierMouseMove(args);
    const { x, y } = args.mousePoint;

    // ── Joystick: move crosshair by delta from finger anchor ─────────────
    if (this.isDrawing) {
      const dx = (x - this.fingerAnchorX) * JOYSTICK_SENSITIVITY;
      const dy = (y - this.fingerAnchorY) * JOYSTICK_SENSITIVITY;

      if (Math.abs(dx) > TAP_THRESHOLD || Math.abs(dy) > TAP_THRESHOLD) {
        this.fingerMoved = true;
      }

      this.setCrosshairPixel(
        this.chAnchorX + dx,
        this.chAnchorY + dy,
      );

      // Update live box preview if past TAP #1
      if (this.phase === "dragging" && this.previewGroup) {
        this.updatePreview(this.chPixelX, this.chPixelY);
      }

      args.handled = true;
      return;
    }

    // ── Resize ────────────────────────────────────────────────────────────
    // Move selected measurement (promoted from "selected" once finger exceeds TAP_THRESHOLD)
    if (this.phase === "moving" && this.selectedGroup) {
      this.applyMove(x, y);
      args.handled = true;
      return;
    }

    // Promote selected → moving once finger exceeds tap threshold on a box
    if (this.phase === "selected" && this.selectedGroup) {
      const dxMove = Math.abs(x - this.moveAnchorX);
      const dyMove = Math.abs(y - this.moveAnchorY);
      if (dxMove > TAP_THRESHOLD || dyMove > TAP_THRESHOLD) {
        this.phase = "moving";
        this.disablePan();
        this.applyMove(x, y);
        args.handled = true;
        return;
      }
    }

    if (
      (this.phase === "resizing_start" || this.phase === "resizing_end") &&
      this.selectedGroup
    ) {
      this.applyResize(x, y);
    }
  }

  public modifierMouseUp(args: ModifierMouseArgs): void {
    super.modifierMouseUp(args);

    // ── TAP #1: place start point at crosshair position ───────────────────
    if (this.phase === "crosshair") {
      if (!this.fingerMoved) {
        // Quick tap → place start point at CROSSHAIR position (not finger)
        this.placeStartPoint(this.chPixelX, this.chPixelY);
      }
      // If finger moved (was joysticking), just release — stay in crosshair
      args.handled = true;
      return;
    }

    // ── TAP #2: finalize at crosshair position ────────────────────────────
    if (this.phase === "dragging") {
      if (!this.fingerMoved) {
        // Quick tap → finalize
        this.finalizeDrawing(this.chPixelX, this.chPixelY);
      }
      // If finger moved (was dragging box), just release
      args.handled = true;
      return;
    }

    // End move
    if (this.phase === "moving") {
      this.phase = "selected";
      this.enablePan();
      if (this.selectedGroup) {
        this.moveAnchorX    = args.mousePoint.x; this.moveAnchorY    = args.mousePoint.y;
        this.moveOriginX1   = this.selectedGroup.x1; this.moveOriginY1 = this.selectedGroup.y1;
        this.moveOriginX2   = this.selectedGroup.x2; this.moveOriginY2 = this.selectedGroup.y2;
        this.emitSelection(this.selectedGroup);
      }
      args.handled = true;
      return;
    }

    // End resize──────────────────────────────────────────────────────
    if (this.phase === "resizing_start" || this.phase === "resizing_end") {
      this.phase = "selected";
      this.enablePan();
      if (this.selectedGroup) this.emitSelection(this.selectedGroup);
      args.handled = true;
    }
  }

  public modifierMouseLeave(args: ModifierMouseArgs): void {
    super.modifierMouseLeave(args);
    // Crosshair stays visible even if finger leaves — it's a fixed overlay
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Draw logic
  // ═══════════════════════════════════════════════════════════════════════════

  private placeStartPoint(px: number, py: number): void {
    const { dataX, dataY } = this.pixelToData(px, py);
    this.startDataX = dataX;
    this.startDataY = dataY;
    this.phase      = "dragging";
    this.createPreview();
    try { navigator?.vibrate?.(15); } catch (_) {}
  }

  private finalizeDrawing(px: number, py: number): void {
    if (!this.previewGroup) return;

    this.updatePreview(px, py);

    const g     = this.previewGroup;
    const xCalc = this.xCalc();
    const yCalc = this.yCalc();

    // Arrow pixel → DataValue
    [g.hArrow, g.vArrow].forEach((ann) => {
      ann.x1 = xCalc.getDataValue(ann.x1 as number);
      ann.y1 = yCalc.getDataValue(ann.y1 as number);
      ann.xCoordinateMode = ECoordinateMode.DataValue;
      ann.yCoordinateMode = ECoordinateMode.DataValue;
    });

    const { dataX: endDataX, dataY: endDataY } = this.pixelToData(px, py);
    g.endDot.x1 = endDataX; g.endDot.y1 = endDataY;
    g.x2 = endDataX; g.y2 = endDataY;

    this.measurements.push(g);
    this.previewGroup = null;

    this.removeCrosshairAnnotations();
    this.phase = "idle";
    this.enablePan();
    this.onDeactivate?.();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Select / Deselect / Resize
  // ═══════════════════════════════════════════════════════════════════════════

  private selectGroup(g: MeasurementGroup): void {
    if (this.selectedGroup === g) return;
    this.deselectAll();
    this.selectedGroup   = g;
    this.phase           = "selected";
    g.startDot.svgString = this.getDotSVG(g.color, true);
    g.endDot.svgString   = this.getDotSVG(g.color, true);
    this.emitSelection(g);
  }

  public deselectAll(): void {
    if (!this.selectedGroup) return;
    const g              = this.selectedGroup;
    g.startDot.svgString = this.getDotSVG(g.color, false);
    g.endDot.svgString   = this.getDotSVG(g.color, false);
    this.selectedGroup   = null;
    if (this.phase === "selected") this.phase = "idle";
    this.onSelectionChange?.({ selected: false });
  }

  public deleteSelected(): void {
    if (!this.selectedGroup) return;
    const g   = this.selectedGroup;
    const idx = this.measurements.indexOf(g);
    if (idx !== -1) this.measurements.splice(idx, 1);
    this.selectedGroup = null;
    this.phase         = "idle";
    this.removeGroup(g);
    this.onSelectionChange?.({ selected: false });
  }

  /**
   * Translate entire measurement by finger delta from move anchor.
   * All 4 corners shift by the same (dx, dy) in data space.
   */
  private applyMove(px: number, py: number): void {
    const g = this.selectedGroup; if (!g) return;
    const xCalc = this.xCalc(); const yCalc = this.yCalc();

    // Delta in pixel space
    const dxPx = px - this.moveAnchorX;
    const dyPx = py - this.moveAnchorY;

    // Convert origin corners + delta to data space
    const ox1Px = xCalc.getCoordinate(this.moveOriginX1);
    const oy1Px = yCalc.getCoordinate(this.moveOriginY1);
    const ox2Px = xCalc.getCoordinate(this.moveOriginX2);
    const oy2Px = yCalc.getCoordinate(this.moveOriginY2);

    g.x1 = xCalc.getDataValue(ox1Px + dxPx);
    g.y1 = yCalc.getDataValue(oy1Px + dyPx);
    g.x2 = xCalc.getDataValue(ox2Px + dxPx);
    g.y2 = yCalc.getDataValue(oy2Px + dyPx);

    g.startDot.x1 = g.x1; g.startDot.y1 = g.y1;
    g.endDot.x1   = g.x2; g.endDot.y1   = g.y2;

    this.rebuildGroupAnnotations(g);
  }

  private applyResize(px: number, py: number): void {
    const g = this.selectedGroup; if (!g) return;
    const { dataX, dataY } = this.pixelToData(px, py);
    if (this.phase === "resizing_start") {
      g.x1 = dataX; g.y1 = dataY; g.startDot.x1 = dataX; g.startDot.y1 = dataY;
    } else {
      g.x2 = dataX; g.y2 = dataY; g.endDot.x1 = dataX; g.endDot.y1 = dataY;
    }
    this.rebuildGroupAnnotations(g);
  }

  private rebuildGroupAnnotations(g: MeasurementGroup): void {
    const xCalc = this.xCalc(); const yCalc = this.yCalc();
    const isBearish = g.y2 < g.y1;
    const color     = isBearish ? appTheme.TV_Red : appTheme.VividSkyBlue;
    g.isBearish = isBearish; g.color = color;

    const dataMinX = Math.min(g.x1, g.x2); const dataMaxX = Math.max(g.x1, g.x2);
    const dataMinY = Math.min(g.y1, g.y2); const dataMaxY = Math.max(g.y1, g.y2);
    const dataMidX = (g.x1 + g.x2) / 2;   const dataMidY = (g.y1 + g.y2) / 2;

    g.box.x1 = g.x1; g.box.y1 = g.y1; g.box.x2 = g.x2; g.box.y2 = g.y2;
    g.box.fill = color + "33"; g.box.stroke = color;
    g.hLine.stroke = color; g.hLine.x1 = dataMinX; g.hLine.x2 = dataMaxX; g.hLine.y1 = dataMidY; g.hLine.y2 = dataMidY;
    g.vLine.stroke = color; g.vLine.x1 = dataMidX; g.vLine.x2 = dataMidX; g.vLine.y1 = dataMinY; g.vLine.y2 = dataMaxY;

    const sx = xCalc.getCoordinate(g.x1); const sy = yCalc.getCoordinate(g.y1);
    const ex = xCalc.getCoordinate(g.x2); const ey = yCalc.getCoordinate(g.y2);
    const isRight = ex >= sx; const isDown = ey >= sy;
    const minX = Math.min(sx, ex); const maxX = Math.max(sx, ex);
    const minY = Math.min(sy, ey); const maxY = Math.max(sy, ey);
    const midX = (sx + ex) / 2; const midY = (sy + ey) / 2; const ha = -5;

    g.hArrow.x1 = xCalc.getDataValue(isRight ? maxX + ha : minX - ha); g.hArrow.y1 = yCalc.getDataValue(midY);
    g.hArrow.svgString = this.getArrowSVG(color, isRight ? 0 : 180);
    g.vArrow.x1 = xCalc.getDataValue(midX); g.vArrow.y1 = yCalc.getDataValue(isDown ? maxY + ha : minY - ha);
    g.vArrow.svgString = this.getArrowSVG(color, isDown ? 90 : 270);

    updateXAxisMarker(g.x1Marker, dataMinX, formatDate,  color, "start");
    updateXAxisMarker(g.x2Marker, dataMaxX, formatDate,  color, "end");
    updateYAxisMarker(g.y1Marker, dataMaxY, formatPrice, color, "start");
    updateYAxisMarker(g.y2Marker, dataMinY, formatPrice, color, "end");
    this.updateTooltip(g, minX, maxX, minY, maxY, dataMinX, dataMaxX);

    const isSelected = this.selectedGroup === g;
    g.startDot.svgString = this.getDotSVG(color, isSelected);
    g.endDot.svgString   = this.getDotSVG(color, isSelected);
    if (isSelected) this.emitSelection(g);
  }

  private emitSelection(g: MeasurementGroup): void {
    this.onSelectionChange?.({ selected: true });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Preview
  // ═══════════════════════════════════════════════════════════════════════════

  private createPreview(): void {
    const color = appTheme.VividSkyBlue;
    const dataX = this.startDataX; const dataY = this.startDataY;

    const group: MeasurementGroup = {
      box: new BoxAnnotation({
        xCoordinateMode: ECoordinateMode.DataValue, yCoordinateMode: ECoordinateMode.DataValue,
        fill: color + "33", stroke: color, strokeThickness: 1,
        x1: dataX, y1: dataY, x2: dataX, y2: dataY,
        annotationLayer: EAnnotationLayer.AboveChart,
      }),
      hLine: new LineAnnotation({
        xCoordinateMode: ECoordinateMode.DataValue, yCoordinateMode: ECoordinateMode.DataValue,
        stroke: color, strokeThickness: 1, annotationLayer: EAnnotationLayer.AboveChart,
        x1: dataX, y1: dataY, x2: dataX, y2: dataY,
      }),
      vLine: new LineAnnotation({
        xCoordinateMode: ECoordinateMode.DataValue, yCoordinateMode: ECoordinateMode.DataValue,
        stroke: color, strokeThickness: 1, annotationLayer: EAnnotationLayer.AboveChart,
        x1: dataX, y1: dataY, x2: dataX, y2: dataY,
      }),
      hArrow: new CustomAnnotation({
        xCoordinateMode: ECoordinateMode.Pixel, yCoordinateMode: ECoordinateMode.Pixel,
        x1: 0, y1: 0,
        verticalAnchorPoint: EVerticalAnchorPoint.Center,
        horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
        annotationLayer: EAnnotationLayer.AboveChart,
        svgString: this.getArrowSVG(color, 0),
      }),
      vArrow: new CustomAnnotation({
        xCoordinateMode: ECoordinateMode.Pixel, yCoordinateMode: ECoordinateMode.Pixel,
        x1: 0, y1: 0,
        verticalAnchorPoint: EVerticalAnchorPoint.Center,
        horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
        annotationLayer: EAnnotationLayer.AboveChart,
        svgString: this.getArrowSVG(color, 90),
      }),
      x1Marker:     createAxisMarker(dataX, formatDate,  true,  "start", color),
      x2Marker:     createAxisMarker(dataX, formatDate,  true,  "end",   color),
      y1Marker:     createAxisMarker(dataY, formatPrice, false, "start", color),
      y2Marker:     createAxisMarker(dataY, formatPrice, false, "end",   color),
      statsTooltip: new CustomAnnotation({
        xCoordinateMode: ECoordinateMode.DataValue, yCoordinateMode: ECoordinateMode.DataValue,
        x1: dataX, y1: dataY, annotationLayer: EAnnotationLayer.AboveChart,
        svgString: `<svg width="1" height="1" xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" fill="transparent"/></svg>`,
      }),
      startDot: this.makeDot(dataX, dataY, color, false),
      endDot:   this.makeDot(dataX, dataY, color, false),
      x1: dataX, y1: dataY, x2: dataX, y2: dataY,
      isBearish: false, color,
    };

    [
      group.box, group.hLine, group.vLine, group.hArrow, group.vArrow,
      group.x1Marker, group.x2Marker, group.y1Marker, group.y2Marker,
      group.statsTooltip, group.startDot, group.endDot,
    ].forEach((a) => this.parentSurface.annotations.add(a));

    this.previewGroup = group;
  }

  private updatePreview(cx: number, cy: number): void {
    if (!this.previewGroup) return;
    const xCalc = this.xCalc(); const yCalc = this.yCalc();
    const endDataX = xCalc.getDataValue(cx); const endDataY = yCalc.getDataValue(cy);
    const sx = xCalc.getCoordinate(this.startDataX); const sy = yCalc.getCoordinate(this.startDataY);
    const ex = xCalc.getCoordinate(endDataX);        const ey = yCalc.getCoordinate(endDataY);

    const isBearish = ey > sy;
    const color = isBearish ? appTheme.TV_Red : appTheme.VividSkyBlue;
    const g = this.previewGroup;
    g.isBearish = isBearish; g.color = color; g.x2 = endDataX; g.y2 = endDataY;

    g.box.x1 = this.startDataX; g.box.y1 = this.startDataY;
    g.box.x2 = endDataX; g.box.y2 = endDataY;
    g.box.fill = color + "33"; g.box.stroke = color;

    const dataMinX = Math.min(this.startDataX, endDataX);
    const dataMaxX = Math.max(this.startDataX, endDataX);
    const dataMinY = Math.min(this.startDataY, endDataY);
    const dataMaxY = Math.max(this.startDataY, endDataY);
    const dataMidX = (this.startDataX + endDataX) / 2;
    const dataMidY = (this.startDataY + endDataY) / 2;

    g.hLine.stroke = color; g.hLine.x1 = dataMinX; g.hLine.x2 = dataMaxX; g.hLine.y1 = dataMidY; g.hLine.y2 = dataMidY;
    g.vLine.stroke = color; g.vLine.x1 = dataMidX; g.vLine.x2 = dataMidX; g.vLine.y1 = dataMinY; g.vLine.y2 = dataMaxY;

    const minX = Math.min(sx, ex); const maxX = Math.max(sx, ex);
    const minY = Math.min(sy, ey); const maxY = Math.max(sy, ey);
    const midX = (sx + ex) / 2; const midY = (sy + ey) / 2;
    const isRight = ex >= sx; const isDown = ey >= sy; const ha = -5;

    g.hArrow.x1 = isRight ? maxX + ha : minX - ha; g.hArrow.y1 = midY;
    g.hArrow.svgString = this.getArrowSVG(color, isRight ? 0 : 180);
    g.vArrow.x1 = midX; g.vArrow.y1 = isDown ? maxY + ha : minY - ha;
    g.vArrow.svgString = this.getArrowSVG(color, isDown ? 90 : 270);

    g.startDot.svgString = this.getDotSVG(color, false);
    g.endDot.x1 = endDataX; g.endDot.y1 = endDataY; g.endDot.svgString = this.getDotSVG(color, false);

    updateXAxisMarker(g.x1Marker, dataMinX, formatDate,  color, "start");
    updateXAxisMarker(g.x2Marker, dataMaxX, formatDate,  color, "end");
    updateYAxisMarker(g.y1Marker, dataMaxY, formatPrice, color, "start");
    updateYAxisMarker(g.y2Marker, dataMinY, formatPrice, color, "end");
    this.updateTooltip(g, minX, maxX, minY, maxY, dataMinX, dataMaxX);
  }

  private updateTooltip(
    g: MeasurementGroup,
    minX: number, maxX: number, minY: number, maxY: number,
    x1: number, x2: number,
  ): void {
    const series = this.parentSurface.renderableSeries.get(0);
    if (!series?.dataSeries) return;
    const stats = calculateStats(series.dataSeries as OhlcDataSeries, Math.min(x1, x2), Math.max(x1, x2));
    if (!stats) return;
    const { x, y, vAnchor, hAnchor } = this.computeTooltipPosition(minX, maxX, minY, maxY);
    g.statsTooltip.x1 = this.xCalc().getDataValue(x); g.statsTooltip.y1 = this.yCalc().getDataValue(y);
    g.statsTooltip.verticalAnchorPoint = vAnchor; g.statsTooltip.horizontalAnchorPoint = hAnchor;
    g.statsTooltip.svgString = getMeasurementTooltip(stats, g.isBearish);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Hit tests
  // ═══════════════════════════════════════════════════════════════════════════

  private hitTestDot(pt: Point): { group: MeasurementGroup; handle: "start" | "end" } | null {
    const g = this.selectedGroup; if (!g) return null;
    const xCalc = this.xCalc(); const yCalc = this.yCalc();
    const sx = xCalc.getCoordinate(g.x1); const sy = yCalc.getCoordinate(g.y1);
    const ex = xCalc.getCoordinate(g.x2); const ey = yCalc.getCoordinate(g.y2);
    if (this.within(pt, sx, sy, HIT_SLOP)) return { group: g, handle: "start" };
    if (this.within(pt, ex, ey, HIT_SLOP)) return { group: g, handle: "end" };
    return null;
  }

  private hitTestBox(pt: Point): MeasurementGroup | null {
    const xCalc = this.xCalc(); const yCalc = this.yCalc();
    for (let i = this.measurements.length - 1; i >= 0; i--) {
      const g = this.measurements[i];
      const minX = Math.min(xCalc.getCoordinate(g.x1), xCalc.getCoordinate(g.x2));
      const maxX = Math.max(xCalc.getCoordinate(g.x1), xCalc.getCoordinate(g.x2));
      const minY = Math.min(yCalc.getCoordinate(g.y1), yCalc.getCoordinate(g.y2));
      const maxY = Math.max(yCalc.getCoordinate(g.y1), yCalc.getCoordinate(g.y2));
      if (pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY) return g;
    }
    return null;
  }

  private within(pt: Point, cx: number, cy: number, slop: number): boolean {
    return pt.x >= cx - slop && pt.x <= cx + slop && pt.y >= cy - slop && pt.y <= cy + slop;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SVG
  // ═══════════════════════════════════════════════════════════════════════════

  private getDotSVG(color: string, selected: boolean): string {
    const r = selected ? DOT_RADIUS + 3 : DOT_RADIUS;
    const size = r * 2 + 8; const c = size / 2;
    const ring = selected
      ? `<circle cx="${c}" cy="${c}" r="${r + 4}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.35"/>`
      : "";
    return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      ${ring}<circle cx="${c}" cy="${c}" r="${r}" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
    </svg>`;
  }

  private getArrowSVG(color: string, rotation: number): string {
    return `<svg width="10" height="10" overflow="visible" viewBox="0 0 10 10">
      <polygon points="0,0 10,5 0,10" fill="${color}" transform="rotate(${rotation} 5 5)"/>
    </svg>`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Utility
  // ═══════════════════════════════════════════════════════════════════════════

  private pixelToData(px: number, py: number) {
    return { dataX: this.xCalc().getDataValue(px), dataY: this.yCalc().getDataValue(py) };
  }
  private xCalc() { return this.parentSurface.xAxes.get(0).getCurrentCoordinateCalculator(); }
  private yCalc() { return this.parentSurface.yAxes.get(0).getCurrentCoordinateCalculator(); }

  private makeDot(dataX: number, dataY: number, color: string, selected: boolean): CustomAnnotation {
    return new CustomAnnotation({
      xCoordinateMode: ECoordinateMode.DataValue, yCoordinateMode: ECoordinateMode.DataValue,
      x1: dataX, y1: dataY,
      verticalAnchorPoint:   EVerticalAnchorPoint.Center,
      horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
      annotationLayer: EAnnotationLayer.AboveChart,
      svgString: this.getDotSVG(color, selected),
    });
  }

  private disablePan(): void {
    if (this.zoomPanModifier) {
      this.wasPanEnabled = this.zoomPanModifier.isEnabled;
      this.zoomPanModifier.isEnabled = false;
    }
  }
  private enablePan(): void {
    if (this.zoomPanModifier && this.wasPanEnabled) this.zoomPanModifier.isEnabled = true;
  }

  private computeTooltipPosition(minX: number, maxX: number, minY: number, maxY: number) {
    const rect = this.parentSurface.seriesViewRect;
    const TH = 80; const TW = 170; const GAP = 6;
    let x = minX + (maxX - minX) / 2; let y = minY - GAP;
    let vAnchor = EVerticalAnchorPoint.Bottom; let hAnchor = EHorizontalAnchorPoint.Center;
    if (minY - TH < rect.top)          { y = maxY + GAP; vAnchor = EVerticalAnchorPoint.Top; }
    if (x - TW / 2 < rect.left)       { x = minX; hAnchor = EHorizontalAnchorPoint.Left; }
    else if (x + TW / 2 > rect.right) { x = maxX; hAnchor = EHorizontalAnchorPoint.Right; }
    return { x, y, vAnchor, hAnchor };
  }

  private removeGroup(g: MeasurementGroup): void {
    [
      g.box, g.hLine, g.vLine, g.hArrow, g.vArrow,
      g.x1Marker, g.x2Marker, g.y1Marker, g.y2Marker,
      g.statsTooltip, g.startDot, g.endDot,
    ].forEach((a) => {
      if (!a) return;
      try { this.parentSurface.annotations.remove(a); } catch (_) {}
    });
  }

  public onDetach(): void {
    this.removeCrosshairAnnotations();
    this.measurements.forEach((g) => this.removeGroup(g));
    if (this.previewGroup) this.removeGroup(this.previewGroup);
    super.onDetach();
  }
}