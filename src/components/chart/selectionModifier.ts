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
} from "scichart";
import { appTheme } from "../../styles/theme";
import { calculateStats } from "./utils/chartStats";
import { getStatsTooltipSvg } from "./templates/statsTooltip";

export class SelectionModifier extends ChartModifierBase2D {
  public type = "SelectionModifier";
  private startPoint: Point | undefined;
  private activeBox: BoxAnnotation | undefined;
  private statsTooltip: CustomAnnotation | undefined;

  constructor() {
    super();
  }

  public modifierMouseDown(args: ModifierMouseArgs): void {
    super.modifierMouseDown(args);

    // Allow Left Click, Right Click, or Touch (simulated as Left)
    // If this modifier is disabled by parent, this won't even fire or can be guarded.
    // The parent 'createCandlestickChart' manages isEnabled.
    if (this.isEnabled) {
      // Just check if it's a valid interaction for selection (e.g. not right dragging if we want left)
      // For simplicity, let's allow any button if the tool is explicitly selected.
      // But usually left drag is standard for tools.

      this.startPoint = args.mousePoint;
      this.clearSelection();

      // BoxAnnotation
      this.activeBox = new BoxAnnotation({
        xCoordinateMode: ECoordinateMode.Pixel,
        yCoordinateMode: ECoordinateMode.Pixel,
        fill: appTheme.VividSkyBlue + "33",
        stroke: appTheme.VividSkyBlue,
        strokeThickness: 1,
        x1: this.startPoint.x,
        y1: this.startPoint.y,
        x2: this.startPoint.x,
        y2: this.startPoint.y,
        annotationLayer: EAnnotationLayer.AboveChart,
      });

      this.parentSurface.annotations.add(this.activeBox);
    }
  }

  public modifierMouseMove(args: ModifierMouseArgs): void {
    super.modifierMouseMove(args);

    if (this.startPoint && this.activeBox) {
      this.activeBox.x2 = args.mousePoint.x;
      this.activeBox.y2 = args.mousePoint.y;
    }

    if (!this.startPoint && this.activeBox) {
      const xCalc = this.parentSurface.xAxes
        .get(0)
        .getCurrentCoordinateCalculator();
      const yCalc = this.parentSurface.yAxes
        .get(0)
        .getCurrentCoordinateCalculator();

      const x1Pix = xCalc.getCoordinate(this.activeBox.x1);
      const x2Pix = xCalc.getCoordinate(this.activeBox.x2);
      const y1Pix = yCalc.getCoordinate(this.activeBox.y1);
      const y2Pix = yCalc.getCoordinate(this.activeBox.y2);

      const minX = Math.min(x1Pix, x2Pix);
      const maxX = Math.max(x1Pix, x2Pix);
      const minY = Math.min(y1Pix, y2Pix);
      const maxY = Math.max(y1Pix, y2Pix);

      const mx = args.mousePoint.x;
      const my = args.mousePoint.y;

      if (mx >= minX && mx <= maxX && my >= minY && my <= maxY) {
        this.updateTooltip(
          this.activeBox.x1,
          this.activeBox.x2,
          this.activeBox.y1,
          this.activeBox.y2,
          mx,
          my,
        );
      } else {
        if (this.statsTooltip) {
          this.parentSurface.annotations.remove(this.statsTooltip);
          this.statsTooltip = undefined;
        }
      }
    }
  }

