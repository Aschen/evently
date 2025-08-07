# Evently - API Modification Request

This document will be used by backend developers to modify the API according to the specifications you provide in order to expose the correct API routes and data to realize the view you were asked to create.

You can ask to create or update API routes.

## Instructions

## 1 - UPDATE EventsController.list

The events list endpoint needs to be enhanced to support filtering by free/paid status. Currently, the API only supports filtering by event type, search term, and location. Users want to filter events based on whether they are free or require payment.

GET /events

### 1.1 - Parameters

Add new query parameter:

- **isFree** (optional, boolean): Filter events by their free/paid status
  - Purpose: Allow users to filter the event list to show only free events or only paid events
  - Possible values:
    - `true`: Returns only events where `price.isFree` is true
    - `false`: Returns only events where `price.isFree` is false
    - `undefined/not provided`: Returns all events regardless of price status (current behavior)
  - Effect on API behavior: When provided, the API should filter the results to include only events matching the specified free/paid status

### 1.2 - Response

No changes required to the response structure. The existing `EventsListResponseDto` already contains all necessary information.

### 1.3 - Data model changes

No changes required to the data model. The `EventPriceDto` already includes the `isFree` boolean field that will be used for filtering.