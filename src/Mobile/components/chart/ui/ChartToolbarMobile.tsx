import React from "react";
import {
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Box,
} from "@mui/material";
import PanToolIcon from "@mui/icons-material/PanTool";
import HighlightAltIcon from "@mui/icons-material/HighlightAlt";
import { useChartToolbar } from "../../../../Shared/hooks/useChartToolbar";

interface ChartToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onAddLine: () => void;
  onAddBox: () => void;
  style?: React.CSSProperties;
}

export const ChartToolbarMobile: React.FC<ChartToolbarProps> = ({
  activeTool,
  onToolChange,
  onAddLine,
  onAddBox,
  style,
}) => {
  const { handleFormat } = useChartToolbar(onToolChange);

  return (
    <Paper
      elevation={3}
      style={style}
      sx={{
        position: "relative",
        zIndex: 1000,
        width: "100%",
        bottom: 0,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: "background.default",
        padding: "5px 0",
        borderRight: "none",
        borderColor: "transparent",
        gap: 0,
        boxShadow: "none",
      }}
    >
      <ToggleButtonGroup
        value={activeTool}
        exclusive
        onChange={handleFormat}
        orientation="horizontal"
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
          <Tooltip title="Pan" arrow placement="top">
            <PanToolIcon />
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="measurement"
          aria-label="measurement"
          sx={{ color: "white" }}
        >
          <HighlightAltIcon />
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider
        orientation="vertical"
        flexItem
        sx={{
          borderColor: "rgba(255,255,255,0.1)",
          mx: 1,
          my: 0,
        }}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 1,
        }}
      >
        <Tooltip title="Add Line" arrow placement="top">
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

        <Tooltip title="Add Box" arrow placement="top">
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
      </Box>
    </Paper>
  );
}
