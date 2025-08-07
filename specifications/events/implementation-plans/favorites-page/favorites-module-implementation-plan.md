# Evently Implementation Plan Backend

Author: Claude
Date: 2025-08-07

This module extends the existing events module to add favorites functionality, allowing users to mark events as favorites and retrieve their favorite events list.

## 1 - Entities and Data Model

We need to create a new entity to track the many-to-many relationship between users and their favorite events.

### UserEventFavorites Entity

Table name: `user_event_favorites`

Fields:
- `id`: uuid, primary key, auto-generated
- `userId`: uuid, not null, foreign key to `users.id` with cascade delete
- `eventId`: uuid, not null, foreign key to `events.id` with cascade delete
- `createdAt`: timestamp with timezone, auto-managed
- `updatedAt`: timestamp with timezone, auto-managed

Indexes:
- Unique composite index on (`userId`, `eventId`) to prevent duplicate favorites
- Index on `userId` for efficient queries by user
- Index on `eventId` for efficient queries by event

### 1.1 - Assumptions about entities and data model

- 1.1.1: The favorites relationship is many-to-many (a user can have multiple favorite events, and an event can be favorited by multiple users)
- 1.1.2: When a user is deleted, their favorites should be automatically removed (cascade delete)
- 1.1.3: When an event is deleted, all favorites for that event should be automatically removed (cascade delete)
- 1.1.4: A user cannot favorite the same event twice (enforced by unique constraint)
- 1.1.5: We track when a favorite was added (createdAt) but not when it was last viewed

## 2 - Business rules

### 2.1 - (user) `rule-favorites-authenticated-only`

Only authenticated users can add, remove, or view favorites. Anonymous users cannot use favorites functionality.

### 2.2 - (inferred) `rule-favorites-user-isolation`

Users can only manage their own favorites. They cannot view or modify other users' favorites.

### 2.3 - (inferred) `rule-favorites-idempotent-operations`

Adding a favorite that already exists should not throw an error, it should be a no-op returning success.
Removing a favorite that doesn't exist should not throw an error, it should be a no-op returning success.

### 2.4 - (inferred) `rule-favorites-valid-event`

Users can only favorite events that exist. Attempting to favorite a non-existent event should return a 404 error.

### 2.5 - (user) `rule-favorites-list-pagination`

The favorites list should support pagination with configurable page size.

## 3 - Service

### UserEventFavoritesService

Methods needed:

1. `addFavorite(userId: string, eventId: string): Promise<void>`
   - Implements rule-favorites-idempotent-operations
   - Validates event exists (rule-favorites-valid-event)
   - Creates the favorite relationship if it doesn't exist

2. `removeFavorite(userId: string, eventId: string): Promise<void>`
   - Implements rule-favorites-idempotent-operations
   - Removes the favorite relationship if it exists

3. `listUserFavorites(userId: string, from: number, size: number): Promise<{ events: Event[], total: number }>`
   - Returns paginated list of favorite events for a user
   - Joins with events table to get full event details
   - Returns total count for pagination

4. `isEventFavoritedByUser(userId: string, eventId: string): Promise<boolean>`
   - Checks if a specific event is favorited by a user
   - Used to populate the isFavorited flag

5. `addIsFavoritedFlag(events: Event[], userId: string | null): Promise<Event[]>`
   - Adds the isFavorited flag to a list of events
   - If userId is null, sets all isFavorited to false
   - Optimized to use a single query for all events

### 3.1 Assumptions about business rules

- 3.1.1: The service will use transactions when needed to ensure data consistency
- 3.1.2: The service will validate that the event exists before creating a favorite (throwing 404 if not found)
- 3.1.3: The pagination parameters will have default values (from: 0, size: 20) if not provided
- 3.1.4: The total count in pagination response represents the total number of favorites, not the number returned

## 4 - API

### 4.1 - EventsController.addToFavorites

Add an event to the current user's favorites list.

**Method + Route**: POST /events/:id/favorites

**Parameters**:
- Path parameter: `id` (string, uuid) - The event ID to favorite
- No request body required

**Response**:
- Status: 201 Created
- No response body

**Roles**: ['user', 'admin'] - Any authenticated user can add favorites

#### 4.1.1 - Test plan

1. Test successful favorite addition for authenticated user
2. Test idempotent behavior - adding same favorite twice returns success
3. Test 404 error when trying to favorite non-existent event
4. Test 401 error for unauthenticated requests
5. Verify favorite is correctly stored in database

