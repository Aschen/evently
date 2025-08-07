# Evently Login Page Summary

## Overview
The login page provides authentication functionality for Evently users. Users can sign in using their email and password credentials. The implementation follows a clean, minimalist design with proper error handling and loading states.

## Page Structure

### Route
- Path: `/login`
- Accessible to: Unauthenticated users only (authenticated users are redirected to home)

### Layout
- Full-page component with centered content
- Grey background (`grey.50`)
- Responsive design for all screen sizes

## Components

### LoginPage Component
**Location**: `apps/evently/studio/src/app/features/auth/pages/login/LoginPage.tsx`

**Purpose**: Container component that provides the page layout and title

**Features**:
- Centered layout using flexbox
- "Sign In to Evently" title above the form
- Contains the LoginForm component

### LoginForm Component
**Location**: `apps/evently/studio/src/app/features/auth/pages/login/components/LoginForm.tsx`

**Purpose**: Handles user authentication input and submission

**Features**:
- Email input field (type="email", required, autofocus)
- Password input field (type="password", required, masked)
- Submit button with loading state
- Error message display area (red alert box)
- Form validation (client-side)
- Disabled state during API calls

**Visual Design**:
- White paper component with elevation
- Maximum width of 400px
- Padding of 4 units (32px)
- Full-width input fields
- Primary color submit button

### Header Component (Updated)
**Location**: `apps/evently/studio/src/app/shared/components/Header.tsx`

**Purpose**: Application header with authentication controls

**Features**:
- "Evently" brand name (links to home)
- Login button for unauthenticated users
- User email display and logout button for authenticated users
- Sticky positioning

## Authentication Flow

### Login Process
1. User enters email and password
2. Client-side validation checks:
   - Both fields are required
   - Email format is valid
3. API call to `POST /auth/login` with credentials
4. On success:
   - JWT token stored in localStorage
   - User data fetched via `GET /auth/current-user`
   - Redirect to home page
5. On failure:
   - Error message displayed
   - Password field cleared
   - Form remains active

### Auth Context
**Location**: `apps/evently/studio/src/app/features/auth/hooks/useAuth.tsx`

**Purpose**: Global authentication state management

**Features**:
- Auth state (user, isAuthenticated, isLoading)
- Login function
- Logout function
- Automatic auth check on app load
- JWT token management

## Business Rules Enforced

1. **rule-auth-login-only**: Only login functionality is provided, no registration
2. **rule-auth-header-link**: Login link visible only to unauthenticated users
3. **rule-auth-redirect-after-login**: Users redirected to home after successful login
4. **rule-auth-token-management**: JWT tokens stored in localStorage and included in API requests
5. **rule-auth-persistent-session**: Users remain logged in across browser sessions
6. **rule-auth-form-validation**: Email format and required fields validated before submission

## API Integration

### Endpoints Used
- `POST /auth/login`: Authenticate user with email/password
- `GET /auth/current-user`: Fetch current user data
- `POST /auth/logout`: Clear server-side session

### Request/Response Flow
- Login sends `LoginWithPasswordParamsDto` with `returnToken: true`
- JWT token received in response stored in localStorage
- Token automatically included in Authorization header for subsequent requests

## Error Handling
- Network errors display generic message
- 401 errors show "Invalid email or password"
- API error messages displayed when available
- Form remains functional after errors

## Security Considerations
- Password field masked
- JWT token stored in localStorage (accessible to JavaScript)
- Token included in Authorization header as Bearer token
- Logout clears token from storage and server