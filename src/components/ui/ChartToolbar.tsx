import React from "react";
import {
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  Divider,
  Box,
} from "@mui/material";
import PanToolIcon from "@mui/icons-material/PanTool";
import HighlightAltIcon from "@mui/icons-material/HighlightAlt";
import DeleteIcon from "@mui/icons-material/Delete";

interface ChartToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  isCursorEnabled: boolean;
  onToggleCursor: () => void;
  onAddLine: () => void;
  onAddBox: () => void;
  onDeleteSelected: () => void;
  style?: React.CSSProperties;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  activeTool,
  onToolChange,
  isCursorEnabled,
  onToggleCursor,
  onAddLine,
  onAddBox,
  onDeleteSelected,
  style,
}) => {
  const theme = useTheme();
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
      style={style}
      sx={{
        position: "relative",
        zIndex: 1000,
        width: isMobile ? "100%" : "auto",
        bottom: isMobile ? 0 : "auto",
        // top: isMobile ? "auto" : "50%",
        // left: isMobile ? 0 : 20,
        // transform: isMobile ? "none" : "translateY(-50%)",
        display: "flex",
        flexDirection: isMobile ? "row" : "column",
        justifyContent: isMobile ? "space-around" : "center",
        alignItems: "center",
        backgroundColor: "background.default",
        padding: isMobile ? "10px 0" : "10px 5px",
        borderRight: isMobile ? "none" : "1px solid",
        borderColor: isMobile ? "transparent" : "divider",
        gap: isMobile ? 0 : 1,
        boxShadow: "none",
      }}
    >
      <ToggleButtonGroup
        value={activeTool}
        exclusive
        onChange={handleFormat}
        orientation={isMobile ? "horizontal" : "vertical"}
        aria-label="chart tools"
        size="small"
        sx={{
          "& .MuiToggleButton-root": {
            color: "rgba(255, 255, 255, 0.5)",
            "&.Mui-selected": {
              color: "white",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          },
        }}
      >
        <ToggleButton value="pan" aria-label="pan">
          <Tooltip title="Pan" arrow placement={isMobile ? "top" : "right"}>
            <PanToolIcon />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="selection"
          aria-label="selection"
          sx={{ color: "white" }}
        >
          <HighlightAltIcon />
        </ToggleButton>
      </ToggleButtonGroup>

      <ToggleButton
        value="cursor"
        selected={isCursorEnabled}
        onChange={onToggleCursor}
        aria-label="cursor"
        size="small"
        sx={{
          color: "rgba(255, 255, 255, 0.5)",
          "&.Mui-selected": {
            color: "white",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <Tooltip title="Cursor" arrow placement={isMobile ? "top" : "right"}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path fill="currentColor" d="M11 21v-8H3v-2h8V3h2v8h8v2h-8v8z" />
          </svg>
        </Tooltip>
      </ToggleButton>

      <Divider
        orientation={isMobile ? "vertical" : "horizontal"}
        flexItem
        sx={{
          borderColor: "rgba(255,255,255,0.1)",
          mx: isMobile ? 1 : 0,
          my: isMobile ? 0 : 1,
        }}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "row" : "column",
          gap: 1,
        }}
      >
        <Tooltip title="Add Line" arrow placement={isMobile ? "top" : "right"}>
          <IconButton onClick={onAddLine} sx={{ color: "white" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19 22q-1.25 0-2.125-.875T16 19q0-.35.075-.675t.225-.625l-10-10q-.3.15-.625.225T5 8q-1.25 0-2.125-.875T2 5t.875-2.125T5 2t2.125.875T8 5q0 .35-.075.675T7.7 6.3l10 10q.3-.15.625-.225T19 16q1.25 0 2.125.875T22 19t-.875 2.125T19 22"
              />
            </svg>
          </IconButton>
        </Tooltip>

        <Tooltip title="Add Box" arrow placement={isMobile ? "top" : "right"}>
          <IconButton onClick={onAddBox} sx={{ color: "white" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M5 21q-.825 0-1.413-.587Q3 19.825 3 19V5q0-.825.587-1.413Q4.175 3 5 3h14q.825 0 1.413.587Q21 4.175 21 5v14q0 .825-.587 1.413Q19.825 21 19 21Zm0-2h14V5H5v14Zm0 0V5v14Z"
              />
            </svg>
          </IconButton>
        </Tooltip>

        <Tooltip
          title="Delete Selected"
          arrow
          placement={isMobile ? "top" : "right"}
        >
          <IconButton onClick={onDeleteSelected} sx={{ color: "error.main" }}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};
