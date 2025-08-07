import React, { useState, useCallback, useEffect } from "react";
import {
  TextField,
  Autocomplete,
  InputAdornment,
  CircularProgress,
  Box,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useDebounce } from "../hooks/useDebounce";
import { useLocationSuggestions } from "../hooks/useLocationSuggestions";
import type { LocationSuggestion } from "../models/event.model";

interface LocationSearchBarProps {
  onLocationSelect: (location: string) => void;
  initialValue?: string;
}

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  onLocationSelect,
  initialValue = "",
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const debouncedQuery = useDebounce(inputValue, 300);
  const { suggestions, loading, fetchSuggestions } = useLocationSuggestions();

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      fetchSuggestions(debouncedQuery);
    }
  }, [debouncedQuery, fetchSuggestions]);

  const handleLocationSelect = useCallback(
    (_event: React.SyntheticEvent, value: LocationSuggestion | null) => {
      setSelectedLocation(value);
      if (value) {
        // Business rule: rule-events-location-search - Search results should filter events based on the selected location
        // Send only the city for better matching with the backend filter
        onLocationSelect(value.city);
      }
    },
    [onLocationSelect]
  );

  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, value: string) => {
      setInputValue(value);
      if (!value) {
        onLocationSelect("");
      }
    },
    [onLocationSelect]
  );

  return (
    <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", mb: 4 }}>
      <Autocomplete
        value={selectedLocation}
        onChange={handleLocationSelect}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        options={suggestions}
        getOptionLabel={(option) => option.displayName}
        loading={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            variant="outlined"
            placeholder="Search events by location..."
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Box>
  );
};