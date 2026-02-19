import React from "react";
import { Box, Typography, IconButton, Avatar } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import { Link } from "react-router-dom";

const Navbar = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: "50px",
        backgroundColor: "background.default",
        borderBottom: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: 24,
              height: 24,
              background: theme.palette.primary.main,
              borderRadius: "50%",
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: "text.primary",
              fontWeight: "bold",
              fontSize: "1.1rem",
            }}
          >
            SciChart Demo
          </Typography>
        </Link>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <IconButton size="small" sx={{ color: "text.secondary" }}>
          <NotificationsIcon fontSize="small" />
        </IconButton>

        <IconButton size="small" sx={{ color: "text.secondary" }}>
          <Avatar sx={{ width: 24, height: 24, bgcolor: "divider" }}>
            <PersonIcon fontSize="small" sx={{ color: "text.secondary" }} />
          </Avatar>
        </IconButton>
      </Box>
    </Box>
  );
};

export default Navbar;
