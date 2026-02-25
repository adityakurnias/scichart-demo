//? Mobile crosshair — TradingView-style: long-press to activate, drag to move, release to hide.

import {
  ChartModifierBase2D,
  ModifierMouseArgs,
  ECoordinateMode,
  EAnnotationLayer,
  LineAnnotation,
  AxisMarkerAnnotation,
  OhlcDataSeries,
  ZoomPanModifier,
  DpiHelper,
} from "scichart";
import { formatDate, formatPrice } from "../../../../Desktop/utils/formatters";
import { OhlcLegendData } from "../../../../Shared/hooks/useChartLegend";

const CROSSHAIR_COLOR = "#9B9B9B";
const LABEL_BG = "#2B2B43";
const LABEL_FG = "#FFFFFF";
const LONG_PRESS_MS = 200;

export class CrosshairMobile extends ChartModifierBase2D {
  public type = "CrosshairMobile";

  // ── Annotations ───────────────────────────────────────────────────────────
  private hLine: LineAnnotation | undefined;
  private vLine: LineAnnotation | undefined;
  private xMarker: AxisMarkerAnnotation | undefined;
  private yMarker: AxisMarkerAnnotation | undefined;

  // ── Touch state ───────────────────────────────────────────────────────────
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private isCrosshairActive = false;
  private touchStartX = 0;
  private touchStartY = 0;

  // ── External refs ─────────────────────────────────────────────────────────
  private onOhlcUpdate?: (data: OhlcLegendData | null) => void;
  private zoomPanModifier?: ZoomPanModifier;
  private wasPanEnabled = false;

