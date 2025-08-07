# Evently Module Events Description

## 1 - Entities

### 1.1 - Entity `Event`

#### 1.1.1 - Field `id`

uuid, primary key, auto-generated
Unique identifier for the event

#### 1.1.2 - Field `name`

text, not null
The name of the event

#### 1.1.3 - Field `date`

timestamp with timezone, not null
The date and time when the event takes place

#### 1.1.4 - Field `address`

text, not null
Street address where the event takes place

#### 1.1.5 - Field `city`

text, not null
City where the event takes place

#### 1.1.6 - Field `country`

text, not null
Country where the event takes place

#### 1.1.7 - Field `type`

enum, not null, values: "concert", "exhibition", "conference", "sport", "festival", "other"
The type/category of the event

#### 1.1.8 - Field `priceAmount`

decimal(10,2), not null
The price amount for the event (0 for free events)

#### 1.1.9 - Field `priceCurrency`

text, not null, default "EUR"
The currency code for the price

#### 1.1.10 - Field `isFree`

boolean, not null
Indicates whether the event is free (automatically set based on priceAmount === 0)

#### 1.1.11 - Field `description`

text, nullable
Optional description of the event

#### 1.1.12 - Field `imageUrl`

text, nullable
Optional URL to the event's image

#### 1.1.13 - Field `createdAt`

timestamp, not null, auto-generated
Timestamp when the event was created

#### 1.1.14 - Field `updatedAt`

timestamp, not null, auto-updated
Timestamp when the event was last updated

### 1.2 - Entity `UserEventFavorite`

#### 1.2.1 - Field `id`

uuid, primary key, auto-generated
Unique identifier for the favorite relationship

#### 1.2.2 - Field `userId`

uuid, not null, foreign key to users.id with cascade delete
The user who favorited the event

#### 1.2.3 - Field `eventId`

uuid, not null, foreign key to events.id with cascade delete
The event that was favorited

#### 1.2.4 - Field `createdAt`

timestamp, not null, auto-generated
Timestamp when the event was favorited

#### 1.2.5 - Field `updatedAt`

timestamp, not null, auto-updated
Timestamp when the favorite was last updated

## 2 - API

### 2.1 - Controller `EventsController`

#### 2.1.1 - Action `list`

Lists events with pagination and filtering capabilities for the home page display.

GET /events

Query parameters:

- `from` (optional, number): Starting index (default: 0)
- `size` (optional, number): Page size (default: 20, max: 100)
- `search` (optional, string): Search term for event name or location
- `location` (optional, string): Location text to filter by (must be address, city, or country only)
- `type` (optional, string): Event type to filter by
- `isFree` (optional, boolean): Filter events by free/paid status (true for free events, false for paid events)

Response format:

```json
{
  "events": [EventDto with optional isFavorited field],
  "total": number
}
```

EventDto now includes:
- All existing fields
- `isFavorited` (optional, boolean): Indicates if the current user has favorited this event (only present for authenticated users)

##### 2.1.1.1 - Test plan for `EventsController.list`

- Test successful listing with default pagination
- Test pagination with custom from and size parameters
- Test search filtering across event names and location fields
- Test location filtering with location text
- Test type filtering with valid event type
- Test filtering for free events only (isFree=true)
- Test filtering for paid events only (isFree=false)
- Test no filter applied (isFree not provided)
- Test combined filters (search + type + location + isFree)
- Test pagination with isFree filter
- Test invalid parameters (negative from, invalid type, invalid boolean)
- Test authentication requirements

#### 2.1.2 - Action `locations`

Get location suggestions for autocomplete functionality.

GET /events/locations

Query parameters:

- `query` (required, string): Search query (minimum 2 characters)
- `limit` (optional, number): Maximum suggestions (default: 10, max: 50)

Response format:

```json
{
  "suggestions": [LocationSuggestionDto]
}
```

##### 2.1.2.1 - Test plan for `EventsController.locations`

- Test successful autocomplete with valid query
- Test minimum query length validation
- Test limit parameter behavior
- Test case-insensitive search
- Test empty results for non-matching query
- Test authentication requirements

#### 2.1.3 - Action `create`

Creates a new event (admin only).

POST /events

Body:

