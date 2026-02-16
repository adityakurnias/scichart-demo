import React from "react";
import {
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PanToolIcon from "@mui/icons-material/PanTool";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import AdsClickIcon from "@mui/icons-material/AdsClick"; // Cursor/Select
import HighlightAltIcon from "@mui/icons-material/HighlightAlt"; // Selection

interface ChartToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  activeTool,
  onToolChange,
}) => {
  const theme = useTheme();
  // Use MUI breakpoint to detect mobile (sm or down)
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleFormat = (
    _event: React.MouseEvent<HTMLElement>,
    newFormat: string | null,
  ) => {
    if (newFormat !== null) {
      onToolChange(newFormat);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: isMobile ? "relative" : "fixed",
        zIndex: 1000,
        // Responsive positioning
        width: isMobile ? "100%" : "auto",
        bottom: isMobile ? "auto" : "auto",
        top: isMobile ? "auto" : "50%",
        left: isMobile ? "auto" : 20,
        transform: isMobile ? "none" : "translateY(-50%)",
        display: "flex",
        flexDirection: isMobile ? "row" : "column",
        justifyContent: isMobile ? "center" : "flex-start",
        backgroundColor: "rgba(30,30,30, 0.8)", // Semi-transparent dark bg
        backdropFilter: "blur(5px)",
        borderTop: isMobile ? "1px solid rgba(255,255,255,0.1)" : "none",
        border: isMobile ? "none" : "1px solid rgba(255,255,255,0.1)",
        borderRadius: isMobile ? 0 : 1, // Square corners on mobile
        padding: isMobile ? 1 : 0,
      }}
    >
      <ToggleButtonGroup
        value={activeTool}
        exclusive
        onChange={handleFormat}
        orientation={isMobile ? "horizontal" : "vertical"}
        aria-label="chart tools"
        size="large"
      >
        <ToggleButton value="pan" aria-label="pan" sx={{ color: "white" }}>
          <PanToolIcon />
        </ToggleButton>
        <ToggleButton
          value="selection"
          aria-label="selection"
          sx={{ color: "white" }}
        >
          <HighlightAltIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
};
