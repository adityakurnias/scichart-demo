import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

const createData = (
  name: string,
  price: string,
  change: string,
  vol: string,
) => {
  return { name, price, change, vol };
};

const MarketsPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Markets
      </Typography>
    </Box>
  );
};

export default MarketsPage;
