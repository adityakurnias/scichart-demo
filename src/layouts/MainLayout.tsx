import React from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navigation/Navbar";
import Sidebar from "../components/navigation/Sidebar";
import MobileNav from "../components/navigation/MobileNav";

const MainLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <Navbar />

      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        {!isMobile && <Sidebar />}

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            position: "relative",
            paddingBottom: isMobile ? "56px" : 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {isMobile && <MobileNav />}
    </Box>
  );
};

export default MainLayout;
