# Evently Home Page Summary

## Overview
The home page is the main entry point of the Evently application, designed to help users discover events near them through location-based search. It provides a clean, responsive interface for browsing events with filtering capabilities.

## Page Structure

### Header Section
- **Title**: "Discover Events Near You" - Large heading centered on a primary color background
- **Subtitle**: "Find concerts, exhibitions, conferences, and more" - Supporting text below the title
- **Style**: Primary blue background with white text, padding for visual hierarchy

### Search Section
- **LocationSearchBar Component**: 
  - Centered search input with maximum width of 600px
  - Search icon in the input field
  - Autocomplete dropdown showing location suggestions
  - Debounced input (300ms) to avoid excessive API calls
  - Loading spinner during search

### Events Display Section
- **EventsList Component**:
  - Responsive grid layout (1 column mobile, 2-3 tablet, 3-4 desktop)
  - Event cards with hover animation effect
  - Loading spinner centered during data fetch
  - Empty state message when no events found
  - Pagination controls at the bottom when needed

## Components

### LocationSearchBar
- **Purpose**: Allows users to search for events by location with autocomplete
- **Features**:
  - Real-time location suggestions as user types (minimum 2 characters)
  - Clears event filter when search is cleared
  - Displays formatted location names (address, city, country)
- **API**: Calls `GET /events/locations` with query parameter

### EventCard
- **Purpose**: Displays individual event information in a card format
- **Layout**:
  - Event image at top (200px height) or placeholder if no image
  - Event name as prominent title
  - Date/time with calendar icon
  - Location with pin icon
  - Event type badge with color coding
  - Price display (shows "Free" or amount with currency)
- **Styling**: 
  - Shadow effect with hover animation
  - Type badges with distinct colors per category

### EventsList
- **Purpose**: Manages and displays the grid of event cards
- **Features**:
  - Fetches events with pagination (12 per page)
  - Handles loading, error, and empty states
  - Updates when location filter changes
  - Responsive grid layout
- **API**: Calls `GET /events` with pagination and location parameters

## Business Rules Implemented

1. **Location Search** (`rule-events-location-search`): Autocomplete suggestions filter events by selected location
2. **Public Access** (`rule-events-public-access`): No authentication required for viewing events
3. **Price Display** (`rule-events-price-display`): Clear indication of free vs paid events
4. **Type Categorization** (`rule-events-type-categorization`): Visual distinction through colored badges
5. **Pagination** (`rule-events-pagination`): Efficient handling of large event lists

## Technical Implementation

- **State Management**: React hooks (useState, useEffect, useCallback)
- **API Integration**: Axios-based API client with proper error handling
- **Debouncing**: Custom useDebounce hook for search optimization
- **Styling**: Material-UI components with custom sx props
- **Type Safety**: Full TypeScript implementation with DTOs from API client

## User Experience

1. User lands on home page and sees all available events
2. User can search for a location using the search bar
3. As they type, location suggestions appear
4. Selecting a location filters events to that area
5. Events are displayed in an attractive grid layout
6. User can navigate through pages of results
7. Clear visual indicators for event type and pricing