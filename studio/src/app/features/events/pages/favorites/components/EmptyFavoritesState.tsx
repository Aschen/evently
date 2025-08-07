import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

export const EmptyFavoritesState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box 
      sx={{ 
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        py: 8,
        px: 2,
      }}
    >
      <FavoriteBorderIcon 
        sx={{ 
          fontSize: 120, 
          color: "text.disabled",
          mb: 3,
        }} 
      />
      <Typography variant="h5" gutterBottom>
        No favorite events yet
      </Typography>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ mb: 4, maxWidth: 400 }}
      >
        Events you mark as favorites will appear here
      </Typography>
      <Button 
        variant="contained" 
        color="primary"
        size="large"
        onClick={() => navigate('/')}
      >
        Browse events
      </Button>
    </Box>
  );
};