//! SniperCrosshair is just a medium, customize the logic on each tools

import type { Point } from "../types/point";

type SniperCrosshairProps = {
  points: Point[];
  activePointId?: string;
  size?: number;
  color?: string;
};

export const SniperCrosshair = ({
  points,
  activePointId,
  size = 6,
  color = "#4DA3FF",
}: SniperCrosshairProps) => {
  return (
    <>
      {points.map((point) => (
        <g key={point.id}>
          <circle
            cx={point.x}
            cy={point.y}
            r={size}
            fill={point.id === activePointId ? color : "transparent"}
          />

          <line
            x1={point.x - size}
            y1={point.y}
            x2={point.x + size}
            y2={point.y}
            stroke={color}
          />

          <line
            x1={point.x}
            y1={point.y - size}
            x2={point.x}
            y2={point.y + size}
            stroke={color}
          />
        </g>
      ))}
    </>
  );
};