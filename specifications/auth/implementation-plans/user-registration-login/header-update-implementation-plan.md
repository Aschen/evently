# Evently Page Implementation Plan

Author: Claude
Date: 2025-08-07

This implementation plan describes the updates needed to the site header component to add authentication links. The header should display "Login" and "Register" links for unauthenticated users, and user information with logout option for authenticated users.

## 1 - Components

### 1.1 - Component `Header` (update)

Update the existing header component to include authentication-aware navigation.

**Components used:**
- Logo/brand section (existing)
- Main navigation menu (existing)
- Authentication section (new)
  - Login link
  - Register link
  - User menu dropdown

**Position on the page:**
- Fixed header at top of all pages
- Authentication section aligned to the right side

**Data and API correlation:**
- Uses `GET /auth/current-user` on component mount
- Checks authentication status to determine which links to show
- Stores current user data in component state

**Detailed style:**
- Authentication links styled consistently with existing navigation
- User email displayed when logged in
- Dropdown menu for authenticated users with logout option
- Responsive design for mobile devices

**Actions:**
- Login link click: Navigate to `/login` route
- Register link click: Navigate to `/register` route
- User menu click: Toggle dropdown visibility
- Logout click: Call `POST /auth/logout`, clear stored token, redirect to home

### 1.2 - Component `UserMenu` (new sub-component)

Dropdown menu shown for authenticated users.

**Components used:**
- User email display
- Dropdown trigger (user icon or email)
- Menu items container
- Logout button

**Position on the page:**
- Right side of header
- Dropdown appears below the trigger element

**Data displayed:**
- User email from current user data
- User role (if relevant for display)

**Detailed style:**
- Dropdown with shadow/border
- Hover states for menu items
- Smooth open/close animation
- Click outside to close

**Actions:**
- Logout: Call logout API, clear authentication, redirect

### 1.3 - Assumptions about components

- 1.3.1: The header component is shared across all pages
- 1.3.2: Authentication state is managed globally (Context/Redux)
- 1.3.3: The header checks authentication on mount and after login/logout
- 1.3.4: Mobile responsive design collapses auth links into hamburger menu

## 2 - Business rules

### 2.1 - (user) `rule-header-auth-links`

Add links in the site header to register or to login.

### 2.2 - (inferred) `rule-header-auth-state`

The header must reactively update when authentication state changes without requiring page reload.

### 2.3 - (inferred) `rule-header-logout-flow`

Logout should:
1. Call the logout API endpoint
2. Clear stored authentication tokens
3. Update the header to show login/register links
4. Redirect to home page or login page

### 2.4 - (inferred) `rule-header-mobile-responsive`

On mobile devices, authentication links should be incorporated into the mobile menu pattern used by the site.