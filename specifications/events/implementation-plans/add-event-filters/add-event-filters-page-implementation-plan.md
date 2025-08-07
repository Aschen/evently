# Evently Page Implementation Plan

Author: Claude
Date: 2025-08-07

This implementation plan describes how to add event filtering capabilities to the Evently home page, specifically a free/paid filter. The filter will allow users to narrow down their event search results based on whether events are free or require payment, enhancing the user experience by making it easier to find events that match their budget preferences.

The implementation involves adding a new filter component to the existing home page layout, positioned below the location search bar and above the events grid. This filter will integrate with the recently updated backend API that now supports the `isFree` query parameter.

## 1 - Components

### 1.1 - Component `EventFilters`

A filter bar component that provides filtering options for the events list. Initially, this will include a free/paid toggle filter, with the design allowing for future expansion to include other filters like event type.

The component uses a horizontal layout with filter chips or toggle buttons that users can click to apply filters. It maintains the selected filter state and communicates changes to the parent EventsList component.

Position: Located between the LocationSearchBar and the EventsList components, centered on the page with responsive width matching the search bar styling.

Data: 
- Maintains local state for the selected filter value (all/free/paid)
- Passes the `isFree` parameter value (undefined/true/false) to the parent component
- No direct API calls, works through props and callbacks

Style:
- Horizontal layout with filter options displayed as toggle buttons or chips
- Active filter state clearly indicated with distinct background color or border
- Responsive design that stacks vertically on very small screens
- Consistent spacing and alignment with the search bar above

Actions:
- **On filter selection**: Updates local state and calls parent callback with new filter value
- **On clear filters**: Resets to show all events (isFree = undefined)

### 1.2 - Assumptions about component

- 1.2.1: The filter will use a three-state toggle: "All Events", "Free Events", "Paid Events"
- 1.2.2: Only one filter state can be active at a time
- 1.2.3: The default state is "All Events" (no filter applied)
- 1.2.4: The filter component will be reusable for potential future filter additions

### 1.3 - Component `EventsList` (Modified)

The existing EventsList component needs to be updated to:
- Accept filter parameters from the EventFilters component
- Pass the isFree parameter to the API call
- Maintain filter state across pagination

Data updates:
- Add `isFree?: boolean` to the API call parameters
- The API already returns filtered results based on this parameter

### 1.4 - Component `HomePage` (Modified)

The parent component that orchestrates the search bar, filters, and events list needs to:
- Manage the filter state at the page level
- Pass filter state between EventFilters and EventsList components
- Ensure filter state persists when pagination changes

## 2 - Business rules

### 2.1 - (inferred) `rule-events-filter-persistence`

When users apply a filter and then change pages using pagination, the filter should remain active. The filter state should only reset when explicitly cleared by the user or when navigating away from the page.

### 2.2 - (inferred) `rule-events-filter-combination`

The free/paid filter should work in combination with the location search. When both a location and a price filter are applied, the results should show events that match both criteria.

### 2.3 - (user) `rule-events-free-paid-filter`

Users should be able to filter the event list to show only free events or only paid events. This helps users find events that match their budget preferences.

### 2.4 - (inferred) `rule-events-filter-accessibility`

The filter component should be keyboard accessible and work with screen readers, following WCAG guidelines for interactive controls.

### 2.5 - (inferred) `rule-events-filter-visual-feedback`

The currently active filter should be clearly indicated visually, and the number of results should update to reflect the filtered count.