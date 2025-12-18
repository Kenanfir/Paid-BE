# Player API Contract

## Overview

This document outlines the API contract for **player operations** in the Paid bill-splitting app. Players can view their obligations, mark payments as complete, and upload payment proofs.

## Base URL

All player endpoints use the base path: `/api/player`

---

## Authentication

Players can authenticate via:
1. **JWT Token** — Registered users with full accounts
2. **Magic Link Token** — Temporary access for participants without accounts

Both token types work for all player endpoints.

---

## Endpoints

### 1. Get My Profile

**Endpoint:** `GET /api/player/me`

**Description:** Retrieves the authenticated player's profile.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response (Success):**
```json
{
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Jessica",
    "email": "jessica@example.com",
    "phone": "+62812345678",
    "photoUrl": "string|null",
    "linkedUserId": "uuid|null"
  }
}
```

---

### 2. Update My Profile

**Endpoint:** `PUT /api/player/me`

**Description:** Updates the player's profile information.

**Request Body:**
```json
{
  "name": "string|optional",
  "email": "string|optional",
  "phone": "string|optional",
  "photoUrl": "string|optional"
}
```

---

### 3. Get My Sessions

**Endpoint:** `GET /api/player/sessions`

**Description:** Retrieves all sessions the player is participating in.

**Query Parameters:**
- `status` - Filter by payment status: `pending`, `paid`, `verified`, `all`

**Response (Success):**
```json
{
  "message": "Sessions retrieved successfully",
  "data": {
    "items": [
      {
        "sessionId": "uuid",
        "sessionName": "Badminton Pemogan",
        "date": "2025-07-26T00:00:00Z",
        "hostName": "Felly",
        "myObligation": {
          "id": "uuid",
          "amount": 27000,
          "status": "PENDING"
        }
      }
    ]
  }
}
```

---

## Payment Operations

### 4. Get My Obligations

**Endpoint:** `GET /api/player/obligations`

**Description:** Retrieves all payment obligations for the authenticated player.

**Headers:**
- `Authorization: Bearer <token | magic_link_token>` (required)

**Query Parameters:**
- `status` - Filter: `PENDING`, `MARKED_PAID`, `VERIFIED`, `REJECTED`, `all`

**Response (Success):**
```json
{
  "message": "Obligations retrieved successfully",
  "data": {
    "obligations": [
      {
        "id": "uuid",
        "session": {
          "id": "uuid",
          "name": "Badminton Pemogan",
          "date": "2025-07-26T00:00:00Z",
          "hostName": "Felly",
          "hostPhone": "+62811111111"
        },
        "amount": 27000,
        "status": "PENDING",
        "payment": null
      }
    ],
    "summary": {
      "totalOwed": 54000,
      "pending": 2,
      "paid": 1
    }
  }
}
```

---

### 5. Get Obligation Details

**Endpoint:** `GET /api/player/obligations/{obligationId}`

**Description:** Gets detailed information about a specific obligation.

**Response (Success):**
```json
{
  "message": "Obligation details retrieved",
  "data": {
    "id": "uuid",
    "session": {
      "id": "uuid",
      "name": "Badminton Pemogan",
      "date": "2025-07-26T00:00:00Z",
      "groupPhotoUrl": "string|null"
    },
    "host": {
      "name": "Felly",
      "phone": "+62811111111",
      "email": "felly@example.com"
    },
    "amount": 27000,
    "status": "PENDING",
    "payment": null,
    "expenses": [
      { "description": "Court", "subtotal": 120000 },
      { "description": "Shuttlecock", "subtotal": 15000 }
    ],
    "playerCount": 5,
    "perPersonAmount": 27000
  }
}
```

---

### 6. Mark as Paid

**Endpoint:** `POST /api/player/obligations/{obligationId}/pay`

**Description:** Marks an obligation as paid and provides payment details.

**Headers:**
- `Authorization: Bearer <token | magic_link_token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "method": "CASH|TRANSFER|EWALLET|OTHER",
  "referenceNumber": "string|null",
  "notes": "string|null"
}
```

