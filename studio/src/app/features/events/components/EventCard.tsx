import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import type { Event } from "../models/event.model";

interface EventCardProps {
  event: Event;
  onFavoriteToggle?: () => void;
  isFavoriteView?: boolean;
}

const eventTypeColors: Record<Event["type"], string> = {
  concert: "#e91e63",
  exhibition: "#9c27b0",
  conference: "#3f51b5",
  sport: "#009688",
  festival: "#ff9800",
  other: "#607d8b",
};

export const EventCard: React.FC<EventCardProps> = ({ event, onFavoriteToggle, isFavoriteView }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = () => {
    // Business rule: rule-events-price-display - Events should clearly indicate if they are free
    if (event.price.isFree) {
      return "Free";
    }
    return `${event.price.amount} ${event.price.currency}`;
  };

  const formatLocation = () => {
    const { address, city, country } = event.location;
    return `${address}, ${city}, ${country}`;
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: 2,
        transition: "transform 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 3,
        },
      }}
    >
      {/* Always show placeholder image */}
      <Box sx={{ position: "relative" }}>
        <Box
          component="img"
          src="https://placehold.co/600x400"
          alt={event.name}
          sx={{
            width: "100%",
            height: 200,
            objectFit: "cover",
          }}
        />
        {onFavoriteToggle && (
          <Tooltip title={isFavoriteView ? "Remove from favorites" : (event.isFavorited ? "Remove from favorites" : "Add to favorites")}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle();
              }}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 1)",
                },
              }}
            >
              {isFavoriteView || event.isFavorited ? (
                <FavoriteIcon sx={{ color: "red" }} />
              ) : (
                <FavoriteBorderIcon />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {event.name}
        </Typography>
        
        <Stack spacing={1} sx={{ mt: 1, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarTodayIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {formatDate(event.date)}
            </Typography>
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocationOnIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {formatLocation()}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "auto" }}>
          {/* Business rule: rule-events-type-categorization - Event types should be visually distinct */}
          <Chip
            label={event.type}
            size="small"
            sx={{
              backgroundColor: eventTypeColors[event.type],
              color: "white",
            }}
          />
          <Typography variant="h6" color="primary">
            {formatPrice()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};