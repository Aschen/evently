# Evently - API Modification Request

This document will be used by backend developers to modify the API according to the specifications you provide in order to expose the correct API routes and data to realize the view you were asked to create.

You can ask to create or update API routes.

## Instructions

## 1 - CREATE AuthController.register

Create a new public endpoint to allow users to register for an account on the Evently platform.
POST /auth/register

**Parameters:**
- `email` (string, required): User's email address for registration
- `password` (string, required): User's chosen password

**Response:**
- Status 201: User successfully created
  - `user`: UserDto object containing:
    - `id`: Generated user ID
    - `email`: User's email
    - `role`: Default "user" role
  - `token` (optional): JWT token if returnToken is true
- Status 400: Bad request (invalid email format, weak password, etc.)
- Status 409: Conflict (email already exists)

**Business Logic:**
- Validate email format
- Ensure password meets security requirements (minimum length, complexity)
- Check if email already exists in the system
- Create user with default "user" role
- Hash password before storing
- Optionally return JWT token for immediate login after registration

## 2 - UPDATE UsersController.create

The existing `/users` POST endpoint requires authentication and allows role specification. This endpoint is suitable for admin users creating other users but not for public registration.

### 2.1 - Parameters

No changes needed to this endpoint. Keep it as an admin-only endpoint for creating users with specific roles.

### 2.2 - Response

No changes needed.

### 2.3 - Data model changes

No changes needed to the data model. The UserDto already contains all necessary fields for authentication.