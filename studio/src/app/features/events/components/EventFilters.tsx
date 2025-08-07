import React from "react";
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

interface EventFiltersProps {
  onFilterChange: (isFree?: boolean) => void;
}

export const EventFilters: React.FC<EventFiltersProps> = ({ onFilterChange }) => {
  const [filterValue, setFilterValue] = React.useState<string>("all");

  const handleFilterChange = (_: React.MouseEvent<HTMLElement>, newValue: string | null) => {
    if (newValue !== null) {
      setFilterValue(newValue);
      
      // Business rule: rule-events-free-paid-filter - Users should be able to filter events by free/paid status
      switch (newValue) {
        case "all":
          onFilterChange(undefined);
          break;
        case "free":
          onFilterChange(true);
          break;
        case "paid":
          onFilterChange(false);
          break;
      }
    }
  };

  return (
    <Box sx={{ 
      display: "flex", 
      flexDirection: { xs: "column", sm: "row" }, 
      alignItems: "center",
      gap: 2,
      mb: 3,
      mt: 2,
    }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
        Filter by:
      </Typography>
      <ToggleButtonGroup
        value={filterValue}
        exclusive
        onChange={handleFilterChange}
        aria-label="event price filter"
        sx={{
          // Business rule: rule-events-filter-visual-feedback - Active filter should be clearly indicated
          "& .MuiToggleButton-root": {
            px: 3,
            py: 1,
            textTransform: "none",
            fontSize: "0.95rem",
            "&.Mui-selected": {
              backgroundColor: "primary.main",
              color: "white",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            },
          },
        }}
      >
        <ToggleButton value="all" aria-label="all events">
          All Events
        </ToggleButton>
        <ToggleButton value="free" aria-label="free events">
          Free Events
        </ToggleButton>
        <ToggleButton value="paid" aria-label="paid events">
          Paid Events
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};