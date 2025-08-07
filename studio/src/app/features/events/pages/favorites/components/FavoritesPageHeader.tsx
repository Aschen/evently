import React from "react";
import { Box, Typography } from "@mui/material";

interface FavoritesPageHeaderProps {
  totalFavorites: number;
}

export const FavoritesPageHeader: React.FC<FavoritesPageHeaderProps> = ({ totalFavorites }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
        My Favorite Events
      </Typography>
      <Typography variant="h6" color="text.secondary">
        You have {totalFavorites} favorite event{totalFavorites !== 1 ? 's' : ''}
      </Typography>
    </Box>
  );
};