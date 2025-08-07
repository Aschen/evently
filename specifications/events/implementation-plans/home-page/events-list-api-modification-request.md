# Evently - API Modification Request

This document will be used by backend developers to modify the API according to the specifications you provide in order to expose the correct API routes and data to realize the view you were asked to create.

You can ask to create or update API routes.

## Instructions

## 1 - CREATE EventsController.list

Create an endpoint to list events with pagination support for the home page.
GET /events
This endpoint will return a paginated list of events with all the required information to display event cards on the home page.

### Parameters:
- `from` (optional, number): The index of the first element to return (default: 0)
- `size` (optional, number): The number of elements to return (default: 20)
- `search` (optional, string): Search term to filter events by name or location
- `location` (optional, string): Filter events by location/address
- `type` (optional, string): Filter events by type (concert, exhibition, etc.)

### Response:
```typescript
{
  events: EventDto[];
  total: number;
}
```

Where `EventDto` should contain:
```typescript
{
  id: string;
  name: string;
  date: string; // ISO 8601 date-time format
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    }
  };
  type: EventType; // enum: "concert" | "exhibition" | "conference" | "sport" | "festival" | "other"
  price: {
    amount: number;
    currency: string; // e.g., "EUR", "USD"
    isFree: boolean;
  };
  description?: string;
  imageUrl?: string;
}
```

## 2 - CREATE LocationsController.autocomplete

Create an endpoint for location search with autocompletion functionality.
GET /locations/autocomplete
This endpoint will provide location suggestions as the user types in the search field.

### Parameters:
- `query` (required, string): The partial location text to search for (minimum 2 characters)
- `limit` (optional, number): Maximum number of suggestions to return (default: 10)

### Response:
```typescript
{
  suggestions: LocationSuggestionDto[];
}
```

Where `LocationSuggestionDto` should contain:
```typescript
{
  id: string;
  displayName: string; // Full location name to display in dropdown
  address: string;
  city: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}
```

## 3 - CREATE EventsController.getEventTypes

Create an endpoint to retrieve all available event types for filtering.
GET /events/types
This endpoint will return all possible event types that can be used to filter events.

### Response:
```typescript
{
  types: EventTypeDto[];
}
```

Where `EventTypeDto` should contain:
```typescript
{
  value: string; // e.g., "concert", "exhibition"
  label: string; // e.g., "Concert", "Exhibition"
  icon?: string; // Optional icon identifier for UI
}
```

## Data Model Requirements

### Event Entity
The Event entity needs to be created with the following properties:
- id: unique identifier
- name: event name
- date: event date and time
- location: embedded object or relation to Location entity
- type: event type (enum)
- price: embedded object with amount, currency, and isFree flag
- description: optional event description
- imageUrl: optional URL to event image
- createdAt: timestamp
- updatedAt: timestamp

### Location Entity
The Location entity needs to be created or enhanced with:
- id: unique identifier
- address: street address
- city: city name
- country: country name
- coordinates: latitude and longitude for map display
- displayName: formatted full location name for search

### Search and Filtering
The events listing endpoint should support:
- Text search across event names and locations
- Location-based filtering using the selected location from autocomplete
- Type-based filtering
- Future implementation considerations: date range filtering, price range filtering