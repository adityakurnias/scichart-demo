import React from "react";
import { Box, Button } from "@mui/material";
import { appTheme } from "../../../../Shared/styles/theme";
import { useTimeFrameSelector } from "../../../../Shared/hooks/useTimeFrameSelector";

interface TimeFrameSelectorProps {
  onPeriodChange: (period: string) => void;
  selectedPeriod: string;
}

export const TimeFrameSelectorMobile: React.FC<TimeFrameSelectorProps> = ({
  onPeriodChange,
  selectedPeriod,
}) => {
  const { PERIODS, handlePeriodClick } = useTimeFrameSelector(onPeriodChange);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        backgroundColor: appTheme.Background,
        padding: "2px 4px",
        borderRadius: "4px",
        overflowX: "auto",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      {PERIODS.map((period) => (
        <Button
          key={period.label}
          variant="text"
          size="large"
          onClick={() => handlePeriodClick(period)}
          sx={{
            minWidth: "auto",
            padding: "2px 4px",
            color:
              selectedPeriod === period.label
                ? appTheme.VividBlue
                : appTheme.LegendText,
            fontWeight: selectedPeriod === period.label ? "bold" : "normal",
            fontSize: "12px",
            "&:hover": {
              color: appTheme.VividBlue,
              backgroundColor: "rgba(41, 98, 255, 0.08)",
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
