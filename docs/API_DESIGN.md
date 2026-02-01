# API Design & Endpoints

## API Architecture

- **Framework**: Next.js API Routes + Server Actions
- **Authentication**: NextAuth.js (JWT sessions)
- **Validation**: Zod schemas
- **Error Handling**: Standardized error responses
- **Rate Limiting**: Vercel built-in (or custom middleware)

## Base URL
```
Production: https://yourapp.vercel.app/api
Development: http://localhost:3000/api
```

---

## 1. Authentication Endpoints

### POST `/api/auth/signup`
Register a new provider account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "timezone": "America/New_York"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john@example.com",
    "fullName": "John Doe"
  }
}
```

**Errors:**
- 400: Validation error (username taken, weak password, etc.)
- 409: Email or username already exists

### POST `/api/auth/signin`
Sign in (handled by NextAuth.js)

### POST `/api/auth/signout`
Sign out (handled by NextAuth.js)

---

## 2. Provider Management Endpoints

### GET `/api/provider/profile`
Get current provider's profile (authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "businessName": "John's Barbershop",
  "timezone": "America/New_York",
  "avatarUrl": "https://...",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### PUT `/api/provider/profile`
Update provider profile (authenticated).

**Request Body:**
```json
{
  "fullName": "John Doe Jr.",
  "businessName": "Premium Cuts",
  "description": "Professional barber with 10 years experience",
  "timezone": "America/Los_Angeles"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* updated profile */ }
}
```

---

## 3. Service Management Endpoints

### GET `/api/provider/services`
Get all services for authenticated provider.

**Response (200 OK):**
```json
{
  "services": [
    {
      "id": "uuid",
      "name": "Haircut",
      "description": "Classic men's haircut",
      "durationMinutes": 30,
      "price": 25.00,
      "currency": "USD",
      "bufferTimeMinutes": 5,
      "isActive": true
    }
  ]
}
```

### POST `/api/provider/services`
Create a new service (authenticated).

**Request Body:**
```json
{
  "name": "Haircut & Beard Trim",
  "description": "Full service haircut with beard styling",
  "durationMinutes": 45,
  "price": 35.00,
  "bufferTimeMinutes": 10
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Haircut & Beard Trim",
    "durationMinutes": 45,
    "price": 35.00
  }
}
```

### PUT `/api/provider/services/:id`
Update a service.

### DELETE `/api/provider/services/:id`
Delete/deactivate a service.

---

## 4. Availability Management Endpoints

### GET `/api/provider/availability`
Get weekly availability schedule (authenticated).

**Response (200 OK):**
```json
{
  "availability": [
    {
      "id": "uuid",
      "dayOfWeek": 1,  // Monday
      "startTime": "09:00",
      "endTime": "17:00",
      "isAvailable": true
    },
    {
      "dayOfWeek": 2,  // Tuesday
      "startTime": "09:00",
      "endTime": "17:00",
      "isAvailable": true
    }
  ]
}
```

### POST `/api/provider/availability`
Set availability for a day (authenticated).

**Request Body:**
```json
{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00",
  "isAvailable": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": { /* created availability */ }
}
```

### PUT `/api/provider/availability/:id`
Update availability slot.

### DELETE `/api/provider/availability/:id`
Remove availability slot.

---

## 5. Blocked Periods Endpoints

### GET `/api/provider/blocked-periods`
Get all blocked periods (authenticated).

**Query Parameters:**
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date

**Response (200 OK):**
```json
{
  "blockedPeriods": [
    {
      "id": "uuid",
      "startDatetime": "2024-12-24T00:00:00Z",
      "endDatetime": "2024-12-26T23:59:59Z",
      "reason": "Christmas vacation"
    }
  ]
}
```

### POST `/api/provider/blocked-periods`
Create a blocked period (vacation, break, etc.) - authenticated.

**Request Body:**
```json
{
  "startDatetime": "2024-12-24T00:00:00Z",
  "endDatetime": "2024-12-26T23:59:59Z",
  "reason": "Holiday break"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": { /* created blocked period */ }
}
```

### DELETE `/api/provider/blocked-periods/:id`
Remove a blocked period.

---

## 6. Public Booking Endpoints (No Auth Required)

### GET `/api/public/:username`
Get provider's public profile by username.

**Path Parameters:**
- `username`: Provider's unique username

**Response (200 OK):**
```json
{
  "provider": {
    "username": "johndoe",
    "fullName": "John Doe",
    "businessName": "John's Barbershop",
    "description": "...",
    "timezone": "America/New_York",
    "avatarUrl": "https://..."
  },
  "services": [
    {
      "id": "uuid",
      "name": "Haircut",
      "description": "...",
      "durationMinutes": 30,
      "price": 25.00
    }
  ]
}
```

**Errors:**
- 404: Provider not found

### GET `/api/public/:username/availability`
Get available time slots for booking.

**Path Parameters:**
- `username`: Provider's unique username

**Query Parameters:**
- `date`: Date in YYYY-MM-DD format (required)
- `serviceId`: Service UUID (required)
- `timezone`: Customer's timezone (optional, default UTC)

**Example Request:**
```
GET /api/public/johndoe/availability?date=2024-02-15&serviceId=uuid&timezone=America/Chicago
```

**Response (200 OK):**
```json
{
  "date": "2024-02-15",
  "timezone": "America/Chicago",
  "slots": [
    {
      "startTime": "2024-02-15T09:00:00-06:00",
      "endTime": "2024-02-15T09:30:00-06:00",
      "available": true
    },
    {
      "startTime": "2024-02-15T09:30:00-06:00",
      "endTime": "2024-02-15T10:00:00-06:00",
      "available": true
    },
    {
      "startTime": "2024-02-15T10:00:00-06:00",
      "endTime": "2024-02-15T10:30:00-06:00",
      "available": false
    }
  ]
}
```

**Errors:**
- 404: Provider or service not found
- 400: Invalid date or missing parameters

### POST `/api/public/:username/bookings`
Create a new booking (public - no auth required).

**Path Parameters:**
- `username`: Provider's unique username

**Request Body:**
```json
{
  "serviceId": "uuid",
  "startTime": "2024-02-15T09:00:00Z",
  "endTime": "2024-02-15T09:30:00Z",
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "customerPhone": "+1234567890",
  "customerTimezone": "America/Chicago",
  "notes": "First time customer"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "confirmationCode": "ABC123",
    "status": "confirmed",
    "startTime": "2024-02-15T09:00:00Z",
    "endTime": "2024-02-15T09:30:00Z",
    "service": {
      "name": "Haircut",
      "durationMinutes": 30
    },
    "provider": {
      "businessName": "John's Barbershop"
    }
  },
  "message": "Booking confirmed! Check your email for details."
}
```

**Errors:**
- 400: Invalid input (missing fields, invalid times)
- 409: Time slot no longer available (double-booking prevented)
- 404: Provider or service not found

---

## 7. Booking Management Endpoints (Provider)

### GET `/api/provider/bookings`
Get all bookings for authenticated provider.

**Query Parameters:**
- `status`: Filter by status (pending, confirmed, cancelled, completed)
- `startDate`: Filter from date
- `endDate`: Filter to date
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50)

**Response (200 OK):**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "customerName": "Jane Smith",
      "customerEmail": "jane@example.com",
      "customerPhone": "+1234567890",
      "startTime": "2024-02-15T15:00:00Z",
      "endTime": "2024-02-15T15:30:00Z",
      "status": "confirmed",
      "service": {
        "name": "Haircut",
        "price": 25.00
      },
      "createdAt": "2024-02-10T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  }
}
```

