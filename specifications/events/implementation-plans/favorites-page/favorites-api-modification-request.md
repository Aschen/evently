# Evently - API Modification Request

This document will be used by backend developers to modify the API according to the specifications you provide in order to expose the correct API routes and data to realize the view you were asked to create.

You can ask to create or update API routes.

## Instructions

## 1 - CREATE EventsController.addToFavorites

Add an event to the current user's favorites list.
POST /events/{id}/favorites
No request body required - the event ID is in the URL path
Response: 201 Created with no body on success

## 2 - CREATE EventsController.removeFromFavorites

Remove an event from the current user's favorites list.
DELETE /events/{id}/favorites
No request body required - the event ID is in the URL path
Response: 204 No Content on success

## 3 - CREATE EventsController.listFavorites

List all favorite events for the current user with pagination support.
GET /events/favorites
Query parameters:
- from?: number - Starting index (default: 0)
- size?: number - Page size (default: 20)

Response: EventsFavoritesListResponseDto
```typescript
{
  events: EventDto[],
  total: number
}
```

## 4 - UPDATE EventsController.list

Add a flag to indicate if each event is favorited by the current user when listing all events.
GET /events

### 4.1 - Parameters

No change in parameters needed.

### 4.2 - Response

Modify the EventDto to include a `isFavorited` boolean property:
- why the change: Users need to see which events they have already added to their favorites when browsing the main event list
- how the new property will be used: Display a filled/unfilled heart icon on event cards
- possible values: 
  - true: the current user has added this event to favorites
  - false: the current user has not added this event to favorites
  - null/undefined: when no user is logged in

### 4.3 - Data model changes

Update EventDto to include:
```typescript
{
  // ... existing properties
  isFavorited?: boolean
}
```

## 5 - CREATE EventsController.getFavorite

Get details of a single favorite event by ID, including the favorite status.
GET /events/{id}/favorite

Response: EventFavoriteGetResponseDto
```typescript
{
  event: EventDto & { isFavorited: true }
}
```

This endpoint returns 404 if the event is not in the user's favorites list.