  constructor(
    onOhlcUpdate?: (data: OhlcLegendData | null) => void,
    zoomPanModifier?: ZoomPanModifier,
  ) {
    super();
    this.receiveHandledEvents = true;
    this.onOhlcUpdate = onOhlcUpdate;
    this.zoomPanModifier = zoomPanModifier;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Touch lifecycle: Down → Move → Up
  // ═══════════════════════════════════════════════════════════════════════════

  public modifierMouseDown(args: ModifierMouseArgs): void {
    super.modifierMouseDown(args);
    if (!this.isEnabled) return;

    this.touchStartX = args.mousePoint.x;
    this.touchStartY = args.mousePoint.y;

    // Start long-press timer — use captured coords, NOT args.mousePoint
    // (SciChart may recycle/mutate the args object after handler returns)
    this.clearLongPressTimer();
    const startX = this.touchStartX;
    const startY = this.touchStartY;
    this.longPressTimer = setTimeout(() => {
      this.activateCrosshair(startX, startY);
    }, LONG_PRESS_MS);
  }

  public modifierMouseMove(args: ModifierMouseArgs): void {
    super.modifierMouseMove(args);
    if (!this.isEnabled) return;

    // If we haven't activated yet, check if finger moved too far → cancel long-press
    if (!this.isCrosshairActive && this.longPressTimer) {
      const dx = Math.abs(args.mousePoint.x - this.touchStartX);
      const dy = Math.abs(args.mousePoint.y - this.touchStartY);
      if (dx > 10 || dy > 10) {
        // Finger moved — it's a pan gesture, not a long-press
        this.clearLongPressTimer();
        return;
      }
      return;
    }

    if (!this.isCrosshairActive) return;

    // ── Update crosshair position ─────────────────────────────────────────
    this.updateCrosshairPosition(args.mousePoint.x, args.mousePoint.y);
  }

  public modifierMouseUp(args: ModifierMouseArgs): void {
    super.modifierMouseUp(args);

    this.clearLongPressTimer();

    if (this.isCrosshairActive) {
      this.deactivateCrosshair();
    }
  }

  public modifierMouseLeave(args: ModifierMouseArgs): void {
    super.modifierMouseLeave(args);
    this.clearLongPressTimer();
    if (this.isCrosshairActive) {
      this.deactivateCrosshair();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Activation / Deactivation
  // ═══════════════════════════════════════════════════════════════════════════

  private activateCrosshair(px: number, py: number): void {
    this.isCrosshairActive = true;

    // Haptic feedback
    try {
      navigator?.vibrate?.(10);
    } catch (_) {}

    // Disable panning while crosshair is active
    if (this.zoomPanModifier) {
      this.wasPanEnabled = this.zoomPanModifier.isEnabled;
      this.zoomPanModifier.isEnabled = false;
    }

    this.updateCrosshairPosition(px, py);
  }

  private deactivateCrosshair(): void {
    this.isCrosshairActive = false;
    this.hideCrosshair();

    // Re-enable panning
    if (this.zoomPanModifier && this.wasPanEnabled) {
      this.zoomPanModifier.isEnabled = true;
    }

    // Clear OHLC legend
    this.onOhlcUpdate?.(null);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Crosshair rendering
  // ═══════════════════════════════════════════════════════════════════════════

  private updateCrosshairPosition(px: number, py: number): void {
    const series = this.parentSurface.renderableSeries.get(0);
    if (!series) return;

    // Use HitTest API with DPI scaling to find the nearest data point
    // This is the most robust way to handle "snapping" in SciChart JS
    const hitTestInfo = series.hitTestProvider.hitTestXSlice(px, py, 20);

    if (!hitTestInfo.isHit && !hitTestInfo.isWithinDataBounds) {
      this.hideCrosshair();
      return;
    }

    this.showCrosshair();

    // Data values from hit test
    const xVal = hitTestInfo.xValue;
    // For Y, we use the value directly at the finger to allow smooth vertical sliding
    const yCalc = this.parentSurface.yAxes
      .get(0)
      .getCurrentCoordinateCalculator();
    const yVal = yCalc.getDataValue(py);

    // ── Update OHLC legend ────────────────────────────────────────────────
    if (this.onOhlcUpdate) {
      this.onOhlcUpdate({
        name: "BTC/USDT",
        open: hitTestInfo.openValue,
        high: hitTestInfo.highValue,
        low: hitTestInfo.lowValue,
        close: hitTestInfo.closeValue,
      });
    }

    // ── Horizontal line ───────────────────────────────────────────────────
    // Using ECoordinateMode.Relative for span (0-1) and Data for position
    if (!this.hLine) {
      this.hLine = new LineAnnotation({
        xCoordinateMode: ECoordinateMode.Relative,
        yCoordinateMode: ECoordinateMode.DataValue,
        stroke: CROSSHAIR_COLOR,
        strokeThickness: 1,
        strokeDashArray: [4, 4],
        annotationLayer: EAnnotationLayer.AboveChart,
        x1: 0,
        x2: 1,
        y1: yVal,
        y2: yVal,
        isEditable: false,
      });
      this.parentSurface.annotations.add(this.hLine);
    } else {
      this.hLine.y1 = yVal;
      this.hLine.y2 = yVal;
    }

    // ── Vertical line ─────────────────────────────────────────────────────
    // Snaps to xVal (center of candle)
    if (!this.vLine) {
      this.vLine = new LineAnnotation({
        xCoordinateMode: ECoordinateMode.DataValue,
        yCoordinateMode: ECoordinateMode.Relative,
        stroke: CROSSHAIR_COLOR,
        strokeThickness: 1,
        strokeDashArray: [4, 4],
        annotationLayer: EAnnotationLayer.AboveChart,
        x1: xVal,
        x2: xVal,
        y1: 0,
        y2: 1,
        isEditable: false,
      });
      this.parentSurface.annotations.add(this.vLine);
    } else {
      this.vLine.x1 = xVal;
      this.vLine.x2 = xVal;
    }

    // ── X axis marker ─────────────────────────────────────────────────────
    if (!this.xMarker) {
      this.xMarker = new AxisMarkerAnnotation({
        fontSize: 11,
        fontStyle: "Bold",
        backgroundColor: LABEL_BG,
        color: LABEL_FG,
        formattedValue: formatDate(xVal),
        xAxisId: "AxisX",
        x1: xVal,
        isEditable: false,
      });
      this.parentSurface.annotations.add(this.xMarker);
    } else {
      this.xMarker.x1 = xVal;
      this.xMarker.formattedValue = formatDate(xVal);
    }

    // ── Y axis marker ─────────────────────────────────────────────────────
    if (!this.yMarker) {
      this.yMarker = new AxisMarkerAnnotation({
        fontSize: 11,
        fontStyle: "Bold",
        backgroundColor: LABEL_BG,
        color: LABEL_FG,
        formattedValue: formatPrice(yVal),
        yAxisId: "AxisY",
        y1: yVal,
        isEditable: false,
      });
      this.parentSurface.annotations.add(this.yMarker);
    } else {
      this.yMarker.y1 = yVal;
      this.yMarker.formattedValue = formatPrice(yVal);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Visibility helpers
  // ═══════════════════════════════════════════════════════════════════════════

  private showCrosshair(): void {
    [this.hLine, this.vLine, this.xMarker, this.yMarker].forEach((a) => {
      if (a) a.isHidden = false;
    });
  }

  private hideCrosshair(): void {
    [this.hLine, this.vLine, this.xMarker, this.yMarker].forEach((a) => {
      if (a) a.isHidden = true;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  Cleanup
  // ═══════════════════════════════════════════════════════════════════════════

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  public onDetach(): void {
    this.clearLongPressTimer();
    this.removeAnnotations();
    super.onDetach();
  }

  private removeAnnotations(): void {
    [this.hLine, this.vLine, this.xMarker, this.yMarker].forEach((a) => {
      if (a) {
        try {
          this.parentSurface.annotations.remove(a);
        } catch (_) {}
      }
    });
    this.hLine = undefined;
    this.vLine = undefined;
    this.xMarker = undefined;
    this.yMarker = undefined;
  }
}
