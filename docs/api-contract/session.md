# Session API Contract

## Overview

This document outlines the API contract for **session management** in the Paid bill-splitting app. A session represents a bill-splitting event (e.g., badminton court rental, dinner) where a host splits expenses among players.

## Base URL

All session endpoints use the base path: `/api/sessions`

---

## Session Workflow

```
1. Create Session → 2. Add Players → 3. Add Image → 4. Add Expenses → 5. Generate Split → 6. Collect Payments → 7. Close
```

---

## Endpoints

### 1. Create Session

**Endpoint:** `POST /api/sessions`

**Description:** Creates a new bill-splitting session. The authenticated user becomes the host.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "Badminton Pemogan",
  "description": "Sunday morning session",
  "date": "2025-07-26T00:00:00Z"
}
```

**Request Fields:**
- `name` - Session name (required) — e.g., "Badminton Pemogan"
- `description` - Optional description
- `date` - Session date (required)

**Response (Success - 201):**
```json
{
  "message": "Session created successfully",
  "data": {
    "id": "uuid",
    "name": "Badminton Pemogan",
    "description": "Sunday morning session",
    "date": "2025-07-26T00:00:00Z",
    "status": "DRAFT",
    "totalAmount": null,
    "playerCount": 0,
    "host": {
      "id": "uuid",
      "name": "Felly"
    },
    "createdAt": "datetime"
  }
}
```

---

### 2. Get My Sessions

**Endpoint:** `GET /api/sessions`

**Description:** Retrieves all sessions created by or participated in by the authenticated user.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `role` - Filter by role: `host` (created by me), `player` (participating in), `all` (default)
- `status` - Filter by status: `DRAFT`, `PROCESSING_FACES`, `READY_TO_SPLIT`, `SPLIT_CONFIRMED`, `CLOSED`, `all` (default)
- `sortBy` - Sort field: `date`, `created_at`, `name`
- `sortOrder` - `asc` or `desc` (default)

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
        "status": "DRAFT",
        "totalAmount": 135000,
        "playerCount": 5,
        "myRole": "HOST",
        "host": {
          "id": "uuid",
          "name": "Felly"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

### 3. Get Session Details

**Endpoint:** `GET /api/sessions/{sessionId}`

**Description:** Retrieves full session details including players, expenses, and obligations.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Path Parameters:**
- `sessionId` - Session UUID (required)

**Response (Success):**
```json
{
  "message": "Session details retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Badminton Pemogan",
    "description": "Sunday morning session",
    "date": "2025-07-26T00:00:00Z",
    "status": "DRAFT",
    "groupPhotoUrl": "string|null",
    "host": {
      "id": "uuid",
      "name": "Felly",
      "photoUrl": "string|null"
    },
    "players": [
      {
        "id": "uuid",
        "name": "Felly",
        "photoUrl": "string|null",
        "role": "HOST"
      },
      {
        "id": "uuid",
        "name": "Jessica",
        "photoUrl": "string|null",
        "role": "PLAYER"
      }
    ],
    "expenses": [
      {
        "id": "uuid",
        "description": "Court",
        "amount": 60000,
        "quantity": 2,
        "subtotal": 120000
      },
      {
        "id": "uuid",
        "description": "Shuttlecock",
        "amount": 15000,
        "quantity": 1,
        "subtotal": 15000
      }
    ],
    "totalAmount": 135000,
    "perPersonAmount": 27000
  }
}
```

---

### 4. Update Session

**Endpoint:** `PUT /api/sessions/{sessionId}`

**Description:** Updates session details. Only the host can update.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "string|optional",
  "description": "string|optional",
  "date": "datetime|optional"
}
```

**Response (Success):**
```json
{
  "message": "Session updated successfully",
  "data": { ... }
}
```

---

### 5. Delete Session

**Endpoint:** `DELETE /api/sessions/{sessionId}`

**Description:** Soft deletes a session. Only the host can delete. Cannot delete if payments are pending.

**Response (Success):**
```json
{
  "message": "Session deleted successfully",
  "data": null
}
```

---

## Player Management

### 6. Add Players to Session

**Endpoint:** `POST /api/sessions/{sessionId}/players`

**Description:** Adds one or more players to the session.

**Request Body:**
```json
{
  "players": [
    {
      "name": "Jessica",
      "email": "jessica@example.com",
      "phone": "+62812345678"
    },
    {
      "name": "James"
    }
  ]
}
```

**Response (Success):**
```json
{
  "message": "Players added successfully",
  "data": {
    "addedCount": 2,
    "players": [
      {
        "id": "uuid",
        "name": "Jessica",
        "email": "jessica@example.com",
        "role": "PLAYER"
      }
    ]
  }
}
```

---

### 7. Remove Player from Session

**Endpoint:** `DELETE /api/sessions/{sessionId}/players/{playerId}`

**Description:** Removes a player from the session. Cannot remove if split already confirmed.

**Response (Success):**
```json
{
  "message": "Player removed successfully",
  "data": null
}
```

---

## Group Photo & Face Detection

### 8. Upload Group Photo

**Endpoint:** `POST /api/sessions/{sessionId}/photo`