**Response (Success):**
```json
{
  "message": "Payment marked successfully",
  "data": {
    "obligationId": "uuid",
    "paymentId": "uuid",
    "status": "MARKED_PAID",
    "paidAt": "datetime"
  }
}
```

---

### 7. Upload Payment Proof

**Endpoint:** `POST /api/player/payments/{paymentId}/proof`

**Description:** Uploads payment proof (screenshot/receipt) for host verification.

**Headers:**
- `Authorization: Bearer <token | magic_link_token>` (required)
- `Content-Type: multipart/form-data`

**Request Body (multipart):**
- `proof` - Image file (JPEG, PNG; max 5MB)

**Response (Success):**
```json
{
  "message": "Proof uploaded successfully",
  "data": {
    "proofId": "uuid",
    "status": "PENDING",
    "uploadedAt": "datetime",
    "mediaUrl": "string"
  }
}
```

---

### 8. Get Payment Status

**Endpoint:** `GET /api/player/payments/{paymentId}`

**Description:** Gets the current status of a payment including proof verification.

**Response (Success):**
```json
{
  "message": "Payment status retrieved",
  "data": {
    "paymentId": "uuid",
    "obligationId": "uuid",
    "amount": 27000,
    "method": "TRANSFER",
    "referenceNumber": "TRX123456",
    "status": "MARKED_PAID",
    "paidAt": "datetime",
    "proof": {
      "id": "uuid",
      "mediaUrl": "string",
      "status": "PENDING|APPROVED|REJECTED",
      "rejectionReason": "string|null",
      "verifiedAt": "datetime|null"
    }
  }
}
```

---

### 9. Resubmit Payment Proof

**Endpoint:** `POST /api/player/payments/{paymentId}/proof/resubmit`

**Description:** Resubmits a new payment proof after rejection.

**Request Body (multipart):**
- `proof` - New image file

---

## Face Enrollment (Optional)

### 10. Enroll Face

**Endpoint:** `POST /api/player/face/enroll`

**Description:** Enrolls a face photo for future face detection matching.

**Request Body (multipart):**
- `photo` - Clear face photo (JPEG, PNG)

**Response (Success):**
```json
{
  "message": "Face enrolled successfully",
  "data": {
    "embeddingId": "uuid",
    "enrolledAt": "datetime"
  }
}
```

---

### 11. Delete Face Enrollment

**Endpoint:** `DELETE /api/player/face/{embeddingId}`

**Description:** Deletes an enrolled face embedding (GDPR compliance).

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [{ "field": "method", "message": "Payment method is required" }]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "details": [{ "field": "token", "message": "Invalid or expired token" }]
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied",
  "details": [{ "field": "obligation", "message": "This obligation belongs to another player" }]
}
```

### 404 Not Found
```json
{
  "error": "Obligation not found",
  "details": [{ "field": "obligationId", "message": "Obligation does not exist" }]
}
```

### 409 Conflict
```json
{
  "error": "Already paid",
  "details": [{ "field": "status", "message": "This obligation is already marked as paid" }]
}
```

---

## Payment Status Flow

```
PENDING → MARKED_PAID → VERIFIED
                    ↘ REJECTED → MARKED_PAID (resubmit)
```

| Status | Description |
|--------|-------------|
| `PENDING` | Awaiting payment |
| `MARKED_PAID` | Player marked paid, awaiting host verification |
| `VERIFIED` | Host approved payment |
| `REJECTED` | Host rejected proof, can resubmit |

---

## Payment Methods

| Method | Description |
|--------|-------------|
| `CASH` | Cash payment to host |
| `TRANSFER` | Bank transfer |
| `EWALLET` | GoPay, OVO, DANA, ShopeePay, etc. |
| `OTHER` | Other payment method |

---

## Implementation Notes

### Magic Link Access
- Magic links provide temporary read/write access
- Token expires after 24 hours
- Single-use: marked as used after first verification
- Scoped to specific player permissions

### Privacy
- Players can only view/modify their own obligations
- Face embeddings can be deleted on request (GDPR)
- Contact info (phone/email) only visible to connected hosts
