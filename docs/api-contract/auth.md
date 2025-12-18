# Authentication API Contract

## Overview

This document outlines the API contract for authentication management, which includes user registration, login, OAuth callback handling, profile retrieval, and magic link token authentication. The system supports traditional email/password authentication, OAuth providers (Apple, LinkedIn), and magic link tokens for participant access.

---

## Common API Conventions

These conventions apply to all API endpoints.

### Authentication Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Authorization` | `Bearer <token>` | JWT token for authenticated endpoints |
| `Content-Type` | `application/json` | Required for POST/PUT/PATCH requests |

### Standard Response Format

**Success Response:**
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "error": "Error type",
  "details": [
    {
      "field": "fieldName",
      "message": "Human-readable error message"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request — Invalid input |
| `401` | Unauthorized — Missing or invalid token |
| `403` | Forbidden — Insufficient permissions |
| `404` | Not Found — Resource doesn't exist |
| `409` | Conflict — Duplicate resource |
| `422` | Unprocessable Entity — Validation failed |
| `500` | Internal Server Error |

### Pagination (List Endpoints)

Query parameters:
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 10, max: 100)

Response includes:
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Idempotency

For critical operations (payment, split generation), include:

| Header | Description |
|--------|-------------|
| `Idempotency-Key` | Unique client-generated key (UUID recommended) |

---

## Base URL

All authentication endpoints use the base path: `/api/auth`

---

## Endpoints

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Registers a new user with email and password authentication.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "auth_provider": "EMAIL|APPLE|LINKEDIN",
  "email": "string",
  "password": "string",
  "username": "string",
  "name": "string",
  "is_active": "boolean|optional"
}
```

**Request Fields:**
- `auth_provider` - Authentication provider (optional, defaults to EMAIL)
- `email` - User's email address (required)
- `password` - User's password (required, min 6 chars, must contain number)
- `username` - Unique username (required)
- `name` - User's full name (required)
- `is_active` - Account status (optional, defaults to true)

**Response (Success):**
```json
{
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "auth_provider": "EMAIL",
      "email": "string",
      "username": "string",
      "name": "string",
      "linkedinUsername": "string|null",
      "photoLink": "string|null",
      "professionId": "uuid|null",
      "profession": {
        "id": "uuid",
        "name": "string",
        "categoryName": "string"
      }|null,
      "is_active": "boolean",
      "created_at": "datetime",
      "updated_at": "datetime"
    },
    "token": "jwt_token",
    "activeEvent": {
      "attendeeId": "uuid",
      "event": {
        "id": "uuid",
        "name": "string",
        "start": "datetime",
        "end": "datetime",
        "detail": "string|null",
        "photo_link": "string|null",
        "location_name": "string|null",
        "location_address": "string|null",
        "location_link": "string|null",
        "latitude": "decimal|null",
        "longitude": "decimal|null",
        "link": "string|null",
        "status": "ONGOING",
        "current_participants": "number",
        "code": "string",
        "creator": {
          "id": "uuid",
          "name": "string"
        }
      }
    }
  }
}
```

**Note:** The `activeEvent` field is only included when the user is currently attending an ongoing event. If the user is not in an active event, this field will not be present in the response.

**Business Logic:**
- Validates email uniqueness
- Hashes password before storage
- Generates JWT token for immediate authentication
- Checks if user is currently attending an ongoing event
- If user is in an active event, includes event details and attendee ID in token
- Returns complete user profile with token and active event information (if applicable)

---

### 2. Login User

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticates a user with email and password.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Request Fields:**
- `email` - User's email address (required)
- `password` - User's password (required)

**Response (Success):**
```json
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "auth_provider": "EMAIL",
      "email": "string",
      "username": "string",
      "name": "string",
      "linkedinUsername": "string|null",
      "photoLink": "string|null",
      "professionId": "uuid|null",
      "profession": {
        "id": "uuid",
        "name": "string",
        "categoryName": "string"
      }|null,
      "is_active": "boolean",
      "created_at": "datetime",
      "updated_at": "datetime"
    },
    "token": "jwt_token",
    "activeEvent": {
      "attendeeId": "uuid",
      "event": {
        "id": "uuid",
        "name": "string",
        "start": "datetime",
        "end": "datetime",
        "detail": "string|null",
        "photo_link": "string|null",
        "location_name": "string|null",
        "location_address": "string|null",
        "location_link": "string|null",
        "latitude": "decimal|null",
        "longitude": "decimal|null",
        "link": "string|null",
        "status": "ONGOING",
        "current_participants": "number",
        "code": "string",
        "creator": {
          "id": "uuid",
          "name": "string"
        }
      }
    }
  }
}
```

**Note:** The `activeEvent` field is only included when the user is currently attending an ongoing event. If the user is not in an active event, this field will not be present in the response.

**Business Logic:**
- Validates email and password combination
- Checks if user account is active
- Checks if user is currently attending an ongoing event
- If user is in an active event, includes event details and attendee ID in token
- Generates JWT token for session management
- Returns complete user profile with token and active event information (if applicable)

---

### 3. OAuth Callback

**Endpoint:** `POST /api/auth/callback`

**Description:** Handles OAuth authentication callback from Supabase for Apple, LinkedIn, and other OAuth providers. Creates new users or authenticates existing users.

**Headers:**
- `Authorization: Bearer <supabase_token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{}
```

**Note:** No request body required. All user data is extracted from the Supabase token in the Authorization header.

**Response (Existing User):**
```json
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "auth_provider": "APPLE|LINKEDIN",
      "email": "string",
      "username": "string|null",
      "name": "string",
      "linkedinUsername": "string|null",
      "photoLink": "string|null",
      "professionId": "uuid|null",
      "profession": {
        "id": "uuid",
        "name": "string",
        "categoryName": "string"
      }|null,
      "is_active": "boolean",
      "created_at": "datetime",
      "updated_at": "datetime",
      "isFirst": false
    },
    "token": "jwt_token",
    "activeEvent": {
      "attendeeId": "uuid",
      "event": {
        "id": "uuid",
        "name": "string",
        "start": "datetime",
        "end": "datetime",
        "detail": "string|null",
        "photo_link": "string|null",
        "location_name": "string|null",
        "location_address": "string|null",
        "location_link": "string|null",
        "latitude": "decimal|null",
        "longitude": "decimal|null",
        "link": "string|null",
        "status": "ONGOING",
        "current_participants": "number",
        "code": "string",
        "creator": {
          "id": "uuid",
          "name": "string"
        }
      }
    }
  }
}
```

**Note:** The `activeEvent` field is only included when the user is currently attending an ongoing event. If the user is not in an active event, this field will not be present in the response.

**Response (New User):**
```json
{
  "message": "User created and logged in successfully",
  "data": {
    "user": {
      "id": "uuid",
      "auth_provider": "APPLE|LINKEDIN",
      "email": "string",
      "username": "string|null",
      "name": "string",
      "linkedinUsername": "string|null",
      "photoLink": "string|null",
      "professionId": "uuid|null",
      "profession": {
        "id": "uuid",
        "name": "string",
        "categoryName": "string"
      }|null,
      "is_active": "boolean",
      "created_at": "datetime",
      "updated_at": "datetime",
      "isFirst": true
    },
    "token": "jwt_token",
    "activeEvent": {
      "attendeeId": "uuid",
      "event": {
        "id": "uuid",
        "name": "string",
        "start": "datetime",
        "end": "datetime",
        "detail": "string|null",
        "photo_link": "string|null",
        "location_name": "string|null",
        "location_address": "string|null",
        "location_link": "string|null",
        "latitude": "decimal|null",
        "longitude": "decimal|null",
        "link": "string|null",
        "status": "ONGOING",
        "current_participants": "number",
        "code": "string",
        "creator": {
          "id": "uuid",
          "name": "string"
        }
      }
    }
  }
}
```

**Note:** The `activeEvent` field is only included when the user is currently attending an ongoing event. If the user is not in an active event, this field will not be present in the response.

**Business Logic:**
1. Verifies Supabase token and extracts user data
2. Checks if user exists by email in local database
3. **If existing user:**
   - Updates user information from OAuth provider
   - Returns 200 status with "Login successful" message
   - Sets `isFirst: false` in user response
4. **If new user:**
   - Creates new user account with OAuth provider data
   - Determines auth_provider from Supabase metadata
   - Sets account as active by default
   - Returns 201 status with "User created and logged in successfully" message
   - Sets `isFirst: true` in user response
5. Checks if user is currently attending an ongoing event
6. If user is in an active event, includes event details and attendee ID in token
7. Generates JWT token for session management
8. Returns complete user profile with token, signup flag, and active event information (if applicable)

---

### 4. Get Profile

**Endpoint:** `GET /api/auth/profile`

**Description:** Retrieves the current authenticated user's profile information.

**Headers:**
- `Authorization: Bearer <jwt_token>` (required)

**Response (Success):**
```json
{
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "auth_provider": "EMAIL|APPLE|LINKEDIN",
    "email": "string",
    "username": "string|null",
    "name": "string",
    "linkedinUsername": "string|null",
    "photoLink": "string|null",
    "professionId": "uuid|null",
    "profession": {
      "id": "uuid",
      "name": "string",
      "categoryName": "string"
    }|null,
    "is_active": "boolean",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
}
```

**Business Logic:**
- Validates JWT token from Authorization header
- Retrieves user data from database
- Returns complete profile excluding password hash

---

## Authentication Providers

| Provider | Description | Token Source |
|----------|-------------|--------------|
| `EMAIL` | Traditional email/password | Generated JWT |
| `APPLE` | Apple Sign-In via Supabase | Supabase OAuth token |
| `LINKEDIN` | LinkedIn OAuth via Supabase | Supabase OAuth token |

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Registration failed",
  "details": [
    {
      "field": "email",
      "message": "Email already in use"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Login failed",
  "details": [
    {
      "field": "credentials",
      "message": "Invalid email or password"
    }
  ]
}
```

