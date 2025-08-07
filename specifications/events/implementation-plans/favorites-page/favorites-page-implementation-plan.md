# Evently Page Implementation Plan

Author: Claude
Date: 2025-08-07

This page displays the user's favorite events list with the ability to remove events from favorites. It provides a personalized view of events the user has marked as favorites, with filtering and pagination capabilities similar to the main events list.

## 1 - Components

### 1.1 - Component `FavoritesPageHeader`

A header component that displays the page title and a count of total favorite events.
Position: Top of the page
Data displayed: Total count from EventsFavoritesListResponseDto
Style: 
- Large bold title "My Favorite Events"
- Subtitle showing count: "You have X favorite events"
- Consistent with other page headers in the application

### 1.2 - Component `FavoritesFilterBar`

A filter bar component allowing users to filter their favorite events.
Components used: SearchInput, TypeFilter, LocationFilter, PriceFilter
Position: Below the header
Data displayed: Filter options similar to main events page
Style:
- Horizontal layout on desktop, stacked on mobile
- Search input with magnifying glass icon
- Dropdown selects for type and price filters
- Location autocomplete input
- Clear filters button when filters are active

### 1.3 - Component `FavoritesEventGrid`

A grid layout displaying favorite event cards.
Components used: EventCard (modified to show remove from favorites option)
Position: Main content area below filters
Data displayed: Events array from EventsFavoritesListResponseDto
Style:
- Responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- Card spacing consistent with main events page
- Loading skeleton while fetching data
- Empty state when no favorites match filters

### 1.4 - Component `EventCard` (modified for favorites)

Individual event card showing event details with remove from favorites action.
Position: Within the FavoritesEventGrid
Data displayed: EventDto with isFavorited always true
Style:
- Image at top (or placeholder if no image)
- Event name, date, location, type, and price
- Filled heart icon (red) with hover effect
- On hover: "Remove from favorites" tooltip
- Click on heart removes from favorites with confirmation

### 1.5 - Component `EmptyFavoritesState`

Empty state component shown when user has no favorites.
Position: Center of main content area when no favorites exist
Style:
- Large icon (empty heart or bookmark)
- Heading: "No favorite events yet"
- Subtext: "Events you mark as favorites will appear here"
- CTA button: "Browse events" linking to main events page

### 1.6 - Component `FavoritesPagination`

Pagination controls for navigating through favorite events.
Position: Bottom of the page
Data displayed: Current page calculated from from/size, total from response
Style:
- Previous/Next buttons
- Page numbers with current page highlighted
- Items per page selector (10, 20, 50)
- Showing "X-Y of Z results" text

### 1.7 - Assumptions about components

- 1.7.1: The EventCard component will be reused from the main events page with modifications for the favorites context
- 1.7.2: Filter components will be shared with the main events page for consistency
- 1.7.3: The page will use the same layout structure as other pages in the application
- 1.7.4: Loading states will be shown while data is being fetched
- 1.7.5: Error states will be handled gracefully with retry options

## 2 - Business rules

### 2.1 - (user) `rule-favorites-authentication-required`

Users must be authenticated to view the favorites page. Unauthenticated users should be redirected to the login page with a return URL to come back after authentication.

### 2.2 - (inferred) `rule-favorites-realtime-sync`

When a user removes an event from favorites, it should be immediately removed from the displayed list without requiring a page refresh. The total count should also update in real-time.

### 2.3 - (inferred) `rule-favorites-confirmation-on-remove`

When removing an event from favorites, show a brief confirmation toast/notification to confirm the action was successful. Optionally provide an "undo" action for a few seconds.

### 2.4 - (user) `rule-favorites-maintain-filters`

Filter selections should be maintained when removing items from favorites. The list should re-render with the same filters applied after an item is removed.

### 2.5 - (inferred) `rule-favorites-responsive-design`

The favorites page must be fully responsive and work well on mobile devices, tablets, and desktop screens with appropriate layout adjustments.

## 3 - API Integration

### 3.1 - List Favorites

Use `GET /events/favorites` to fetch the user's favorite events with pagination and filtering:
- Query parameters: from, size, search, location, type, isFree
- Response: EventsFavoritesListResponseDto with events array and total count
- Handle 401 errors by redirecting to login

### 3.2 - Remove from Favorites

Use `DELETE /events/{id}/favorites` to remove an event from favorites:
- Path parameter: event ID
- Response: 204 No Content on success
- Update local state immediately for responsive UX
- Show success notification

### 3.3 - Assumptions about API integration

- 3.3.1: API calls will use the existing API client service with proper authentication headers
- 3.3.2: Error handling will follow the application's standard error handling patterns
- 3.3.3: Loading states will be managed using the framework's state management solution
- 3.3.4: Pagination state will be managed in the URL query parameters for shareable links

## 4 - State Management

### 4.1 - Page State

- favoriteEvents: EventDto[] - Array of favorite events
- totalFavorites: number - Total count of favorites
- isLoading: boolean - Loading state
- error: string | null - Error state
- filters: { search?, location?, type?, isFree? } - Active filters
- pagination: { from: number, size: number } - Pagination state

### 4.2 - State Updates

- On mount: Fetch favorites with default pagination
- On filter change: Reset to first page and fetch with new filters
- On pagination change: Fetch with new pagination parameters
- On remove favorite: Optimistically update UI, then confirm with API
- On error: Show error message with retry option

## 5 - User Experience Considerations

### 5.1 - Performance

- Implement virtual scrolling for large lists if needed
- Debounce search input to avoid excessive API calls
- Cache filter results for quick navigation
- Preload next page of results when user is near the end

### 5.2 - Accessibility

- Proper ARIA labels for interactive elements
- Keyboard navigation support for filters and pagination
- Screen reader announcements for state changes
- Focus management when removing items

### 5.3 - Visual Feedback

- Loading skeletons while fetching data
- Smooth transitions when removing items
- Hover states for interactive elements
- Clear indication of active filters
- Success/error notifications for user actions