import React from "react";
import { Grid, Box, Typography, Skeleton } from "@mui/material";
import { EventCard } from "../../../components/EventCard";
import type { Event } from "../../../models/event.model";

interface FavoritesEventGridProps {
  events: Event[];
  loading: boolean;
  error: Error | null;
  onRemoveFavorite: (eventId: string) => void;
}

export const FavoritesEventGrid: React.FC<FavoritesEventGridProps> = ({
  events,
  loading,
  error,
  onRemoveFavorite,
}) => {
  if (loading) {
    return (
      <Grid container spacing={3}>
        {[...Array(6)].map((_, index) => (
          <Grid item key={index} xs={12} sm={6} md={4}>
            <Box>
              <Skeleton variant="rectangular" height={200} />
              <Box sx={{ p: 2 }}>
                <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="80%" />
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load favorite events
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {error.message}
        </Typography>
      </Box>
    );
  }

  if (events.length === 0) {
    return null; // The empty state will be handled by the parent component
  }

  return (
    <Grid container spacing={3}>
      {events.map((event) => (
        <Grid
          item
          key={event.id}
          xs={12}
          sm={6}
          md={4}
        >
          <EventCard 
            event={event} 
            onFavoriteToggle={() => onRemoveFavorite(event.id)}
            isFavoriteView={true}
          />
        </Grid>
      ))}
    </Grid>
  );
};