```json
{
  "name": string,
  "date": string (ISO 8601),
  "address": string,
  "city": string,
  "country": string,
  "type": string,
  "price": {
    "amount": number,
    "currency": string
  },
  "description": string (optional),
  "imageUrl": string (optional)
}
```

Response format:

```json
{
  "event": EventDto
}
```

##### 2.1.3.1 - Test plan for `EventsController.create`

- Test successful event creation with all fields
- Test event creation with minimal fields
- Test validation for required fields
- Test invalid event type
- Test admin-only access (user role should be denied)

#### 2.1.4 - Action `delete`

Deletes an event (admin only).

DELETE /events/:id

Response: 204 No Content

##### 2.1.4.1 - Test plan for `EventsController.delete`

- Test successful deletion
- Test deletion of non-existent event
- Test admin-only access

#### 2.1.5 - Action `addToFavorites`

Add an event to the current user's favorites list.

POST /events/:id/favorites

Path parameters:
- `id` (required, string): The event ID to favorite

Response: 201 Created (no body)

##### 2.1.5.1 - Test plan for `EventsController.addToFavorites`

- Test successful favorite addition for authenticated user
- Test idempotent behavior - adding same favorite twice returns success
- Test 404 error when trying to favorite non-existent event
- Test 401 error for unauthenticated requests
- Verify favorite is correctly stored in database

#### 2.1.6 - Action `removeFromFavorites`

Remove an event from the current user's favorites list.

DELETE /events/:id/favorites

Path parameters:
- `id` (required, string): The event ID to unfavorite

Response: 204 No Content

##### 2.1.6.1 - Test plan for `EventsController.removeFromFavorites`

- Test successful favorite removal for authenticated user
- Test idempotent behavior - removing non-existent favorite returns success
- Test 401 error for unauthenticated requests
- Verify favorite is correctly removed from database

#### 2.1.7 - Action `listFavorites`

List all favorite events for the current user with pagination support.

GET /events/favorites

Query parameters:
- `from` (optional, number): Starting index (default: 0)
- `size` (optional, number): Page size (default: 20)

Response format:

```json
{
  "events": [EventDto],
  "total": number
}
```

##### 2.1.7.1 - Test plan for `EventsController.listFavorites`

- Test successful listing of favorites with pagination
- Test empty list when user has no favorites
- Test pagination parameters (from, size)
- Test 401 error for unauthenticated requests
- Verify correct events are returned and total count is accurate

#### 2.1.8 - Action `getFavorite`

Get details of a single favorite event by ID.

GET /events/:id/favorite

Path parameters:
- `id` (required, string): The event ID

Response format:

```json
{
  "event": EventDto & { isFavorited: true }
}
```

##### 2.1.8.1 - Test plan for `EventsController.getFavorite`

- Test successful retrieval of favorited event
- Test 404 error when event is not in user's favorites
- Test 404 error when event doesn't exist
- Test 401 error for unauthenticated requests

## 3 - Business rules

### 3.1 - `rule-events-pagination-defaults`

The events listing has sensible pagination defaults: from=0, size=20, with a maximum size of 100 to prevent performance issues.
File: EventsService

### 3.2 - `rule-events-search-multiple-fields`

The search parameter in events listing searches across both event names and location information (address, city, country).
File: EventsRepository

### 3.3 - `rule-locations-autocomplete-minimum`

The location autocomplete requires a minimum of 2 characters to prevent too broad searches.
File: EventsService

### 3.4 - `rule-events-future-only`

Events listing shows only future events (date >= current timestamp) by default.
File: EventsRepository

### 3.5 - `rule-event-types-predefined`

Event types are predefined as: "concert", "exhibition", "conference", "sport", "festival", "other".
File: EventsTable

### 3.6 - `rule-favorites-authenticated-only`

Only authenticated users can add, remove, or view favorites. Anonymous users cannot use favorites functionality.
File: EventsController

### 3.7 - `rule-favorites-user-isolation`

Users can only manage their own favorites. They cannot view or modify other users' favorites.
File: UserEventFavoritesService

### 3.8 - `rule-favorites-idempotent-operations`

Adding a favorite that already exists returns success without error. Removing a favorite that doesn't exist returns success without error.
File: UserEventFavoritesService

### 3.9 - `rule-favorites-valid-event`

