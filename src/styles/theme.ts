import { IThemeProvider, SciChartJsNavyTheme } from "scichart";
import { createTheme } from "@mui/material/styles";

// ── TradingView Palette Constants ────────────────────────────────────────────
export const TV = {
  Background: "#131722", // App/chart bg      → $color-bg
  Surface: "#1e222d", // Panel/card bg      → $color-surface
  Border: "#2a2e39", // Grid / dividers    → $color-border
  TextPrimary: "#d1d4dc", //                    → $color-text-primary
  TextMuted: "#787b86", // Axis labels        → $color-text-secondary
  Blue: "#2962ff", // Accent / links     → $color-blue
  BlueLight: "#4e7eff",
  BlueDark: "#1e53e5",
  Green: "#089981", // Bullish candle     → $color-green
  Red: "#f23645", // Bearish candle     → $color-red
} as const;

// ── MUI Theme (used by ThemeProvider in App.tsx) ─────────────────────────────
export const muiTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: TV.Background,
      paper: TV.Surface,
    },
    divider: TV.Border,
    text: {
      primary: TV.TextPrimary,
      secondary: TV.TextMuted,
    },
    primary: {
      main: TV.Blue,
      light: TV.BlueLight,
      dark: TV.BlueDark,
    },
    success: { main: TV.Green },
    error: { main: TV.Red },
  },
  shape: { borderRadius: 4 },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" }, // remove MUI dark mode gradient
      },
    },
    MuiTableCell: { styleOverrides: { root: { borderColor: TV.Border } } },
    MuiSelect: { styleOverrides: { root: { borderColor: TV.Border } } },
    MuiOutlinedInput: {
      styleOverrides: { notchedOutline: { borderColor: TV.Border } },
    },
    MuiMenuItem: {
      styleOverrides: { root: { "&:hover": { backgroundColor: TV.Border } } },
    },
  },
});

// ── SciChart App Theme (used by chart components) ────────────────────────────
export interface AppThemeBase {
  SciChartJsTheme: IThemeProvider;
  ForegroundColor: string;
  Background: string;
  VividSkyBlue: string;
  VividPink: string;
  VividTeal: string;
  VividOrange: string;
  VividBlue: string;
  VividPurple: string;
  VividGreen: string;
  VividRed: string;
  MutedSkyBlue: string;
  MutedPink: string;
  MutedTeal: string;
  MutedOrange: string;
  MutedBlue: string;
  MutedPurple: string;
  MutedRed: string;
  PaleSkyBlue: string;
  PalePink: string;
  PaleTeal: string;
  PaleOrange: string;
  PaleBlue: string;
  PalePurple: string;
}

export class SciChart2022AppTheme implements AppThemeBase {
  SciChartJsTheme = new SciChartJsNavyTheme();

  // Core TV colors (reference the shared TV object)
  TV_Background = TV.Background;
  TV_Surface = TV.Surface;
  TV_Grid = TV.Border;
  TV_Green = TV.Green;
  TV_Red = TV.Red;
  TV_Blue = TV.Blue;
  TV_Cursor = TV.TextMuted;
  LegendText = TV.TextMuted;

  ForegroundColor = TV.TextPrimary;
  Background = TV.Background;

  /** @deprecated Use TV_Surface */ DarkIndigo = TV.Surface;
  /** @deprecated Use TV_Blue   */ Indigo = TV.Blue;

  // Vivid series colors
  VividSkyBlue = TV.Blue;
  VividPink = "#e040fb";
  VividTeal = "#00bcd4";
  VividOrange = "#ff9800";
  VividBlue = TV.Blue;
  VividPurple = "#aa00ff";
  VividGreen = TV.Green;
  VividRed = TV.Red;

  // Muted series colors
  MutedSkyBlue = "#83d2f5";
  MutedPink = "#df69a8";
  MutedTeal = "#7bcaab";
  MutedOrange = "#e7c565";
  MutedBlue = "#537abd";
  MutedPurple = "#a16dae";
  MutedRed = "#dc7969";

  // Pale series colors
  PaleSkyBlue = "#e4f5fc";
  PalePink = "#eeb3d2";
  PaleTeal = "#b9e0d4";
  PaleOrange = "#f1cfb5";
  PaleBlue = "#b5bedf";
  PalePurple = "#cfb4d5";

  get TradingViewTheme(): IThemeProvider {
    const theme = new SciChartJsNavyTheme();
    theme.sciChartBackground = TV.Background;
    theme.loadingAnimationBackground = TV.Background;
    theme.gridBackgroundBrush = TV.Background;
    theme.majorGridLineBrush = TV.Border;
    theme.minorGridLineBrush = TV.Border;
    theme.axisBorder = "Transparent";
    theme.tickTextBrush = TV.TextMuted;
    return theme;
  }
}

export const appTheme = new SciChart2022AppTheme();
