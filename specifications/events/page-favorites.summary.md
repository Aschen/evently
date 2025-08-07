# Evently Module Events Page Favorites Description

## 1 - Page Description

/favorites
This page displays the user's favorite events list with the ability to remove events from favorites. It provides a personalized view of events the user has marked as favorites, allowing them to easily access and manage their preferred events. The page includes filtering capabilities to help users find specific favorites and pagination for better performance with large lists.

The page layout consists of a header with the page title and favorites count, a filter bar for searching and filtering favorites, a main content area with a responsive grid of event cards, and pagination controls at the bottom. When no favorites exist or match the filters, an empty state component provides guidance to the user.

## 2 - Components

### 2.1 - Component `FavoritesPageHeader`

A header component that displays the page title "My Favorite Events" and shows the total count of favorite events.

#### 2.1.1 - Child components

- Text elements for title and subtitle
- No child components required

#### 2.1.2 - Style and Layout

Position: Top of the page, full width
- Large bold title text "My Favorite Events"
- Subtitle showing dynamic count: "You have X favorite events"
- Padding and styling consistent with other page headers
- Responsive text sizing for mobile devices

#### 2.1.3 - Data

- Total favorites count from EventsFavoritesListResponseDto.total
- Updates dynamically when favorites are added/removed

#### 2.1.4 - Actions

- No direct actions
- Count updates automatically based on API response

#### 2.1.5 - Business rules

##### 2.1.5.1 - `rule-header-count-sync`

The favorites count must always reflect the current total from the API, updating in real-time when favorites are removed.

### 2.2 - Component `FavoritesFilterBar`

A filter bar allowing users to search and filter their favorite events by various criteria.

#### 2.2.1 - Child components

- SearchInput - Text input for searching by event name
- TypeFilter - Dropdown for filtering by event type
- LocationFilter - Autocomplete input for location filtering
- PriceFilter - Dropdown for free/paid events
- ClearFiltersButton - Button to reset all filters

#### 2.2.2 - Style and Layout

Position: Below the header, full width
- Horizontal layout on desktop with equal spacing
- Stacked vertical layout on mobile devices
- Search input with magnifying glass icon
- Dropdown selects with consistent styling
- Clear filters button appears when any filter is active
- Smooth transitions when layout changes

#### 2.2.3 - Data

- Filter values bound to URL query parameters
- Available filter options from API or predefined lists
- Current filter state managed in component state

#### 2.2.4 - Actions

- onSearchChange - Debounced search input handler
- onTypeChange - Event type filter change
- onLocationChange - Location filter change
- onPriceChange - Free/paid filter change
- onClearFilters - Reset all filters to default

#### 2.2.5 - Business rules

##### 2.2.5.1 - `rule-favorites-maintain-filters`

Filter selections must be maintained when removing items from favorites. The list should re-render with the same filters applied after an item is removed.

##### 2.2.5.2 - `rule-filter-debounce`

Search input must be debounced (300ms) to avoid excessive API calls while typing.

### 2.3 - Component `FavoritesEventGrid`

A responsive grid layout displaying favorite event cards.

#### 2.3.1 - Child components

- EventCard - Individual event card components
- LoadingSkeleton - Skeleton cards shown while loading
- EmptyFavoritesState - Shown when no favorites match filters

#### 2.3.2 - Style and Layout

Position: Main content area below filters
- CSS Grid with responsive columns: 3 on desktop, 2 on tablet, 1 on mobile
- Consistent gap spacing between cards
- Minimum height to prevent layout shift
- Smooth transitions when cards are removed

#### 2.3.3 - Data

- Events array from EventsFavoritesListResponseDto.events
- Each event passed to EventCard as EventDto
- Loading state managed by parent component

#### 2.3.4 - Actions

- Renders appropriate number of EventCard components
- Shows loading skeletons during data fetch
- Displays EmptyFavoritesState when events array is empty

#### 2.3.5 - Business rules

##### 2.3.5.1 - `rule-favorites-responsive-design`

The grid must adapt to different screen sizes maintaining proper spacing and readability across all devices.

### 2.4 - Component `EventCard`

Individual event card displaying event details with remove from favorites functionality.

#### 2.4.1 - Child components

- Image or ImagePlaceholder
- Heart icon button (filled, red)
- Text elements for event details
- Tooltip component for hover state

#### 2.4.2 - Style and Layout

Position: Within the FavoritesEventGrid
- Card with shadow and hover elevation effect
- Image at top (16:9 aspect ratio) or placeholder
- Padding for content area
- Event name as prominent heading
- Date, location, type in secondary text
- Price badge in corner
- Heart icon positioned top-right of image
- Hover state shows "Remove from favorites" tooltip

#### 2.4.3 - Data

- EventDto object with all event details
- isFavorited always true in this context
- Event id for removal action

#### 2.4.4 - Actions

- onRemoveFavorite - Triggered when heart icon is clicked
- Shows confirmation before removal
- Updates UI optimistically
- Calls DELETE /events/{id}/favorites API

#### 2.4.5 - Business rules

##### 2.4.5.1 - `rule-favorites-confirmation-on-remove`

When removing an event from favorites, show a brief confirmation toast/notification to confirm the action was successful.

##### 2.4.5.2 - `rule-favorites-realtime-sync`

When a user removes an event from favorites, it should be immediately removed from the displayed list without requiring a page refresh.

### 2.5 - Component `EmptyFavoritesState`

Empty state component shown when user has no favorites or no favorites match current filters.

#### 2.5.1 - Child components

- Icon (empty heart or bookmark)
- Heading text
- Subtext description
- CTA Button linking to events page

#### 2.5.2 - Style and Layout

Position: Center of main content area
- Centered vertically and horizontally
- Large icon (64px) with muted color
- Heading in large text
- Subtext in secondary color
- Primary button with proper spacing

#### 2.5.3 - Data

- Static text content
- Different messages for no favorites vs. no matches

#### 2.5.4 - Actions

- CTA button navigates to main events page (/events)
- Preserves any active filters in URL if applicable

#### 2.5.5 - Business rules

##### 2.5.5.1 - `rule-empty-state-context`

Show different messages based on context: "No favorite events yet" when user has no favorites at all, "No favorites match your filters" when filters are active.

### 2.6 - Component `FavoritesPagination`

Pagination controls for navigating through pages of favorite events.

#### 2.6.1 - Child components

- Previous/Next buttons
- Page number buttons
- Items per page selector
- Results text display

#### 2.6.2 - Style and Layout

Position: Bottom of the page, centered
- Horizontal layout with proper spacing
- Previous/Next buttons with icons
- Current page highlighted
- Disabled state for unavailable navigation
- "Showing X-Y of Z results" text
- Items per page dropdown on the right

#### 2.6.3 - Data

- Current page calculated from from/size parameters
- Total items from EventsFavoritesListResponseDto.total
- Available page sizes: [10, 20, 50]

#### 2.6.4 - Actions

- onPageChange - Updates from parameter and fetches new data
- onPageSizeChange - Updates size parameter and resets to first page
- Updates URL query parameters for shareable links

#### 2.6.5 - Business rules

##### 2.6.5.1 - `rule-pagination-reset-on-filter`

When filters change, pagination must reset to the first page to ensure consistent results.

##### 2.6.5.2 - `rule-favorites-authentication-required`

Users must be authenticated to view the favorites page. Unauthenticated users should be redirected to the login page with a return URL.