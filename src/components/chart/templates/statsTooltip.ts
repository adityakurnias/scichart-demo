import { appTheme } from "../../../styles/theme";
import { formatVolume, formatDuration } from "../../../utils/formatters";
import { Stats } from "../utils/chartStats";

export const getStatsTooltipSvg = (stats: Stats): string => {
  return `<svg width="220" height="130" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="100%" height="100%" fill="#141821" stroke="#444" rx="6" ry="6" fill-opacity="0.95"/>
                
                <text x="10" y="20" fill="#e1e4e8" font-size="11" font-family="Inter, system-ui, sans-serif" font-weight="bold">Range: ${stats.minLow.toFixed(
                  2,
                )} — ${stats.maxHigh.toFixed(2)}</text>
                
                <text x="10" y="40" fill="#e1e4e8" font-size="11" font-family="Inter, system-ui, sans-serif">Avg: ${stats.avg.toFixed(
                  2,
                )}</text>
                
                <text x="10" y="60" fill="${
                  stats.change >= 0 ? appTheme.TV_Green : appTheme.TV_Red
                }" font-size="11" font-family="Inter, system-ui, sans-serif">Change: ${stats.change.toFixed(
                  2,
                )} (${stats.changePercent.toFixed(2)}%)</text>
                
                <text x="10" y="80" fill="#e1e4e8" font-size="11" font-family="Inter, system-ui, sans-serif">Bars: ${
                  stats.count
                } | Vol: ${formatVolume(stats.volume)}</text>
                
                <text x="10" y="100" fill="#e1e4e8" font-size="11" font-family="Inter, system-ui, sans-serif">Time: ${formatDuration(
                  stats.duration,
                )}</text>
            </svg>`;
};