### GET `/api/provider/bookings/:id`
Get a specific booking details (authenticated).

**Response (200 OK):**
```json
{
  "id": "uuid",
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "customerPhone": "+1234567890",
  "startTime": "2024-02-15T15:00:00Z",
  "endTime": "2024-02-15T15:30:00Z",
  "status": "confirmed",
  "notes": "First time customer",
  "service": {
    "name": "Haircut",
    "durationMinutes": 30
  },
  "createdAt": "2024-02-10T10:00:00Z",
  "confirmedAt": "2024-02-10T10:05:00Z"
}
```

### PATCH `/api/provider/bookings/:id/status`
Update booking status (authenticated).

**Request Body:**
```json
{
  "status": "completed",
  "cancellationReason": "Customer no-show" // optional, required for cancelled status
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed"
  }
}
```

### DELETE `/api/provider/bookings/:id`
Cancel a booking (authenticated).

---

## 8. Customer Booking Management (Public)

### GET `/api/public/bookings/:id`
Get booking details by ID (with confirmation code).

**Query Parameters:**
- `email`: Customer email (for verification)

**Response (200 OK):**
```json
{
  "id": "uuid",
  "confirmationCode": "ABC123",
  "status": "confirmed",
  "startTime": "2024-02-15T09:00:00Z",
  "endTime": "2024-02-15T09:30:00Z",
  "customerName": "Jane Smith",
  "service": {
    "name": "Haircut"
  },
  "provider": {
    "businessName": "John's Barbershop",
    "fullName": "John Doe"
  }
}
```

### DELETE `/api/public/bookings/:id/cancel`
Cancel a booking (customer-initiated).

**Request Body:**
```json
{
  "email": "jane@example.com",
  "reason": "Schedule conflict"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully"
}
```

---

## 9. Webhook/Notification Endpoints (Optional)

### POST `/api/webhooks/booking-confirmed`
Trigger email notification when booking is confirmed.

### POST `/api/webhooks/booking-reminder`
Send reminder 24 hours before appointment.

---

## Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "This time slot is no longer available",
    "details": {
      "field": "startTime",
      "reason": "Already booked"
    }
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `SLOT_UNAVAILABLE`: Time slot already booked
- `PROVIDER_NOT_FOUND`: Provider username invalid
- `SERVICE_NOT_FOUND`: Service ID invalid
- `RATE_LIMIT_EXCEEDED`: Too many requests

---

## Rate Limiting

- **Public endpoints**: 100 requests per 15 minutes per IP
- **Authenticated endpoints**: 1000 requests per 15 minutes per user
- **Booking creation**: 10 requests per 15 minutes per IP

---

## Caching Strategy

### Cache Headers
```
Cache-Control: public, s-maxage=60, stale-while-revalidate=120
```

### Cached Endpoints
- `GET /api/public/:username` - 5 minutes
- `GET /api/public/:username/availability` - 30 seconds
- Provider profile (authenticated) - 1 minute

### No Cache
- Booking creation (always fresh)
- Booking status changes (always fresh)

---

## Server Actions (Next.js 14+)

Alternative to API routes, using Next.js Server Actions:

```typescript
// app/actions/booking.ts
'use server'

export async function createBooking(formData: FormData) {
  const data = {
    serviceId: formData.get('serviceId'),
    startTime: formData.get('startTime'),
    // ...
  }

  // Validation with Zod
  const validated = bookingSchema.parse(data)

  // Create booking with transaction
  const booking = await createBookingTransaction(validated)

  return { success: true, booking }
}
```

This can simplify client-side code and improve type safety.
