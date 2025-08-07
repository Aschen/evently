import { useState, useCallback } from "react";
import { Api } from "../../../shared/libs/api";
import type { Event } from "../models/event.model";

interface FetchEventsParams {
  from?: number;
  size?: number;
  location?: string;
  search?: string;
  type?: Event["type"];
  isFree?: boolean;
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);

  const fetchEvents = useCallback(async (params: FetchEventsParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await Api.get("/events", {
        params: {
          from: params.from || 0,
          size: params.size || 12,
          ...(params.location && { location: params.location }),
          ...(params.search && { search: params.search }),
          ...(params.type && { type: params.type }),
          ...(params.isFree !== undefined && { isFree: params.isFree }),
        },
      });
      setEvents(response.data.events);
      setTotal(response.data.total);
    } catch (err) {
      setError(err as Error);
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    total,
    loading,
    error,
    page,
    setPage,
    fetchEvents,
  };
}