Users can only favorite events that exist. Attempting to favorite a non-existent event returns a 404 error.
File: UserEventFavoritesService

### 3.10 - `rule-favorites-list-pagination`

The favorites list supports pagination with configurable page size (default: 20).
File: UserEventFavoritesService

## 4 - Repositories

### 4.1 - Repository `EventsRepository`

#### 4.1.1 - Method `EventsRepository.listEvents`

Retrieves paginated events with optional search, location, and type filters. Returns both events array and total count. Only shows future events by default.
Used by: EventsService.list

#### 4.1.2 - Method `EventsRepository.getLocationSuggestions`

Searches for distinct location combinations (address, city, country) matching the query string (case-insensitive).
Used by: EventsService.getLocationSuggestions

### 4.2 - Repository `UserEventFavoritesRepository`

#### 4.2.1 - Method `UserEventFavoritesRepository.findFavoritesByUserAndEventIds`

Batch checks which events from a list are favorited by a user. Returns array of UserEventFavorite entities for efficient isFavorited flag computation.
Used by: UserEventFavoritesService.addIsFavoritedFlag

#### 4.2.2 - Method `UserEventFavoritesRepository.listFavoriteEventsForUser`

Retrieves paginated favorite events for a user with join to events table. Returns both events array and total count.
Used by: UserEventFavoritesService.listUserFavorites

## 5 - Services

### 5.1 - Service `EventsService`

Handles business logic for event management including listing, filtering, and location suggestions.

#### 5.1.1 - Method `EventsService.list`

Retrieves paginated events with filters, ensuring only future events are returned. Returns both events and total count. Enforces maximum page size. Now also adds isFavorited flag for authenticated users.
Used by: EventsController.list

#### 5.1.2 - Method `EventsService.getLocationSuggestions`

Provides location suggestions based on search query, enforcing minimum query length of 2 characters and maximum limit.
Used by: EventsController.locations

#### 5.1.3 - Method `EventsService.create`

Creates a new event, automatically setting isFree based on price amount (isFree = true when price.amount === 0).
Used by: EventsController.create

#### 5.1.4 - Method `EventsService.delete`

Deletes an event by ID, throwing 404 error if event not found.
Used by: EventsController.delete

### 5.2 - Service `UserEventFavoritesService`

Handles business logic for user event favorites including adding, removing, listing, and checking favorite status.

#### 5.2.1 - Method `UserEventFavoritesService.addFavorite`

Adds an event to user's favorites. Validates event exists and implements idempotent behavior (no error if already favorited).
Used by: EventsController.addToFavorites

#### 5.2.2 - Method `UserEventFavoritesService.removeFavorite`

Removes an event from user's favorites. Implements idempotent behavior (no error if not favorited).
Used by: EventsController.removeFromFavorites

#### 5.2.3 - Method `UserEventFavoritesService.listUserFavorites`

Retrieves paginated list of user's favorite events with full event details and total count.
Used by: EventsController.listFavorites

#### 5.2.4 - Method `UserEventFavoritesService.isEventFavoritedByUser`

Checks if a specific event is favorited by a user. Returns boolean.
Used by: EventsController.getFavorite

#### 5.2.5 - Method `UserEventFavoritesService.addIsFavoritedFlag`

Adds isFavorited flag to a list of events for a user. Optimized with single query for all events.
Used by: EventsService.list

## 6 - Other

### 6.1 - Location Suggestion Format

Location suggestions are formatted with displayName in the format: "{address}, {city}, {country}" for consistent display in autocomplete functionality.

### 6.2 - Free Event Determination

The isFree field is automatically determined during event creation based on the price amount (price.amount === 0), ensuring data consistency.

### 6.3 - Business Rule: Event Filter by Free Status

Users can filter events by their free/paid status using the isFree query parameter. This filter works in combination with all other filters (search, location, type) using AND logic.

### 6.4 - Database Indexes for Favorites

The user_event_favorites table includes:
- Unique composite index on (userId, eventId) to prevent duplicate favorites
- Index on userId for efficient user-based queries
- Index on eventId for efficient event-based queries

### 6.5 - Favorites Feature Architecture

The favorites feature extends the events module without modifying the core events entity. It uses a separate join table (user_event_favorites) to maintain the many-to-many relationship between users and their favorite events, following database normalization best practices.
