import React, { useState } from "react";
import { Container, Box, Typography } from "@mui/material";
import { LocationSearchBar } from "../../components/LocationSearchBar";
import { EventFilters } from "../../components/EventFilters";
import { EventsList } from "../../components/EventsList";

export const HomePage: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [isFreeFilter, setIsFreeFilter] = useState<boolean | undefined>(undefined);

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "calc(100vh - 64px)" }}>
      <Box sx={{ bgcolor: "primary.main", color: "white", py: 4, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h1" align="center" gutterBottom>
            Discover Events Near You
          </Typography>
          <Typography variant="h6" align="center" sx={{ mb: 3 }}>
            Find concerts, exhibitions, conferences, and more
          </Typography>
        </Container>
      </Box>
      
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        <LocationSearchBar onLocationSelect={setSelectedLocation} />
        <EventFilters onFilterChange={setIsFreeFilter} />
        <EventsList location={selectedLocation} isFree={isFreeFilter} />
      </Container>
    </Box>
  );
};