### 401 Authentication Required
```json
{
  "error": "Authentication required",
  "details": [
    {
      "field": "token",
      "message": "No token provided"
    }
  ]
}
```

### 401 Invalid Token
```json
{
  "error": "Authentication failed",
  "details": [
    {
      "field": "token",
      "message": "Invalid or expired token"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "error": "Registration failed",
  "details": [
    {
      "field": "server",
      "message": "An error occurred during registration"
    }
  ]
}
```

---

## Token Management

### JWT Token Structure
- **Payload**: Contains user ID, email, and attendee ID (if user is in active event)
- **Expiration**: Set according to security policy
- **Usage**: Include in Authorization header as `Bearer <token>`

### Token Payload Examples
**Standard Token (User not in active event):**
```json
{
  "id": "user_uuid",
  "email": "user@example.com"
}
```

**Token with Active Event (User in ongoing event):**
```json
{
  "id": "user_uuid",
  "email": "user@example.com",
  "attendeeId": "attendee_uuid"
}
```

### Supabase Token Handling
- **OAuth Callback**: Accepts Supabase token in Authorization header
- **Verification**: Validates token with Supabase service
- **User Data**: Extracts user metadata and app metadata
- **Provider Detection**: Determines OAuth provider from token metadata

---

## Implementation Notes