#### 4.1.2 - Assumptions about the API action and format

- Returns 201 even if the favorite already existed (idempotent)
- No response body needed as per specification

### 4.2 - EventsController.removeFromFavorites

Remove an event from the current user's favorites list.

**Method + Route**: DELETE /events/:id/favorites

**Parameters**:
- Path parameter: `id` (string, uuid) - The event ID to unfavorite
- No request body required

**Response**:
- Status: 204 No Content
- No response body

**Roles**: ['user', 'admin'] - Any authenticated user can remove favorites

#### 4.2.1 - Test plan

1. Test successful favorite removal for authenticated user
2. Test idempotent behavior - removing non-existent favorite returns success
3. Test 401 error for unauthenticated requests
4. Verify favorite is correctly removed from database

#### 4.2.2 - Assumptions about the API action and format

- Returns 204 even if the favorite didn't exist (idempotent)
- No response body needed as per specification

### 4.3 - EventsController.listFavorites

List all favorite events for the current user with pagination support.

**Method + Route**: GET /events/favorites

**Parameters**:
- Query parameter: `from` (number, optional) - Starting index, default: 0
- Query parameter: `size` (number, optional) - Page size, default: 20

**Response**:
- Status: 200 OK
- Body: EventsFavoritesListResponseDto
```typescript
{
  events: EventDto[],
  total: number
}
```

**Roles**: ['user', 'admin'] - Any authenticated user can list their favorites

#### 4.3.1 - Test plan

1. Test successful listing of favorites with pagination
2. Test empty list when user has no favorites
3. Test pagination parameters (from, size)
4. Test 401 error for unauthenticated requests
5. Verify correct events are returned and total count is accurate

#### 4.3.2 - Assumptions about the API action and format

- Returns events sorted by date added to favorites (newest first)
- The `total` field represents the total number of favorites, not just the page size
- Events in the response include all standard EventDto fields

### 4.4 - EventsController.list (UPDATE)

Modify the existing list endpoint to include isFavorited flag.

**Method + Route**: GET /events (existing endpoint)

**Parameters**: No changes to existing parameters

**Response**: 
- Modify EventDto to include:
```typescript
{
  // ... existing fields
  isFavorited?: boolean
}
```

**Roles**: ['user', 'admin'] for authenticated users, public for anonymous

#### 4.4.1 - Test plan

1. Test that authenticated users see correct isFavorited flags
2. Test that anonymous users see isFavorited as false/undefined
3. Test performance with many events and favorites
4. Verify existing functionality is not broken

#### 4.4.2 - Assumptions about the API action and format

- For anonymous users, isFavorited will be false or omitted
- The flag is computed efficiently without N+1 queries
- Existing response structure remains compatible

### 4.5 - EventsController.getFavorite

Get details of a single favorite event by ID.

**Method + Route**: GET /events/:id/favorite

**Parameters**:
- Path parameter: `id` (string, uuid) - The event ID

**Response**:
- Status: 200 OK
- Body: EventFavoriteGetResponseDto
```typescript
{
  event: EventDto & { isFavorited: true }
}
```

**Roles**: ['user', 'admin'] - Any authenticated user

#### 4.5.1 - Test plan

1. Test successful retrieval of favorited event
2. Test 404 error when event is not in user's favorites
3. Test 404 error when event doesn't exist
4. Test 401 error for unauthenticated requests

#### 4.5.2 - Assumptions about the API action and format

- This endpoint only returns events that are in the user's favorites
- The isFavorited is always true in the response (since it's a favorite)
- Returns 404 if the event exists but is not favorited by the user

## 5 - Other

### 5.1 - Repository Implementation

Create `UserEventFavoritesRepository` extending the base Repository class with methods:
- Custom method for batch checking favorites: `findFavoritesByUserAndEventIds(userId: string, eventIds: string[]): Promise<UserEventFavorite[]>`
- Custom method for paginated list with join: `listFavoriteEventsForUser(userId: string, from: number, size: number): Promise<{ events: Event[], total: number }>`

### 5.2 - Database Migration

A database migration will be needed to create the `user_event_favorites` table with all the fields and indexes described in section 1.

### 5.3 - Module Updates

The existing events module will need to be updated to:
- Import and provide the new UserEventFavoritesService
- Import and provide the new UserEventFavoritesRepository
- Update the EventsController with the new endpoints
- Update the EventDto to include the optional isFavorited field