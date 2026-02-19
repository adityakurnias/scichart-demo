import React from "react";
import { Box, Tooltip } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CandlestickChartIcon from "@mui/icons-material/CandlestickChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SettingsIcon from "@mui/icons-material/Settings";
import { NavItem } from "./NavStyles";

const Sidebar = () => {
  return (
    <Box
      sx={{
        width: "60px",
        height: "100%",
        backgroundColor: "background.default",
        borderRight: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "20px",
        gap: "10px",
        flexShrink: 0,
      }}
    >
      <Tooltip title="Dashboard" arrow placement="right">
        <NavItem to="/" end>
          <DashboardIcon />
        </NavItem>
      </Tooltip>

      <Tooltip title="Trade" arrow placement="right">
        <NavItem to="/trade">
          <CandlestickChartIcon />
        </NavItem>
      </Tooltip>

      <Tooltip title="Markets" arrow placement="right">
        <NavItem to="/markets">
          <ShowChartIcon />
        </NavItem>
      </Tooltip>

      <Box sx={{ flexGrow: 1 }} />

      <Tooltip title="Settings" arrow placement="right">
        <NavItem to="/settings" style={{ marginBottom: "20px" }}>
          <SettingsIcon />
        </NavItem>
      </Tooltip>
    </Box>
  );
};

export default Sidebar;
