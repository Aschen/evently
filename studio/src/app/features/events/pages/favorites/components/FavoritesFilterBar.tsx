import React from "react";
import { 
  Box, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button,
  InputAdornment,
  Stack
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { LocationSearchBar } from "../../../components/LocationSearchBar";
import { EventFilters } from "../../../components/EventFilters";
import type { Event } from "../../../models/event.model";

interface FavoritesFilterBarProps {
  onSearchChange: (search: string) => void;
  onLocationChange: (location: string) => void;
  onTypeChange: (type: Event['type'] | '') => void;
  onIsFreeChange: (isFree?: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  currentFilters: {
    search: string;
    location: string;
    type: Event['type'] | '';
    isFree?: boolean;
  };
}

export const FavoritesFilterBar: React.FC<FavoritesFilterBarProps> = ({
  onSearchChange,
  onLocationChange,
  onTypeChange,
  onIsFreeChange,
  onClearFilters,
  hasActiveFilters,
  currentFilters
}) => {
  const eventTypes: Array<{value: Event['type'] | '', label: string}> = [
    { value: '', label: 'All Types' },
    { value: 'concert', label: 'Concert' },
    { value: 'exhibition', label: 'Exhibition' },
    { value: 'conference', label: 'Conference' },
    { value: 'sport', label: 'Sport' },
    { value: 'festival', label: 'Festival' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <Box sx={{ mb: 3 }}>
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={2} 
        sx={{ mb: 2 }}
      >
        <TextField
          fullWidth
          placeholder="Search favorite events..."
          value={currentFilters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flex: { md: 2 } }}
        />
        
        <Box sx={{ flex: { md: 2 } }}>
          <LocationSearchBar 
            onLocationSelect={onLocationChange} 
            initialValue={currentFilters.location}
          />
        </Box>
        
        <FormControl fullWidth sx={{ flex: { md: 1 } }}>
          <InputLabel>Event Type</InputLabel>
          <Select
            value={currentFilters.type}
            label="Event Type"
            onChange={(e) => onTypeChange(e.target.value as Event['type'] | '')}
          >
            {eventTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <EventFilters onFilterChange={onIsFreeChange} />
        
        {hasActiveFilters && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearIcon />}
            onClick={onClearFilters}
            sx={{ ml: 'auto' }}
          >
            Clear Filters
          </Button>
        )}
      </Box>
    </Box>
  );
};