  public modifierMouseUp(args: ModifierMouseArgs): void {
    super.modifierMouseUp(args);

    if (this.startPoint) {
      const dist = Math.sqrt(
        Math.pow(args.mousePoint.x - this.startPoint.x, 2) +
          Math.pow(args.mousePoint.y - this.startPoint.y, 2),
      );

      // Handle Tap / Click
      // Increased threshold for mobile touch accuracy
      if (dist < 20 && this.activeBox) {
        // It was a tap. Clear previous box if we were dragging, but here we want to select the candle.
        // Actually, if we just tapped, activeBox was created in MouseDown as a 0-size box and didn't expand much.
        // We can use the current mouse point to find the candle.
        this.parentSurface.annotations.remove(this.activeBox); // Remove the tiny box

        // Create a selection details for the single point
        // We want to calculate stats/tooltip for the candle at this X
        const xCalc = this.parentSurface.xAxes
          .get(0)
          .getCurrentCoordinateCalculator();
        //  const yCalc = this.parentSurface.yAxes.get(0).getCurrentCoordinateCalculator();

        const xVal = xCalc.getDataValue(args.mousePoint.x);
        // Find the nearest candle index?
        // For now, let's just make a small range around the tap to simulate a "selection" of that area or just the single index.
        // Better: Use hit test or just assume the X coordinate maps to a candle.

        // For now, allow "Click to Clear" if we already had a selection?
        // Or "Click to Select". simpler: Treat tap as selecting a small region or just showing info.
        // Logic: If we tapped, maybe we want to show the tooltip for that X.
        // Let's create a 1-pixel wide box or reusing updateTooltip logic with a single point?
        // updateTooltip takes x1, x2...

        // Let's look at updateTooltip. It calculates stats between x1 and x2.
        // If x1 ~= x2, it might pick up one candle.
        this.updateTooltip(
          args.mousePoint.x,
          args.mousePoint.x,
          0,
          0,
          args.mousePoint.x,
          args.mousePoint.y,
        );

        // We might want to persist this tooltip. Currently updateTooltip adds it.
        // But we need to distinguish "dragged box" vs "tapped point".
        // Use a marker? For now, let's see if updateTooltip works for single point.
      } else if (this.activeBox) {
        // Dragged
        // ... (Existing logic for proper box selection)

        const xCalc = this.parentSurface.xAxes
          .get(0)
          .getCurrentCoordinateCalculator();
        const yCalc = this.parentSurface.yAxes
          .get(0)
          .getCurrentCoordinateCalculator();

        const x1Data = xCalc.getDataValue(this.activeBox.x1);
        const x2Data = xCalc.getDataValue(this.activeBox.x2);
        const y1Data = yCalc.getDataValue(this.activeBox.y1);
        const y2Data = yCalc.getDataValue(this.activeBox.y2);

        this.parentSurface.annotations.remove(this.activeBox);

        this.activeBox = new BoxAnnotation({
          xCoordinateMode: ECoordinateMode.DataValue,
          yCoordinateMode: ECoordinateMode.DataValue,
          fill: appTheme.VividSkyBlue + "33",
          stroke: appTheme.VividSkyBlue,
          strokeThickness: 1,
          x1: x1Data,
          x2: x2Data,
          y1: y1Data,
          y2: y2Data,
          isEditable: false,
        });

        this.parentSurface.annotations.add(this.activeBox);
      }

      this.startPoint = undefined;
    }
  }

  private clearSelection() {
    if (this.activeBox) {
      this.parentSurface.annotations.remove(this.activeBox);
      this.activeBox = undefined;
    }
    if (this.statsTooltip) {
      this.parentSurface.annotations.remove(this.statsTooltip);
      this.statsTooltip = undefined;
    }
  }

  private updateTooltip(
    x1: number,
    x2: number,
    y1: number,
    y2: number,
    mouseX: number,
    mouseY: number,
  ) {
    if (!this.statsTooltip) {
      const renderableSeries = this.parentSurface.renderableSeries.get(0);
      if (!renderableSeries || !renderableSeries.dataSeries) return;

      const stats = calculateStats(
        renderableSeries.dataSeries as OhlcDataSeries,
        Math.min(x1, x2),
        Math.max(x1, x2),
      );
      if (!stats) return;

      this.statsTooltip = new CustomAnnotation({
        xCoordinateMode: ECoordinateMode.Pixel,
        yCoordinateMode: ECoordinateMode.Pixel,
        x1: mouseX,
        y1: mouseY,
        verticalAnchorPoint: EVerticalAnchorPoint.Bottom,
        horizontalAnchorPoint: EHorizontalAnchorPoint.Left,
        svgString: getStatsTooltipSvg(stats),
      });
      this.parentSurface.annotations.add(this.statsTooltip);
    } else {
      this.statsTooltip.x1 = mouseX;
      this.statsTooltip.y1 = mouseY;
    }
  }
}
