import { useState, useCallback } from "react";
import { Api } from "../../../shared/libs/api";
import type { LocationSuggestion } from "../models/event.model";

export function useLocationSuggestions() {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await Api.get("/events/locations", {
        params: { query, limit: 10 },
      });
      setSuggestions(response.data.suggestions);
    } catch (err) {
      setError(err as Error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    suggestions,
    loading,
    error,
    fetchSuggestions,
  };
}