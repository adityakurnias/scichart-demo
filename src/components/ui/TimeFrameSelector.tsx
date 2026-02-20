import React, { useState } from "react";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

import { appTheme } from "../../styles/theme";

interface TimeRange {
  from: number;
  to: number;
}

interface TimeFrameSelectorProps {
  onPeriodChange: (period: string) => void;
  selectedPeriod: string;
}

const PERIODS = [
  { label: "1D", days: 1 },
  { label: "5D", days: 5 },
  { label: "1M", months: 1 },
  { label: "6M", months: 6 },
  { label: "YTD", ytd: true },
  { label: "1Y", years: 1 },
  { label: "5Y", years: 5 },
  { label: "All", all: true },
];

export const TimeFrameSelector: React.FC<TimeFrameSelectorProps> = ({
  onPeriodChange,
  selectedPeriod,
}) => {
  const handlePeriodClick = (period: (typeof PERIODS)[0]) => {
    onPeriodChange(period.label);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        backgroundColor: appTheme.Background,
        padding: "4px 8px",
        borderRadius: "4px",
      }}
    >
      {PERIODS.map((period) => (
        <Button
          key={period.label}
          variant="text"
          size="small"
          onClick={() => handlePeriodClick(period)}
          sx={{
            minWidth: "auto",
            padding: "4px 8px",
            color:
              selectedPeriod === period.label
                ? appTheme.VividBlue
                : appTheme.LegendText,
            fontWeight: selectedPeriod === period.label ? "bold" : "normal",
            fontSize: "13px",
            "&:hover": {
              color: appTheme.VividBlue,
              backgroundColor: "rgba(41, 98, 255, 0.08)", // Keep opacity helper or move to theme if possible
            },
            textTransform: "none",
          }}
        >
          {period.label}
        </Button>
      ))}
    </Box>
  );
};
