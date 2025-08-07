import React, { useEffect, useCallback, useState } from "react";
import {
  Grid,
  Box,
  Typography,
  CircularProgress,
  Pagination,
  Snackbar,
  Alert,
} from "@mui/material";
import { EventCard } from "./EventCard";
import { useEvents } from "../hooks/useEvents";
import { useAuth } from "../../auth/hooks/useAuth";
import { Api } from "../../../shared/libs/api";

interface EventsListProps {
  location?: string;
  isFree?: boolean;
}

const PAGE_SIZE = 12;

export const EventsList: React.FC<EventsListProps> = ({ location, isFree }) => {
  const { events, total, loading, error, page, setPage, fetchEvents } = useEvents();
  const { isAuthenticated } = useAuth();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    // Business rule: rule-events-pagination - Implement pagination using from and size parameters
    // Business rule: rule-events-filter-persistence - Filter state should persist across pagination
    fetchEvents({
      from: (page - 1) * PAGE_SIZE,
      size: PAGE_SIZE,
      location,
      isFree,
    });
  }, [page, location, isFree, fetchEvents]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleFavoriteToggle = useCallback(async (eventId: string) => {
    if (!isAuthenticated) {
      setSnackbar({
        open: true,
        message: 'Please login to add favorites',
        severity: 'error'
      });
      return;
    }

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    try {
      if (event.isFavorited) {
        await Api.delete(`/events/${eventId}/favorites`);
        setSnackbar({
          open: true,
          message: 'Event removed from favorites',
          severity: 'success'
        });
      } else {
        await Api.post(`/events/${eventId}/favorites`);
        setSnackbar({
          open: true,
          message: 'Event added to favorites',
          severity: 'success'
        });
      }
      
      // Refresh the events to update the favorite status
      fetchEvents({
        from: (page - 1) * PAGE_SIZE,
        size: PAGE_SIZE,
        location,
        isFree,
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to update favorites',
        severity: 'error'
      });
    }
  }, [events, isAuthenticated, fetchEvents, page, location, isFree]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="error">
          Failed to load events
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {error.message}
        </Typography>
      </Box>
    );
  }

  if (events.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No events found
        </Typography>
        {location && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try searching for a different location
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid
            item
            key={event.id}
            xs={12}
            sm={6}
            md={4}
            lg={3}
          >
            <EventCard 
              event={event} 
              onFavoriteToggle={() => handleFavoriteToggle(event.id)}
            />
          </Grid>
        ))}
      </Grid>
      
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};