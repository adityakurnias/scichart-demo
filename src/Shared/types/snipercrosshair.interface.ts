import type { Point } from "./point";

export type ToolType = "line" | "box" | "measurement" | "custom";

export interface CrosshairAnnotation {
  id: string;
  type: ToolType;
  points: Point[];
}