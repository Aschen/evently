# Evently Home Page Implementation Plan

Author: Claude
Date: 2025-08-07

The home page is the main entry point of the Evently application, designed to help users discover events near them. Its primary purpose is to display a list of events with search functionality focused on location-based discovery. The page features event cards displaying key information and a location search bar with autocomplete functionality.

## 1 - Components

### 1.1 - Component `LocationSearchBar`

A search input with autocomplete functionality that allows users to search for events by location.
- Uses input field with dropdown for suggestions
- Position: Top of the page, centered, below the main navigation
- Data: Uses `GET /events/locations` endpoint with query parameter to fetch `LocationSuggestionDto[]`
- Style: Full-width on mobile, max-width 600px on desktop, with prominent search icon
- Actions: 
  - On typing (debounced): Calls `/events/locations` to get suggestions
  - On selection: Updates the events list by calling `/events` with location parameter

### 1.2 - Component `EventCard`

A card component displaying individual event information.
- Position: Within a grid layout in the main content area
- Data from `EventDto`:
  - `name`: Event title displayed prominently at the top
  - `date`: Formatted date and time
  - `location`: Combined display of `address`, `city`, and `country` from `EventLocationDto`
  - `type`: Event category badge (concert, exhibition, etc.)
  - `price`: Shows either the price (`amount` + `currency`) or "Free" if `isFree` is true
- Style: 
  - Shadow/border for card separation
  - Responsive: Full width on mobile, fixed width on larger screens
  - Type badge with distinct colors per category
- Actions: None specified (future: click to view event details)

### 1.3 - Component `EventsList`

Container component managing the list of event cards.
- Uses grid or flex layout for responsive card arrangement
- Position: Main content area below the search bar
- Data: Uses `GET /events` endpoint, receives `EventsListResponseDto`
- Displays loading state while fetching
- Shows empty state when no events match the search
- Implements pagination using `from` and `size` query parameters

### 1.4 - Assumptions about components

- 1.4.1: The search bar will use a debounce of 300ms to avoid excessive API calls
- 1.4.2: Event cards will show a default placeholder if `imageUrl` is null
- 1.4.3: Date formatting will use the user's locale settings
- 1.4.4: Price display will handle multiple currencies appropriately
- 1.4.5: The grid layout will be responsive: 1 column on mobile, 2-3 on tablet, 3-4 on desktop

## 2 - Business rules

### 2.1 - (user) `rule-events-location-search`

The location search should provide autocomplete suggestions as the user types, allowing them to search by address, city, or country. The search results should filter events based on the selected location.

### 2.2 - (inferred) `rule-events-public-access`

The home page and event listings should be publicly accessible without authentication, as indicated by the lack of authentication requirements on the `/events` and `/events/locations` endpoints.

### 2.3 - (inferred) `rule-events-price-display`

Events should clearly indicate if they are free. When displaying prices, both the amount and currency should be shown together.

### 2.4 - (inferred) `rule-events-type-categorization`

Events are categorized by type (concert, exhibition, conference, sport, festival, other) and this categorization should be visually distinct in the UI.

### 2.5 - (inferred) `rule-events-pagination`

The events list should implement pagination to handle large numbers of events efficiently, using the `from` and `size` parameters provided by the API.