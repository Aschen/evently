# Evently Module Events Page Events List Description

## 1 - Page Description

/
The events list page serves as the main landing page for the Evently application, allowing users to discover and browse upcoming events. The page features location-based search functionality, event filtering capabilities (including free/paid filters), and a paginated grid display of event cards. Users can search for events in their area, apply filters to narrow down results, and view event details including pricing information.

The page layout consists of a hero section with the application title and description, followed by a prominent location search bar, filter controls for free/paid events positioned below the search, and a responsive grid of event cards. Pagination controls appear at the bottom when there are multiple pages of results.

## 2 - Components

### 2.1 - Component `HomePage`

The main container component that orchestrates all other components on the events list page. It manages the overall page state including search parameters, filter selections, and pagination.

#### 2.1.1 - Child components

- `LocationSearchBar` - Search input for location-based event discovery
- `EventFilters` - Filter controls for narrowing event results (free/paid toggle)
- `EventsList` - Grid display of event cards with pagination

#### 2.1.2 - Style and Layout

Positioned as the full-page container with a vertical layout. Uses responsive design with maximum content width and centered alignment. Background color provides visual separation between sections.

#### 2.1.3 - Data

- Manages filter state (selectedLocation string, isFreeFilter boolean | undefined)
- Coordinates data flow between child components
- No direct API calls (delegated to child components)

#### 2.1.4 - Actions

- Handles location selection from LocationSearchBar via setSelectedLocation
- Handles filter changes from EventFilters via setIsFreeFilter
- Passes filter parameters (location, isFree) to EventsList for API calls

#### 2.1.5 - Business rules

##### 2.1.5.1 - `rule-page-state-management`

The page must maintain consistent state across all components, ensuring that filters, search, and pagination work together seamlessly.

### 2.2 - Component `LocationSearchBar`

A search input component that allows users to search for events by location. Features autocomplete functionality and geolocation support.

#### 2.2.1 - Child components

- `SearchInput` - Text input with search icon
- `LocationAutocomplete` - Dropdown with location suggestions
- `GeolocationButton` - Button to use current location

#### 2.2.2 - Style and Layout

Centered horizontally below the header, with a prominent design that draws user attention. Width responsive but capped at a maximum for readability. Includes search icon and clear button.

#### 2.2.3 - Data

- User's search query
- Autocomplete suggestions from location API
- Selected location coordinates

#### 2.2.4 - Actions

- **On search submit**: Triggers event search with location parameter
- **On location select**: Updates search with selected coordinates
- **On geolocation click**: Requests user location and searches

#### 2.2.5 - Business rules

##### 2.2.5.1 - `rule-location-search-validation`

Location searches must be validated and geocoded before submitting to ensure accurate results.

### 2.3 - Component `EventFilters`

A filter bar component that provides filtering options for the events list, specifically a free/paid toggle filter implemented with Material-UI ToggleButtonGroup.

#### 2.3.1 - Child components

- `ToggleButtonGroup` - Material-UI component containing the filter options
- `ToggleButton` - Individual toggle buttons for "All Events", "Free Events", and "Paid Events"

#### 2.3.2 - Style and Layout

Positioned between the LocationSearchBar and EventsList components with margin spacing. Horizontal flex layout with filter label and toggle button group. Responsive design that stacks vertically on extra small screens. Active filter state clearly indicated with primary color background.

#### 2.3.3 - Data

- Local filter state managed with useState (filterValue: "all" | "free" | "paid")
- Translates internal state to isFree parameter (undefined | true | false)
- No direct API calls

#### 2.3.4 - Actions

- **On filter selection**: Updates local state and calls onFilterChange prop with appropriate isFree value
- Exclusive selection enforced by ToggleButtonGroup (only one option active at a time)

#### 2.3.5 - Business rules

##### 2.3.5.1 - `rule-events-free-paid-filter`

Users can filter events to show all events, only free events, or only paid events. Only one price filter can be active at a time.

##### 2.3.5.2 - `rule-events-filter-accessibility`

Filter controls must be keyboard navigable and properly labeled for screen readers.

### 2.4 - Component `EventsList`

Displays a grid of event cards based on current search and filter criteria, with pagination support.

#### 2.4.1 - Child components

- `EventCard` - Individual event display cards
- `LoadingSpinner` - Loading state indicator
- `EmptyState` - Message when no events found
- `PaginationControls` - Page navigation controls

#### 2.4.2 - Style and Layout

Responsive grid layout that adjusts columns based on screen size. Cards have consistent spacing and alignment. Loading and empty states centered in the container.

#### 2.4.3 - Data

- Events array from API (GET /events with query params: from, size, location, isFree)
- Pagination metadata (total count, current page managed by useEvents hook)
- Loading and error states from useEvents hook
- Filter parameters received as props (location, isFree)

#### 2.4.4 - Actions

- **On page change**: Updates page state and triggers fetchEvents with new offset
- **On filter/location change**: Triggers fetchEvents via useEffect dependency
- **On component mount**: Initial fetch with default parameters

#### 2.4.5 - Business rules

##### 2.4.5.1 - `rule-events-filter-persistence`

Applied filters must persist across pagination changes until explicitly cleared.

##### 2.4.5.2 - `rule-events-filter-combination`

Location and price filters work together, showing events that match all applied criteria.

### 2.5 - Component `EventCard`

Individual event display card showing key event information in a visually appealing format.

#### 2.5.1 - Child components

- `EventImage` - Event thumbnail or placeholder
- `EventBadge` - Free/Paid indicator badge
- `EventDetails` - Title, date, location display

#### 2.5.2 - Style and Layout

Card layout with image at top, content below. Fixed aspect ratio for consistency. Hover effects for interactivity. Badge positioned as overlay on image.

#### 2.5.3 - Data

- Event object from parent component
- Formatted date and location strings
- Price information for badge display

#### 2.5.4 - Actions

- **On card click**: Navigates to event detail page
- **On hover**: Shows interactive state

#### 2.5.5 - Business rules

##### 2.5.5.1 - `rule-events-card-display`

Free events must display a "FREE" badge, while paid events show the price or "PAID" indicator.