**Description:** Uploads a group photo. Triggers face detection processing.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: multipart/form-data`

**Request Body (multipart):**
- `photo` - Image file (JPEG, PNG; max 10MB)

**Response (Success):**
```json
{
  "message": "Photo uploaded, face detection started",
  "data": {
    "mediaAssetId": "uuid",
    "status": "PROCESSING_FACES",
    "groupPhotoUrl": "string"
  }
}
```

---

### 9. Get Face Detection Results

**Endpoint:** `GET /api/sessions/{sessionId}/faces`

**Description:** Retrieves detected faces and match suggestions.

**Response (Success):**
```json
{
  "message": "Faces retrieved successfully",
  "data": {
    "status": "READY_TO_SPLIT",
    "detectedFaces": [
      {
        "id": "uuid",
        "faceIndex": 1,
        "boundingBox": { "x": 100, "y": 50, "width": 80, "height": 100 },
        "suggestions": [
          {
            "playerId": "uuid",
            "playerName": "Jessica",
            "confidence": 0.95
          }
        ],
        "confirmedPlayer": null
      }
    ]
  }
}
```

---

### 10. Confirm Face Mappings

**Endpoint:** `POST /api/sessions/{sessionId}/faces/confirm`

**Description:** Host confirms face-to-player mappings.

**Request Body:**
```json
{
  "confirmations": [
    { "detectedFaceId": "uuid", "playerId": "uuid" }
  ]
}
```

**Response (Success):**
```json
{
  "message": "Face mappings confirmed",
  "data": {
    "confirmedCount": 5
  }
}
```

---

## Expense Management

### 11. Add Expense Items

**Endpoint:** `POST /api/sessions/{sessionId}/expenses`

**Description:** Adds expense items to the session.

**Request Body:**
```json
{
  "items": [
    { "description": "Court", "amount": 60000, "quantity": 2 },
    { "description": "Shuttlecock", "amount": 15000, "quantity": 1 }
  ]
}
```

**Response (Success):**
```json
{
  "message": "Expenses added successfully",
  "data": {
    "items": [
      { "id": "uuid", "description": "Court", "amount": 60000, "quantity": 2, "subtotal": 120000 },
      { "id": "uuid", "description": "Shuttlecock", "amount": 15000, "quantity": 1, "subtotal": 15000 }
    ],
    "totalAmount": 135000
  }
}
```

---

### 12. Update Expense Item

**Endpoint:** `PUT /api/sessions/{sessionId}/expenses/{expenseId}`

**Request Body:**
```json
{
  "description": "string|optional",
  "amount": "decimal|optional",
  "quantity": "integer|optional"
}
```

---

### 13. Delete Expense Item

**Endpoint:** `DELETE /api/sessions/{sessionId}/expenses/{expenseId}`

---

### 14. Get Expense Summary

**Endpoint:** `GET /api/sessions/{sessionId}/expenses`

**Response (Success):**
```json
{
  "message": "Expenses retrieved successfully",
  "data": {
    "items": [ ... ],
    "totalAmount": 135000,
    "playerCount": 5,
    "perPersonAmount": 27000
  }
}
```

---

## Split & Obligations

### 15. Generate Split

**Endpoint:** `POST /api/sessions/{sessionId}/split`

**Description:** Calculates equal split and creates payment obligations. Idempotent.

**Headers:**
- `Idempotency-Key: <uuid>` (recommended)

**Response (Success):**
```json
{
  "message": "Split generated successfully",
  "data": {
    "status": "SPLIT_CONFIRMED",
    "totalAmount": 135000,
    "playerCount": 5,
    "perPersonAmount": 27000,
    "obligations": [
      {
        "id": "uuid",
        "payerId": "uuid",
        "payerName": "Jessica",
        "amount": 27000,
        "status": "PENDING"
      }
    ]
  }
}
```

---

### 16. Get Obligations

**Endpoint:** `GET /api/sessions/{sessionId}/obligations`

**Response (Success):**
```json
{
  "message": "Obligations retrieved successfully",
  "data": {
    "obligations": [ ... ],
    "summary": {
      "total": 4,
      "pending": 2,
      "verified": 2
    }
  }
}
```

---

### 17. Verify Payment

**Endpoint:** `POST /api/sessions/{sessionId}/obligations/{obligationId}/verify`

**Request Body:**
```json
{
  "action": "approve|reject",
  "rejectionReason": "string|null"
}
```

---

### 18. Send Reminder

**Endpoint:** `POST /api/sessions/{sessionId}/obligations/{obligationId}/remind`

**Description:** Sends a payment reminder to the player.

---

### 19. Close Session

**Endpoint:** `POST /api/sessions/{sessionId}/close`

**Description:** Closes session when all payments verified.

**Response (Success):**
```json
{
  "message": "Session closed successfully",
  "data": {
    "status": "CLOSED",
    "summary": {
      "totalCollected": 135000,
      "playerCount": 5
    }
  }
}
```

---

## Session Status Enum

| Status | Description |
|--------|-------------|
| `DRAFT` | Session created, adding players/expenses |
| `PROCESSING_FACES` | Group photo uploaded, detecting faces |
| `READY_TO_SPLIT` | Faces processed, ready to generate split |
| `SPLIT_CONFIRMED` | Obligations created, collecting payments |
| `CLOSED` | All payments verified, session complete |

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [{ "field": "name", "message": "Session name is required" }]
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied",
  "details": [{ "field": "session", "message": "Only the host can modify this session" }]
}
```

### 404 Not Found
```json
{
  "error": "Session not found",
  "details": [{ "field": "sessionId", "message": "Session does not exist" }]
}
```

### 409 Conflict
```json
{
  "error": "Cannot modify session",
  "details": [{ "field": "status", "message": "Cannot add players after split is confirmed" }]
}
```

---

## Implementation Notes

### Business Rules
- Host is automatically added as first player with role `HOST`
- Per-person amount = `totalAmount / playerCount` (banker's rounding)
- Remainder from rounding absorbed by host
- Cannot modify players/expenses after split confirmed
- Cannot close session until all payments verified

### IDR Currency
- All amounts are in Indonesian Rupiah (IDR)
- Stored as integers (no decimals for IDR)
- Display format: `IDR 135,000`
