# Evently Implementation Plan Backend

Author: Claude
Date: 2025-08-07

This implementation plan outlines the backend modifications needed to support filtering events by their free/paid status. The Events module already exists with a comprehensive API for listing, creating, and managing events. This modification will enhance the existing list endpoint to allow users to filter events based on whether they are free or require payment.

## 1 - Entities and Data Model

The existing Events entity already contains all necessary fields for implementing the free/paid filter functionality:

- **Events Table** (`EventsTable`)
  - `id`: UUID primary key
  - `name`: Event name
  - `date`: Event date and time
  - `address`: Street address
  - `city`: City name
  - `country`: Country name
  - `type`: Event type enum (conference, workshop, meetup, webinar, concert, other)
  - `priceAmount`: Decimal price amount stored as string
  - `priceCurrency`: Currency code (e.g., EUR, USD)
  - `isFree`: Boolean flag indicating if the event is free
  - `description`: Optional event description
  - `imageUrl`: Optional image URL
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp

**No data model changes are required.** The `isFree` boolean field already exists and is automatically set based on whether the price amount is 0.

### 1.1 - Assumptions about entities and data model

- 1.1.1: The `isFree` field is correctly maintained and updated whenever an event's price is changed
- 1.1.2: The `isFree` field accurately reflects whether `priceAmount` equals 0

## 2 - Business rules

### 2.1 - (user) `rule-events-filter-by-free-status`

Users should be able to filter the events list to show only free events or only paid events. When the `isFree` filter is applied:
- If `isFree=true`: Return only events where the `isFree` field is true
- If `isFree=false`: Return only events where the `isFree` field is false
- If `isFree` is not provided: Return all events regardless of their free/paid status (current behavior)

### 2.2 - (inferred) `rule-events-filter-combination`

The `isFree` filter should work in combination with existing filters (search, location, type). All filters should be applied using AND logic, meaning an event must match all provided filter criteria to be included in the results.

### 2.3 - (inferred) `rule-events-filter-pagination`

The `isFree` filter should be applied before pagination calculations. The total count returned should reflect the number of events that match all filter criteria, including the `isFree` filter.

## 3 - Service

The `EventsService` needs minimal modification to support the new filter parameter:

### 3.1 - EventsService.list() modification

The existing `list` method signature needs to be updated to accept an optional `isFree` parameter:

```typescript
async list({
  from = 0,
  size = 20,
  search,
  location,
  type,
  isFree,  // New parameter
}: {
  from?: number
  size?: number
  search?: string
  location?: string
  type?: EventType
  isFree?: boolean  // New parameter type
})
```

The method will pass this parameter to the repository layer without additional business logic, as the filtering logic belongs in the repository.

### 3.1 Assumptions about business rules

- 3.1.1: No additional validation is needed for the `isFree` parameter beyond standard boolean validation
- 3.1.2: The service layer should not modify or interpret the `isFree` value, only pass it to the repository

## 4 - API

### 4.1 - EventsController.list

UPDATE the existing list endpoint to support the new `isFree` query parameter.

GET /events

#### 4.1.1 - Parameters

The `EventsListParamsDto` needs to be updated to include:

- **isFree** (optional, boolean): Filter events by their free/paid status
  - Type: Boolean
  - Required: false
  - Description: "Filter events by free/paid status. True returns only free events, false returns only paid events"
  - Example: true
  - Validation: Standard boolean validation using `@IsBoolean()` and `@IsOptional()`
  - Transformation: Use `@Transform()` decorator to properly convert string query params "true"/"false" to boolean

Existing parameters remain unchanged:
- from (optional, number, default: 0)
- size (optional, number, default: 20, max: 100)
- search (optional, string)
- location (optional, string)
- type (optional, EventType enum)

#### 4.1.2 - Response

No changes to the response format. The existing `EventsListResponseDto` already includes:
- events: Array of `EventDto` objects (which includes the `price.isFree` field)
- total: Total count of matching events

#### 4.1.3 - Controller method modification

The controller's `list` method needs to:
1. Accept the new `isFree` parameter from the query
2. Pass it to the service layer
3. No changes needed to response mapping as `EventDto` already includes the price information

#### 4.1.4 - Test plan

Test scenarios to cover:
1. **Filter for free events only**: GET /events?isFree=true
   - Should return only events where price.isFree is true
   - Verify each returned event has price.amount = 0 and price.isFree = true
   
2. **Filter for paid events only**: GET /events?isFree=false
   - Should return only events where price.isFree is false
   - Verify each returned event has price.amount > 0 and price.isFree = false
   
3. **No filter applied**: GET /events
   - Should return both free and paid events (current behavior)
   - Verify response includes events with both price.isFree = true and false
   
4. **Combined filters**: GET /events?isFree=true&type=concert&location=Paris
   - Should return only free concerts in Paris
   - Verify all conditions are met in returned events
   
5. **Pagination with filter**: GET /events?isFree=true&from=10&size=5
   - Should correctly paginate filtered results
   - Verify total count reflects only free events
   
6. **Invalid boolean values**: GET /events?isFree=invalid
   - Should return validation error
   - Verify proper error response format

#### 4.1.5 - Assumptions about the API action and format

- 4.1.5.1: Query parameter transformation will handle string values "true"/"false" and convert them to boolean
- 4.1.5.2: Invalid boolean values will be caught by validation and return a 400 error
- 4.1.5.3: The `isFree` parameter is truly optional and omitting it returns all events

## 5 - Other

### 5.1 - Repository Layer Modification

The `EventsRepository.listEvents()` method needs to be updated to:

1. Accept the new `isFree` parameter in its method signature
2. Add a condition to the WHERE clause when `isFree` is provided:
   ```typescript
   if (isFree !== undefined) {
     conditions.push(eq(this.table.isFree, isFree))
   }
   ```
3. The condition should be added to the existing conditions array and combined with AND logic

### 5.2 - Integration Test Updates

The existing test file `EventsController-list.test.ts` should be updated to include the new test scenarios outlined in section 4.1.4. The tests should verify both the API behavior and the database query results.