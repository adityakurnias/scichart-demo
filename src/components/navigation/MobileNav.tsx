import React from "react";
import {
  Box,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CandlestickChartIcon from "@mui/icons-material/CandlestickChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { useNavigate, useLocation } from "react-router-dom";

const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getValue = (path: string) => {
    if (path === "/") return 0;
    if (path.startsWith("/markets")) return 1;
    if (path.startsWith("/trade")) return 2;
    if (path.startsWith("/portfolio")) return 3;
    return 0;
  };

  const value = getValue(location.pathname);

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: "background.default",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_event, newValue) => {
          switch (newValue) {
            case 0:
              navigate("/");
              break;
            case 1:
              navigate("/markets");
              break;
            case 2:
              navigate("/trade");
              break;
          }
        }}
        sx={{
          backgroundColor: "transparent",
          "& .MuiBottomNavigationAction-root": {
            color: "text.secondary",
            minWidth: "auto",
            padding: "6px 12px 8px",
            "&.Mui-selected": {
              color: "primary.main", // TV Blue #2962ff
            },
          },
        }}
      >
        <BottomNavigationAction label="Home" icon={<DashboardIcon />} />
        <BottomNavigationAction label="Markets" icon={<ShowChartIcon />} />
        <BottomNavigationAction label="Trade" icon={<CandlestickChartIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileNav;
