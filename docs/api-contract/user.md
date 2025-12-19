# User API Contract

## Overview

This document outlines the API contract for **user management** in the Paid bill-splitting app. Users are registered hosts who can create sessions and manage bill splits.

## Base URL

All user endpoints use the base path: `/api/users`

---

## Endpoints

### 1. Get My Profile

**Endpoint:** `GET /api/users/me`

**Description:** Retrieves the authenticated user's profile.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response (Success):**
```json
{
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "felly@example.com",
    "name": "Felly",
    "phone": "+62811111111",
    "photoUrl": "string|null",
    "bankAccount": {
      "bankName": "BCA",
      "accountNumber": "1234567890",
      "accountName": "Felly"
    } | null,
    "createdAt": "datetime",
    "stats": {
      "sessionsHosted": 15,
      "sessionsParticipated": 8,
      "totalCollected": 2500000,
      "totalPaid": 450000
    }
  }
}
```

---

### 2. Update My Profile

**Endpoint:** `PUT /api/users/me`

**Description:** Updates the authenticated user's profile.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "string|optional",
  "phone": "string|optional",
  "photoUrl": "string|optional",
  "bankName": "string|optional",
  "bankAccountNumber": "string|optional",
  "bankAccountName": "string|optional"
}
```

**Response (Success):**
```json
{
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "email": "felly@example.com",
    "name": "Felly",
    "phone": "+62811111111",
    "photoUrl": "string|null",
    "bankAccount": {
      "bankName": "BCA",
      "accountNumber": "1234567890",
      "accountName": "Felly"
    } | null
  }
}
```

---

### 3. Upload Profile Photo

**Endpoint:** `POST /api/users/me/photo`

**Description:** Uploads a new profile photo.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: multipart/form-data`

**Request Body:**
- `photo` - Image file (JPEG, PNG; max 5MB)

**Response (Success):**
```json
{
  "message": "Photo uploaded successfully",
  "data": {
    "photoUrl": "string"
  }
}
```

---

### 4. Get My Sessions (as Host)

**Endpoint:** `GET /api/users/me/sessions`

**Description:** Retrieves all sessions created by the authenticated user.

**Query Parameters:**
- `status` - Filter: `DRAFT`, `SPLIT_CONFIRMED`, `CLOSED`, `all`
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response (Success):**
```json
{
  "message": "Sessions retrieved successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Badminton Pemogan",
        "date": "2025-07-26T00:00:00Z",
        "status": "SPLIT_CONFIRMED",
        "totalAmount": 135000,
        "playerCount": 5,
        "pendingPayments": 2
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 5. Get My Payment Summary

**Endpoint:** `GET /api/users/me/summary`

**Description:** Gets a summary of collection and payment activity.

**Response (Success):**
```json
{
  "message": "Summary retrieved successfully",
  "data": {
    "asHost": {
      "totalSessions": 15,
      "totalCollected": 2500000,
      "pending": 350000,
      "activeSessions": 3
    },
    "asPlayer": {
      "totalSessions": 8,
      "totalPaid": 450000,
      "pending": 54000
    }
  }
}
```

---

### 6. Change Password

**Endpoint:** `POST /api/users/me/password`

**Description:** Changes the user's password.

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response (Success):**
```json
{
  "message": "Password changed successfully",
  "data": null
}
```

---

### 7. Delete Account

**Endpoint:** `DELETE /api/users/me`

**Description:** Soft deletes the user account. Cannot delete if active sessions exist.

**Response (Success):**
```json
{
  "message": "Account deleted successfully",
  "data": null
}
```

**Response (Active Sessions):**
```json
{
  "error": "Cannot delete account",
  "details": [
    { "field": "sessions", "message": "You have 2 active sessions with pending payments" }
  ]
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "details": [{ "field": "token", "message": "Invalid or expired token" }]
}
```

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [{ "field": "name", "message": "Name must be at least 2 characters" }]
}
```

---

## Implementation Notes

### Security
- Email cannot be changed after registration
- Password changes require current password verification
- Account deletion is soft delete (data preserved for records)

### Player Link
- Users are automatically linked to a `player` record
- This enables tracking both as host (user) and participant (player)
