import React from "react";
import { Box, Typography, Paper } from "@mui/material";

const SummaryWidget = ({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change: string;
}) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      {title}
    </Typography>
    <Typography variant="h5" sx={{ my: 1, fontWeight: "bold" }}>
      {value}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        color: change.startsWith("+") ? "success.main" : "error.main",
      }}
    >
      {change}
    </Typography>
  </Paper>
);

const DashboardPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Dashboard
      </Typography>
      <Box
        sx={{
          mt: 4,
          p: 3,
          bgcolor: "background.paper",
          borderRadius: 1,
          minHeight: "300px",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Activity
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No recent activity.
        </Typography>
      </Box>
    </Box>
  );
};

export default DashboardPage;
