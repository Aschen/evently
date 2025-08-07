import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Box, Snackbar, Alert } from "@mui/material";
import { useAuth } from "../../../auth/hooks/useAuth";
import { useFavorites } from "./hooks/useFavorites";
import { FavoritesPageHeader } from "./components/FavoritesPageHeader";
import { FavoritesFilterBar } from "./components/FavoritesFilterBar";
import { FavoritesEventGrid } from "./components/FavoritesEventGrid";
import { EmptyFavoritesState } from "./components/EmptyFavoritesState";
import { FavoritesPagination } from "./components/FavoritesPagination";
import type { Event } from "../../models/event.model";

const PAGE_SIZE_DEFAULT = 12;

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    events, 
    total, 
    loading, 
    error, 
    filters, 
    updateFilters, 
    removeFavorite 
  } = useFavorites(PAGE_SIZE_DEFAULT);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Business rule: rule-favorites-authentication-required
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { returnUrl: '/favorites' } });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleRemoveFavorite = async (eventId: string) => {
    try {
      await removeFavorite(eventId);
      // Business rule: rule-favorites-confirmation-on-remove
      setSnackbar({
        open: true,
        message: 'Event removed from favorites',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to remove from favorites',
        severity: 'error'
      });
    }
  };

  const handleClearFilters = () => {
    updateFilters({
      search: '',
      location: '',
      type: '',
      isFree: undefined,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || 
    filters.location || 
    filters.type || 
    filters.isFree !== undefined
  );

  const currentPage = Math.floor(filters.from / filters.size) + 1;
  const totalPages = Math.ceil(total / filters.size);

  const isEmpty = !loading && events.length === 0 && !hasActiveFilters;
  const isEmptyWithFilters = !loading && events.length === 0 && hasActiveFilters;

  if (authLoading) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <FavoritesPageHeader totalFavorites={total} />
      
      {!isEmpty && (
        <FavoritesFilterBar
          onSearchChange={(search) => updateFilters({ search })}
          onLocationChange={(location) => updateFilters({ location })}
          onTypeChange={(type) => updateFilters({ type })}
          onIsFreeChange={(isFree) => updateFilters({ isFree })}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          currentFilters={{
            search: filters.search || '',
            location: filters.location || '',
            type: (filters.type || '') as Event['type'] | '',
            isFree: filters.isFree,
          }}
        />
      )}

      {isEmpty ? (
        <EmptyFavoritesState />
      ) : (
        <>
          <FavoritesEventGrid
            events={events}
            loading={loading}
            error={error}
            onRemoveFavorite={handleRemoveFavorite}
          />

          {isEmptyWithFilters && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              No favorite events match your filters
            </Box>
          )}

          {!loading && events.length > 0 && (
            <FavoritesPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={filters.size}
              totalItems={total}
              from={filters.from}
              onPageChange={(page) => updateFilters({ from: (page - 1) * filters.size })}
              onPageSizeChange={(size) => updateFilters({ size, from: 0 })}
            />
          )}
        </>
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
    </Container>
  );
};