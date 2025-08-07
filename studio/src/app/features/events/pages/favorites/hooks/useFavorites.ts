import { useState, useCallback, useEffect } from "react";
import { Api } from "../../../../../shared/libs/api";
import { EventsFavoritesListResponseDto } from "@evently/api-client";
import type { Event } from "../../../models/event.model";

interface FavoritesFilters {
  search?: string;
  location?: string;
  type?: Event['type'] | '';
  isFree?: boolean;
  from: number;
  size: number;
}

interface UseFavoritesReturn {
  events: Event[];
  total: number;
  loading: boolean;
  error: Error | null;
  filters: FavoritesFilters;
  updateFilters: (newFilters: Partial<FavoritesFilters>) => void;
  removeFavorite: (eventId: string) => Promise<void>;
  refetch: () => void;
}

export const useFavorites = (pageSize: number = 10): UseFavoritesReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<FavoritesFilters>({
    from: 0,
    size: pageSize,
  });

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Business rule: rule-favorites-authentication-required
      const params: any = {
        from: filters.from,
        size: filters.size,
      };

      if (filters.search) params.search = filters.search;
      if (filters.location) params.location = filters.location;
      if (filters.type) params.type = filters.type;
      if (filters.isFree !== undefined) params.isFree = filters.isFree;

      const response = await Api.get<EventsFavoritesListResponseDto>('/events/favorites', { params });
      
      setEvents(response.data.events);
      setTotal(response.data.total);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Business rule: rule-favorites-authentication-required - Redirect handled by auth context
        setError(new Error('Authentication required to view favorites'));
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const removeFavorite = useCallback(async (eventId: string) => {
    try {
      // Business rule: rule-favorites-realtime-sync
      await Api.delete(`/events/${eventId}/favorites`);
      
      // Optimistically update the UI
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setTotal(prev => Math.max(0, prev - 1));
      
      // If the current page is now empty and it's not the first page, go back one page
      if (events.length === 1 && filters.from > 0) {
        const newFrom = Math.max(0, filters.from - filters.size);
        setFilters(prev => ({ ...prev, from: newFrom }));
      }
    } catch (err: any) {
      setError(err);
      // Revert on error
      fetchFavorites();
    }
  }, [events.length, filters.from, filters.size, fetchFavorites]);

  const updateFilters = useCallback((newFilters: Partial<FavoritesFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // Business rule: rule-favorites-maintain-filters
      // Reset to first page when filters change (except pagination)
      if ('search' in newFilters || 'location' in newFilters || 
          'type' in newFilters || 'isFree' in newFilters) {
        updated.from = 0;
      }
      
      return updated;
    });
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    events,
    total,
    loading,
    error,
    filters,
    updateFilters,
    removeFavorite,
    refetch: fetchFavorites,
  };
};