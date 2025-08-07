# Evently Module Events Page Home Description

## 1 - Page Description

/

The home page is the main entry point of the Evently application, designed to help users discover events near them. Its primary purpose is to display a list of events with search functionality focused on location-based discovery. Users can search for events by typing a location (address, city, or country) in the search bar, which provides autocomplete suggestions. The page then displays relevant events in a responsive grid layout with cards showing essential event information.

The page consists of a location search bar positioned prominently at the top, followed by a grid of event cards in the main content area. Each event card displays the event name, date, location details, event type, and pricing information. The layout is fully responsive, adapting from a single column on mobile devices to multiple columns on larger screens.

## 2 - Components

### 2.1 - Component `LocationSearchBar`

A search input component with autocomplete functionality that allows users to search for events by location. It provides real-time suggestions as users type, supporting searches by address, city, or country.

#### 2.1.1 - Child components

- Input field with search icon
- Dropdown list for autocomplete suggestions
- Loading spinner for API calls

#### 2.1.2 - Style and Layout

Positioned at the top of the page, centered horizontally, directly below the main navigation. The component is full-width on mobile devices and has a maximum width of 600px on desktop screens. Features a prominent search icon and clean, modern styling with rounded borders.

#### 2.1.3 - Data

- Calls `GET /events/locations` endpoint with query parameter
- Receives `LocationSuggestionDto[]` containing location suggestions
- Each suggestion includes relevant location data for display

#### 2.1.4 - Actions

- **On input change (debounced 300ms)**: Triggers API call to fetch location suggestions
- **On suggestion selection**: Updates the events list by calling `/events` endpoint with the selected location parameter
- **On clear**: Resets the search and shows all events

#### 2.1.5 - Business rules

##### 2.1.5.1 - `rule-events-location-search`

The location search should provide autocomplete suggestions as the user types, allowing them to search by address, city, or country. The search results should filter events based on the selected location.

### 2.2 - Component `EventCard`

A card component that displays individual event information in an attractive, scannable format. Each card presents key event details to help users quickly identify events of interest.

#### 2.2.1 - Child components

- Event title header
- Date/time display
- Location information block
- Event type badge
- Price display component

#### 2.2.2 - Style and Layout

Positioned within a grid layout in the main content area. Each card has a shadow or border for visual separation. On mobile devices, cards are full-width. On larger screens, cards have a fixed width and are arranged in a responsive grid. The event type badge uses distinct colors for each category (concert, exhibition, conference, sport, festival, other).

#### 2.2.3 - Data

Data from `EventDto`:
- `name`: Event title displayed prominently at the top of the card
- `date`: Date and time formatted according to user's locale
- `location`: Combines `address`, `city`, and `country` from nested `EventLocationDto`
- `type`: Event category displayed as a colored badge
- `price`: Shows either the price amount with currency or "Free" if `isFree` is true
- `imageUrl`: Event image (shows placeholder if null)

#### 2.2.4 - Actions

- No actions currently implemented
- Future enhancement: Click to navigate to event details page

#### 2.2.5 - Business rules

##### 2.2.5.1 - `rule-events-price-display`

Events should clearly indicate if they are free. When displaying prices, both the amount and currency should be shown together.

##### 2.2.5.2 - `rule-events-type-categorization`

Events are categorized by type (concert, exhibition, conference, sport, festival, other) and this categorization should be visually distinct in the UI.

### 2.3 - Component `EventsList`

Container component that manages the display of event cards in a responsive grid layout. Handles data fetching, loading states, empty states, and pagination.

#### 2.3.1 - Child components

- Array of `EventCard` components
- Loading spinner/skeleton cards
- Empty state message
- Pagination controls

#### 2.3.2 - Style and Layout

Positioned in the main content area below the search bar. Uses CSS Grid or Flexbox for responsive layout. The grid adapts based on screen size: 1 column on mobile, 2-3 columns on tablet, and 3-4 columns on desktop. Includes appropriate spacing between cards.

#### 2.3.3 - Data

- Calls `GET /events` endpoint
- Receives `EventsListResponseDto` containing:
  - Array of `EventDto` objects
  - Total count for pagination
- Supports query parameters:
  - `location`: Filter by location
  - `from`: Pagination offset
  - `size`: Number of items per page

#### 2.3.4 - Actions

- **On mount**: Fetches initial events list
- **On location search update**: Refetches events with location filter
- **On pagination change**: Fetches next/previous page of results
- **On error**: Displays error message with retry option

#### 2.3.5 - Business rules

##### 2.3.5.1 - `rule-events-public-access`

The home page and event listings should be publicly accessible without authentication, as indicated by the lack of authentication requirements on the `/events` and `/events/locations` endpoints.

##### 2.3.5.2 - `rule-events-pagination`

The events list should implement pagination to handle large numbers of events efficiently, using the `from` and `size` parameters provided by the API.