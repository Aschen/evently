# Evently Implementation Plan Backend

Author: Claude
Date: 2025-08-07

This module provides the backend functionality for managing events in the Evently application. It includes endpoints for listing events with pagination and filtering, and location autocomplete functionality based on existing event addresses.

## 1 - Entities and Data Model

The module requires one main entity: Events.

### Events Table
- `id`: uuid, primary key, auto-generated
- `name`: text, not null, the event name
- `date`: timestamp with timezone, not null, the event date and time
- `address`: text, not null, street address
- `city`: text, not null, city name
- `country`: text, not null, country name
- `type`: enum, not null, values: "concert", "exhibition", "conference", "sport", "festival", "other"
- `price_amount`: decimal(10,2), not null, the price amount (0 for free events)
- `price_currency`: text, not null, default "EUR", the currency code
- `is_free`: boolean, not null, indicates if the event is free
- `description`: text, nullable, event description
- `image_url`: text, nullable, URL to the event image
- `created_at`: timestamp, not null, auto-generated
- `updated_at`: timestamp, not null, auto-updated

Indexes:
- `idx_events_date`: on date field for filtering future events
- `idx_events_type`: on type field for type-based filtering
- `idx_events_name`: on name field for text search
- `idx_events_city_country`: composite index on city and country for location search

### 1.1 - Assumptions about entities and data model

- 1.1.1: The price amount is stored as decimal with 2 decimal places to handle monetary values accurately
- 1.1.2: Location information is embedded directly in the events table (address, city, country)
- 1.1.3: The event type is limited to predefined values for consistency
- 1.1.4: The is_free field is computed based on price_amount = 0

## 2 - Business rules

### 2.1 - (inferred) `rule-events-pagination-defaults`

The events listing should have sensible pagination defaults: 
- Default `from` is 0
- Default `size` is 20
- Maximum `size` should be limited to prevent performance issues

### 2.2 - (user) `rule-events-search-multiple-fields`

The search parameter in events listing should search across both event names and location information (address, city, country).

### 2.3 - (inferred) `rule-locations-autocomplete-minimum`

The location autocomplete should require a minimum of 2 characters to prevent too broad searches. Autocomplete will search through unique combinations of address, city, and country from existing events.

### 2.4 - (inferred) `rule-events-future-only`

Events listing should by default show only future events (date >= current timestamp) unless specified otherwise.

### 2.5 - (user) `rule-event-types-predefined`

Event types are predefined as: "concert", "exhibition", "conference", "sport", "festival", "other". The frontend will handle the display labels directly.

## 3 - Service

### EventsService
- `list(params: { from?: number, size?: number, search?: string, location?: string, type?: string })`: Returns paginated events with total count
- `getLocationSuggestions(query: string, limit?: number)`: Returns unique location suggestions from existing events based on query

### 3.1 Assumptions about business rules

- 3.1.1: The EventsService.list method will filter events by date >= now() by default
- 3.1.2: Search functionality will use case-insensitive matching
- 3.1.3: Location filter will match against the combination of address, city, and country fields
- 3.1.4: The limit for autocomplete suggestions defaults to 10 with a maximum of 50
- 3.1.5: Location suggestions are generated from distinct combinations of address, city, and country in existing events

## 4 - API

### 4.1 - EventsController.list

Lists events with pagination and filtering support.
GET /events

Parameters:
- `from` (query, optional): number, starting index (default: 0)
- `size` (query, optional): number, page size (default: 20, max: 100)
- `search` (query, optional): string, search term for event name or location
- `location` (query, optional): string, location text to filter by (will match address, city, or country)
- `type` (query, optional): string, event type to filter by

Response:
```json
{
  "events": [
    {
      "id": "uuid",
      "name": "string",
      "date": "ISO 8601 date-time",
      "location": {
        "address": "string",
        "city": "string",
        "country": "string"
      },
      "type": "concert|exhibition|conference|sport|festival|other",
      "price": {
        "amount": number,
        "currency": "string",
        "isFree": boolean
      },
      "description": "string|null",
      "imageUrl": "string|null"
    }
  ],
  "total": number
}
```

#### 4.1.1 - Test plan

- Test successful listing with default pagination
- Test pagination with custom from and size parameters
- Test search filtering across event names
- Test location filtering with location text
- Test type filtering with valid event type
- Test combined filters (search + type + location)
- Test invalid parameters (negative from, invalid type)
- Test authentication (should work for authenticated users)

#### 4.1.2 - Assumptions about the API action and format

- The endpoint is accessible to authenticated users only
- The location filter expects location text that will be matched against address, city, or country
- Price amount is returned as a number (not string) for easier frontend handling

### 4.2 - EventsController.locations

Provides location suggestions for autocomplete functionality based on existing events.
GET /events/locations

Parameters:
- `query` (query, required): string, minimum 2 characters
- `limit` (query, optional): number, maximum suggestions (default: 10, max: 50)

Response:
```json
{
  "suggestions": [
    {
      "displayName": "string",
      "address": "string",
      "city": "string",
      "country": "string"
    }
  ]
}
```

#### 4.2.1 - Test plan

- Test successful autocomplete with valid query
- Test minimum query length validation (< 2 characters should fail)
- Test limit parameter (default and custom values)
- Test case-insensitive search
- Test empty results for non-matching query
- Test authentication requirements

#### 4.2.2 - Assumptions about the API action and format

- The endpoint is accessible to authenticated users only
- The displayName is formatted as "{address}, {city}, {country}" for direct display in UI
- Search is performed on address, city, and country fields from existing events
- Results are unique combinations of location data from the events table

### 4.3 - EventsController.create (Admin only)

Creates a new event.
POST /events

Parameters (body):
```json
{
  "name": "string",
  "date": "ISO 8601 date-time",
  "address": "string",
  "city": "string",
  "country": "string",
  "type": "concert|exhibition|conference|sport|festival|other",
  "price": {
    "amount": number,
    "currency": "string"
  },
  "description": "string|null",
  "imageUrl": "string|null"
}
```

Response:
```json
{
  "event": {
    "id": "uuid",
    "name": "string",
    "date": "ISO 8601 date-time",
    "address": "string",
    "city": "string",
    "country": "string",
    "type": "string",
    "priceAmount": number,
    "priceCurrency": "string",
    "isFree": boolean,
    "description": "string|null",
    "imageUrl": "string|null",
    "createdAt": "ISO 8601 date-time",
    "updatedAt": "ISO 8601 date-time"
  }
}
```

#### 4.3.1 - Test plan

- Test successful event creation with all fields
- Test event creation with minimal fields (no description, no imageUrl)
- Test validation for required fields
- Test invalid event type
- Test admin-only access (user role should be denied)

### 4.4 - EventsController.delete (Admin only)

Deletes an event.
DELETE /events/:id

Response: 204 No Content

#### 4.4.1 - Test plan

- Test successful deletion
- Test deletion of non-existent event
- Test admin-only access

## 5 - Other

### 5.1 - Location Autocomplete Implementation

The location autocomplete feature should query distinct combinations of address, city, and country from the events table. The displayName should be generated on-the-fly in the format: "{address}, {city}, {country}" for consistent display in the autocomplete dropdown.

### 5.2 - Event Type Enum

Event types should be defined as a database enum with the values: "concert", "exhibition", "conference", "sport", "festival", "other". The frontend will handle the display labels and any icons independently.