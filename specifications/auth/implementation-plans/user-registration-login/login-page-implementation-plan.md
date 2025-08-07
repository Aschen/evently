# Evently Page Implementation Plan

Author: Claude
Date: 2025-08-07

This implementation plan describes the login page for the Evently application. Users will be able to authenticate using their email and password to access protected features of the platform.

The page will contain a centered login form with email and password fields, a submit button, and a link to the registration page for new users.

## 1 - Components

### 1.1 - Component `LoginForm`

A form component that handles user authentication.

**Components used:**
- Form container
- Email input field
- Password input field  
- Submit button
- Link to registration page
- Error message display

**Position on the page:**
- Centered both horizontally and vertically on the page
- Maximum width of 400px for optimal readability

**Data and API correlation:**
- Uses `POST /auth/login` endpoint
- Sends `LoginWithPasswordParamsDto`:
  - `email`: User's email
  - `password`: User's password
  - `returnToken`: Set to true for SPA authentication

**Detailed style:**
- Clean, modern form design with proper spacing
- Input fields with labels and placeholders
- Password field with masked input
- Primary styled submit button
- Error messages displayed in red below the form
- Link to registration page styled as secondary text

**Actions:**
- On form submit: Validate inputs, call login API
- On successful login: Store token, redirect to home page
- On error: Display error message (invalid credentials, server error)
- On "Register" link click: Navigate to registration page

### 1.2 - Component `PageHeader`

Header component with navigation (updated to include auth links).

**Components used:**
- Logo/brand name
- Navigation menu
- Login/Register links (when not authenticated)
- User menu (when authenticated)

**Position on the page:**
- Fixed at the top of the page
- Full width

**Data and API correlation:**
- Uses `GET /auth/current-user` to check authentication status
- Displays user email when authenticated

**Detailed style:**
- Consistent with existing Evently design
- Right-aligned authentication links
- User dropdown menu when logged in

**Actions:**
- Login link: Navigate to login page
- Register link: Navigate to registration page  
- Logout: Call logout API and redirect to home

### 1.3 - Assumptions about components

- 1.3.1: The application uses a client-side routing system (likely React Router)
- 1.3.2: JWT tokens are stored in localStorage or sessionStorage for API authentication
- 1.3.3: The application has a consistent design system for forms and buttons
- 1.3.4: Error handling includes both client-side validation and server error display

## 2 - Business rules

### 2.1 - (user) `rule-auth-redirect-after-login`

After successful login, users should be redirected to the page they were trying to access, or to the home page if no redirect was specified.

### 2.2 - (inferred) `rule-auth-token-storage`

JWT tokens should be securely stored client-side and included in all authenticated API requests via Authorization header.

### 2.3 - (inferred) `rule-auth-form-validation`

Email field should validate proper email format before submission. Both fields are required and should show appropriate validation messages.

### 2.4 - (user) `rule-auth-header-links`

When not authenticated, the header should show "Login" and "Register" links. When authenticated, it should show the user's email with a logout option.