### Security Considerations
- Passwords are hashed using secure algorithms
- JWT tokens include user identification data
- Supabase tokens are verified with Supabase service
- OAuth users are automatically set as active
- Email uniqueness is enforced across all providers

### OAuth Flow
1. User initiates OAuth with Apple/LinkedIn via frontend
2. Frontend receives Supabase token after successful OAuth
3. Frontend calls `/api/auth/callback` with Supabase token
4. Backend verifies token and creates/updates user
5. Backend returns JWT token for subsequent API calls

### User Data Handling
- **New OAuth Users**: Created with provider metadata
- **Existing Users**: Updated with latest OAuth information
- **Email Matching**: Users are matched by email across providers
- **Profile Completion**: OAuth users may need to complete profile later

### Performance Considerations
- Database queries optimized for email lookup
- JWT token generation is lightweight
- Supabase token verification is cached where possible
- User profile data is efficiently structured
- Active event queries are optimized with proper indexing

### Active Event Integration
The authentication system now includes active event detection for users currently attending ongoing events:

**Active Event Detection:**
- Automatically checks if user is attending an event with status "ONGOING"
- Includes attendee ID in JWT token for event-specific operations
- Returns complete event details including creator information
- Only includes active event data when user is actually in an ongoing event

**Use Cases:**
- Immediate access to event details upon login/registration
- Automatic attendee context for event-specific features
- Creator information for event management
- Seamless transition from authentication to event participation

### Magic Link Token Authentication

Magic links provide passwordless access for participants who don't have accounts:

**Flow:**
1. Host invites player via email/phone
2. System generates magic link with short-lived token
3. Player clicks link to access their payment obligations
4. Token verified and player authenticated for that session

**Security:**
- Tokens hashed before storage (SHA-256)
- 24-hour expiration by default
- Single use — marked as used after first verification
- Purpose-scoped (e.g., "payment", "view")

---

### 5. Generate Magic Link (Host)

**Endpoint:** `POST /api/auth/magic-link`

**Description:** Generates a magic link token for a player to access their obligations without full authentication.

**Headers:**
- `Authorization: Bearer <host_token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "playerId": "uuid",
  "purpose": "payment|view",
  "expiresInHours": 24
}
```

**Response (Success):**
```json
{
  "message": "Magic link generated successfully",
  "data": {
    "token": "raw_token_for_link",
    "expiresAt": "datetime",
    "link": "https://app.example.com/pay?token=..."
  }
}
```

**Business Logic:**
- Only session host can generate magic links for participants
- Token is returned once (raw), only hash stored in DB
- Link includes player context for direct access

---

### 6. Verify Magic Link

**Endpoint:** `POST /api/auth/magic-link/verify`

**Description:** Verifies a magic link token and returns a session-scoped JWT.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "token": "raw_magic_token"
}
```

**Response (Success):**
```json
{
  "message": "Token verified successfully",
  "data": {
    "player": {
      "id": "uuid",
      "name": "string",
      "email": "string|null"
    },
    "accessToken": "jwt_token",
    "purpose": "payment"
  }
}
```

**Response (Invalid/Expired):**
```json
{
  "error": "Token verification failed",
  "details": [
    {
      "field": "token",
      "message": "Token is invalid, expired, or already used"
    }
  ]
}
```

**Business Logic:**
- Hash incoming token and compare with stored hash
- Check `expires_at` and `used_at IS NULL`
- Set `used_at = now()` after successful verification
- Return limited-scope JWT for player operations

---

### Future Enhancements
- Refresh token implementation
- Multi-factor authentication support
- Social login provider expansion
- Account linking across providers
- Session management improvements
- Password reset functionality
- Real-time event status updates
- Multiple active event support
- Magic link expiry configuration per session

