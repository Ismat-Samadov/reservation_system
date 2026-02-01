# Reservation System Architecture

## System Overview

Multi-tenant SaaS booking platform where service providers can manage availability and customers can book time slots.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  - Public Booking Pages (/book/[username])                  │
│  - Provider Dashboard (/dashboard)                          │
│  - Authentication Pages                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Next.js API Routes / Server Actions             │
│  - Authentication (NextAuth.js)                             │
│  - Booking API (with transactions & locking)                │
│  - Availability API                                         │
│  - Provider Management API                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (Prisma)                   │
│  - Connection Pooling                                       │
│  - Query Builder                                            │
│  - Migrations                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database (Supabase/Neon)           │
│  - Row-Level Security                                       │
│  - Unique Constraints                                       │
│  - Indexed Queries                                          │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Multi-Tenancy Model
- **Approach**: Shared database, row-level isolation
- Each provider has unique username (tenant identifier)
- All queries filtered by provider_id
- Ensures complete data isolation between providers

### 2. Authentication & Authorization
- **Provider Auth**: NextAuth.js with credentials/OAuth
- **Customer Auth**: Optional (anonymous booking allowed)
- **Session Management**: JWT tokens
- **Authorization**: Middleware checks for provider dashboard access

### 3. Booking Concurrency Strategy
- **Transaction Isolation**: SERIALIZABLE or REPEATABLE READ
- **Row-Level Locking**: SELECT FOR UPDATE on time slot checks
- **Unique Constraints**: (provider_id, start_time, end_time)
- **Optimistic Locking**: Version field for conflict detection

### 4. Time Slot Generation
```
Algorithm:
1. Fetch provider working hours for selected date
2. Fetch existing bookings for that date
3. Fetch blocked periods (breaks, unavailable times)
4. Generate all possible slots based on service duration
5. Filter out unavailable slots
6. Return only available slots to customer
```

### 5. Time Zone Handling
- Store all times in UTC in database
- Convert to provider's timezone for display
- Allow customers to view in their own timezone
- Use date-fns-tz or luxon for conversions

## Data Flow Examples

### Booking Creation Flow
```
Customer selects slot → API receives request
  ↓
Start DB transaction
  ↓
Lock relevant rows (SELECT FOR UPDATE)
  ↓
Check slot still available
  ↓
Create booking record
  ↓
Commit transaction
  ↓
Send confirmation email
  ↓
Return success response
```

### Availability Fetch Flow
```
Customer views calendar → API receives date range
  ↓
Fetch provider working hours
  ↓
Fetch existing bookings
  ↓
Fetch blocked periods
  ↓
Generate all possible slots
  ↓
Filter unavailable slots
  ↓
Return available slots (in customer timezone)
```

## Scalability Considerations

### Database
- Connection pooling (max 20-50 connections per instance)
- Indexed on: provider_id, start_time, status
- Composite index on (provider_id, start_time, end_time)
- Partitioning by date for large datasets (future)

### Caching
- Cache provider availability rules (Redis/Vercel KV)
- Short TTL for availability queries (30-60s)
- Invalidate on booking creation

### Performance
- Server-side rendering for public booking pages (SEO)
- Client-side rendering for provider dashboard
- API route caching where appropriate
- Edge functions for static content

## Security Measures

1. **Authentication**: Secure password hashing (bcrypt)
2. **Authorization**: Middleware guards on all provider routes
3. **Input Validation**: Zod schemas for all API inputs
4. **SQL Injection**: Prevented via Prisma ORM
5. **Rate Limiting**: Prevent booking spam (Vercel rate limits)
6. **CSRF Protection**: NextAuth.js built-in protection
7. **Data Privacy**: GDPR-compliant (data export, deletion)

## Deployment Architecture (Vercel)

```
Vercel Edge Network
  ↓
Next.js App (Serverless Functions)
  ↓
PostgreSQL Database (Supabase/Neon/Railway)
  ↓
Email Service (Resend/SendGrid)
  ↓
(Optional) File Storage: Cloudflare R2
```

### Environment Variables
- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- EMAIL_SERVER_HOST
- EMAIL_FROM
- R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY

## Future Enhancements

1. **Payment Integration**: Stripe for paid bookings
2. **Calendar Sync**: Google Calendar, Outlook, iCal
3. **SMS Notifications**: Twilio integration
4. **Advanced Analytics**: Booking metrics dashboard
5. **Multi-language Support**: i18n
6. **Mobile App**: React Native
7. **Recurring Bookings**: Weekly/monthly appointments
8. **Waiting List**: Auto-book when slots become available
9. **Review System**: Customer feedback
10. **Team Booking**: Multiple providers under one business
