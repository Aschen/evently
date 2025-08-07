# Evently Page Implementation Plan

Author: Claude
Date: 2025-08-07

This implementation plan describes the login functionality for the Evently application. Users will be able to authenticate using their email and password through a dedicated login page, with a login link added to the site header. Registration functionality is explicitly excluded from this implementation.

## 1 - Components

### 1.1 - Component `LoginPage`

A dedicated page component containing the login form.

**Components used:**
- Page container with centered content
- LoginForm component
- Page title

**Position on the page:**
- Full page component
- Content centered vertically and horizontally
- Responsive layout for all screen sizes

**Route:**
- Available at `/login`

### 1.2 - Component `LoginForm`

A form component that handles user authentication.

**Components used:**
- Form container
- Email input field with label
- Password input field with label
- Submit button
- Error message display area
- Loading spinner (during API call)

**Position on the page:**
- Centered within the LoginPage
- Maximum width of 400px for optimal readability
- Adequate padding on mobile devices

**Data and API correlation:**
- Uses `POST /auth/login` endpoint
- Sends `LoginWithPasswordParamsDto`:
  - `email`: User's email address
  - `password`: User's password
  - `returnToken`: Set to true to receive JWT token

**Detailed style:**
- Clean, minimalist form design
- Input fields with floating labels or labels above fields
- Password field with masked input (type="password")
- Primary button for submit action
- Error messages in red color below the form
- Disabled state for submit button during API call
- Loading indicator during authentication

**Actions:**
- On form submit: 
  - Client-side validation (email format, required fields)
  - Call login API
  - Show loading state
- On successful login:
  - Store JWT token in localStorage/sessionStorage
  - Redirect to home page or previous page
  - Update global auth state
- On error:
  - Display error message (invalid credentials, network error)
  - Clear password field
  - Remove loading state

### 1.3 - Component `Header` (update)

Update the existing header component to include login link for unauthenticated users.

**Components used:**
- Existing header structure
- Authentication section (new):
  - Login link (unauthenticated state)
  - User info and logout (authenticated state)

**Position on the page:**
- Right side of the header
- Responsive positioning for mobile

**Data and API correlation:**
- Uses `GET /auth/current-user` to check authentication status
- Called on component mount and auth state changes

**Detailed style:**
- Login link styled as text link or button
- Consistent with existing header navigation style
- User email displayed when authenticated
- Logout option (link or button)

**Actions:**
- Login link click: Navigate to `/login` route
- Logout click: 
  - Call `POST /auth/logout`
  - Clear stored token
  - Update auth state
  - Redirect to home page

### 1.4 - Assumptions about components

- 1.4.1: The application uses React with React Router for routing
- 1.4.2: JWT tokens are stored in browser storage for persistence
- 1.4.3: Global authentication state is managed via Context API or similar
- 1.4.4: The application has an existing design system for forms and buttons
- 1.4.5: API calls use an HTTP client that automatically includes auth headers

## 2 - Business rules

### 2.1 - (user) `rule-auth-login-only`

The system should only provide login functionality. No registration page or links should be implemented.

### 2.2 - (user) `rule-auth-header-link`

A login link must be added to the site header, visible only to unauthenticated users.

### 2.3 - (inferred) `rule-auth-redirect-after-login`

After successful login, users should be redirected to the home page or to the page they were trying to access before being prompted to login.

### 2.4 - (inferred) `rule-auth-token-management`

JWT tokens received from the login endpoint should be:
- Stored securely in the browser
- Included in Authorization headers for all API requests
- Cleared on logout

### 2.5 - (inferred) `rule-auth-persistent-session`

Users should remain logged in across browser sessions until they explicitly log out or the token expires.

### 2.6 - (inferred) `rule-auth-form-validation`

The login form should validate:
- Email format before submission
- Both fields are required
- Show appropriate error messages for validation failures