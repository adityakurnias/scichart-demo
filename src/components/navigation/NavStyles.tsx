import { styled } from "@mui/material/styles";
import { NavLink } from "react-router-dom";

export const NavItem = styled(NavLink)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.text.secondary,
  textDecoration: "none",
  padding: "10px",
  borderRadius: theme.shape.borderRadius,
  transition: "all 0.2s ease",
  "&:hover": {
    color: theme.palette.text.primary,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  "&.active": {
    color: theme.palette.primary.main, // TV Blue #2962FF
    backgroundColor: `${theme.palette.primary.main}1a`, // 10% opacity
  },
}));
