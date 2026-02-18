import { appTheme } from "../../../styles/theme";
import { formatVolume, formatDuration } from "../../../utils/formatters";
import { Stats } from "../utils/ChartStats";

export const getStatsTooltip = (
  stats: Stats,
  isMinimized: boolean = false,
  tooltipId: string = "",
): string => {
  const width = isMinimized ? 30 : 220;
  const height = isMinimized ? 30 : 130;

  const btnText = isMinimized ? "[!]" : "[-]";
  const btnColor = "#8892b0";
  const btnClass = "tooltip-minimize-btn" + (tooltipId ? `-${tooltipId}` : "");

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="100%" height="100%" fill="#141821" stroke="#444" rx="6" ry="6" fill-opacity="0.95"/>
    
    <text class="${btnClass}" x="${width - 25}" y="20" fill="${btnColor}" font-size="12" font-family="monospace" font-weight="bold" cursor="pointer" pointer-events="all">${btnText}</text>
  `;

  if (!isMinimized) {
    svg += `
      <text x="10" y="20" fill="#e1e4e8" font-size="11" font-family="Inter, system-ui, sans-serif" font-weight="bold" pointer-events="none">Range: ${stats.minLow.toFixed(2)} — ${stats.maxHigh.toFixed(2)}</text>
      <text x="10" y="40" fill="#e1e4e8" font-size="11" font-family="Inter, system-ui, sans-serif" pointer-events="none">Avg: ${stats.avg.toFixed(2)}</text>
      <text x="10" y="60" fill="${stats.change >= 0 ? appTheme.TV_Green : appTheme.TV_Red}" font-size="11" font-family="Inter, system-ui, sans-serif" pointer-events="none">Change: ${stats.change.toFixed(2)} (${stats.changePercent.toFixed(2)}%)</text>
      <text x="10" y="80" fill="#e1e4e8" font-size="11" font-family="Inter, system-ui, sans-serif" pointer-events="none">Bars: ${stats.count} | Vol: ${formatVolume(stats.volume)}</text>
      <text x="10" y="100" fill="#e1e4e8" font-size="11" font-family="Inter, system-ui, sans-serif" pointer-events="none">Time: ${formatDuration(stats.duration)}</text>
    `;
  }

  svg += `</svg>`;
  return svg;
};

export const getMeasurementTooltip = (stats: Stats) => {
  const priceDiff = stats.change ? stats.change.toFixed(3) : "0.000";
  const percent = stats.changePercent ? stats.changePercent.toFixed(2) : "0.00";
  const bars = stats.count.toFixed(0);
  const days = formatDuration(stats.duration);
  const volume = formatVolume(stats.volume);

  const sign = stats.change > 0 ? "+" : "";

  return `
    <svg width="150" height="70">
      <rect x="0" y="0" width="150" height="65" rx="6" fill="#2962FF" />
      <text x="75" y="20" font-size="12" font-family="Roboto, sans-serif" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${sign}${priceDiff} (${sign}${percent}%) 
      </text>
      <text x="75" y="38" font-size="12" font-family="Roboto, sans-serif" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${bars} bar, ${days}d
      </text>
      <text x="75" y="56" font-size="12" font-family="Roboto, sans-serif" fill="white" text-anchor="middle" dominant-baseline="middle">
        Vol ${volume}
      </text>
      <polygon points="70,65 80,65 75,70" fill="#2962FF" />
    </svg>
  `;
};
