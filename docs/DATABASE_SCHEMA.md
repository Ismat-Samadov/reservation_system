# Database Schema Design

## Entity Relationship Diagram

```
┌─────────────────┐
│    Provider     │
│─────────────────│
│ id (PK)         │
│ username (UK)   │──┐
│ email (UK)      │  │
│ password_hash   │  │
│ full_name       │  │
│ timezone        │  │
│ created_at      │  │
│ updated_at      │  │
└─────────────────┘  │
                      │
         ┌────────────┴───────────────────────────────┐
         │                                            │
         ↓                                            ↓
┌─────────────────┐                          ┌─────────────────┐
│    Service      │                          │  Availability   │
│─────────────────│                          │─────────────────│
│ id (PK)         │                          │ id (PK)         │
│ provider_id (FK)│                          │ provider_id (FK)│
│ name            │                          │ day_of_week     │
│ duration_mins   │                          │ start_time      │
│ description     │                          │ end_time        │
│ price           │                          │ is_available    │
│ is_active       │                          │ created_at      │
│ created_at      │                          └─────────────────┘
│ updated_at      │
└─────────────────┘                          ┌─────────────────┐
         │                                    │  BlockedPeriod  │
         │                                    │─────────────────│
         │                                    │ id (PK)         │
         │                                    │ provider_id (FK)│
         │                                    │ start_datetime  │
         │                                    │ end_datetime    │
         │                                    │ reason          │
         │                                    │ created_at      │
         │                                    └─────────────────┘
         │
         ↓
┌─────────────────┐
│    Booking      │
│─────────────────│
│ id (PK)         │
│ provider_id (FK)│
│ service_id (FK) │
│ customer_name   │
│ customer_email  │
│ customer_phone  │
│ start_time (UTC)│←─── UNIQUE CONSTRAINT
│ end_time (UTC)  │←─── (provider_id, start_time, end_time)
│ status          │
│ notes           │
│ version         │     (for optimistic locking)
│ created_at      │
│ updated_at      │
└─────────────────┘
```

## Table Definitions (PostgreSQL)

### 1. Provider Table
```sql
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    description TEXT,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_providers_username ON providers(username);
CREATE INDEX idx_providers_email ON providers(email);
```

### 2. Service Table
```sql
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    buffer_time_minutes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_provider ON services(provider_id);
CREATE INDEX idx_services_active ON services(provider_id, is_active);
```

### 3. Availability Table (Weekly Schedule)
```sql
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT check_time_order CHECK (end_time > start_time),
    UNIQUE (provider_id, day_of_week, start_time, end_time)
);

CREATE INDEX idx_availability_provider_day ON availability(provider_id, day_of_week);
```

### 4. Blocked Periods Table (Vacations, Breaks, etc.)
```sql
CREATE TABLE blocked_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(255),
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT check_datetime_order CHECK (end_datetime > start_datetime)
);

CREATE INDEX idx_blocked_provider_date ON blocked_periods(provider_id, start_datetime, end_datetime);
```

### 5. Bookings Table (CRITICAL - Concurrency Safe)
```sql
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,

    -- Customer details (no registration required)
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_timezone VARCHAR(50) DEFAULT 'UTC',

    -- Booking time (ALWAYS stored in UTC)
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Booking metadata
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    cancellation_reason TEXT,

    -- Optimistic locking for concurrency control
    version INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT check_booking_time_order CHECK (end_time > start_time),
    CONSTRAINT check_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'))
);

-- CRITICAL: Prevent double-booking with unique constraint
CREATE UNIQUE INDEX idx_bookings_no_overlap ON bookings(provider_id, start_time)
    WHERE status NOT IN ('cancelled');

-- Additional index for time range queries
CREATE INDEX idx_bookings_provider_time ON bookings(provider_id, start_time, end_time)
    WHERE status NOT IN ('cancelled');

-- Customer lookup
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);

-- Status queries
CREATE INDEX idx_bookings_status ON bookings(provider_id, status);
```

### 6. Booking Confirmation Tokens (Optional - for email verification)
```sql
CREATE TABLE booking_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'confirm', 'cancel', 'reschedule'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tokens_booking ON booking_tokens(booking_id);
CREATE INDEX idx_tokens_token ON booking_tokens(token);
```

## Concurrency Control Strategy

### Approach 1: Row-Level Locking (Recommended)
```sql
-- In booking creation transaction
BEGIN;

-- Lock the provider's bookings for the time period
SELECT id FROM bookings
WHERE provider_id = $1
  AND start_time < $3  -- end_time of new booking
  AND end_time > $2    -- start_time of new booking
  AND status NOT IN ('cancelled')
FOR UPDATE;

-- If any rows returned, slot is taken
-- If no rows, create the booking
INSERT INTO bookings (provider_id, service_id, start_time, end_time, ...)
VALUES ($1, $2, $3, $4, ...);

COMMIT;
```

### Approach 2: Unique Constraint (Simpler, less flexible)
```sql
-- The unique index prevents overlapping bookings
-- Just try to insert, catch constraint violation error
INSERT INTO bookings (...)
VALUES (...);
-- If successful, booking created
-- If duplicate key error, slot already taken
```

### Approach 3: Optimistic Locking (Version Field)
```sql
-- When updating a booking
UPDATE bookings
SET status = $1,
    version = version + 1,
    updated_at = NOW()
WHERE id = $2
  AND version = $3;  -- Check version matches

-- If affected rows = 0, conflict detected, retry
```

## Prisma Schema Equivalent

```prisma
model Provider {
  id            String   @id @default(uuid())
  username      String   @unique
  email         String   @unique
  passwordHash  String   @map("password_hash")
  fullName      String   @map("full_name")
  businessName  String?  @map("business_name")
  description   String?
  timezone      String   @default("UTC")
  avatarUrl     String?  @map("avatar_url")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  services        Service[]
  availability    Availability[]
  blockedPeriods  BlockedPeriod[]
  bookings        Booking[]

  @@map("providers")
}

model Service {
  id               String   @id @default(uuid())
  providerId       String   @map("provider_id")
  name             String
  description      String?
  durationMinutes  Int      @map("duration_minutes")
  price            Decimal? @db.Decimal(10, 2)
  currency         String   @default("USD")
  bufferTimeMinutes Int     @default(0) @map("buffer_time_minutes")
  isActive         Boolean  @default(true) @map("is_active")
  displayOrder     Int      @default(0) @map("display_order")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  provider Provider  @relation(fields: [providerId], references: [id], onDelete: Cascade)
  bookings Booking[]

  @@index([providerId])
  @@index([providerId, isActive])
  @@map("services")
}

model Availability {
  id           String   @id @default(uuid())
  providerId   String   @map("provider_id")
  dayOfWeek    Int      @map("day_of_week")
  startTime    String   @map("start_time") @db.Time
  endTime      String   @map("end_time") @db.Time
  isAvailable  Boolean  @default(true) @map("is_available")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  provider Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@unique([providerId, dayOfWeek, startTime, endTime])
  @@index([providerId, dayOfWeek])
  @@map("availability")
}

model BlockedPeriod {
  id            String   @id @default(uuid())
  providerId    String   @map("provider_id")
  startDatetime DateTime @map("start_datetime")
  endDatetime   DateTime @map("end_datetime")
  reason        String?
  isRecurring   Boolean  @default(false) @map("is_recurring")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  provider Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@index([providerId, startDatetime, endDatetime])
  @@map("blocked_periods")
}

model Booking {
  id               String    @id @default(uuid())
  providerId       String    @map("provider_id")
  serviceId        String    @map("service_id")
  customerName     String    @map("customer_name")
  customerEmail    String    @map("customer_email")
  customerPhone    String?   @map("customer_phone")
  customerTimezone String    @default("UTC") @map("customer_timezone")
  startTime        DateTime  @map("start_time")
  endTime          DateTime  @map("end_time")
  status           String    @default("pending")
  notes            String?
  cancellationReason String? @map("cancellation_reason")
  version          Int       @default(1)
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  confirmedAt      DateTime? @map("confirmed_at")
  cancelledAt      DateTime? @map("cancelled_at")

  provider Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  service  Service  @relation(fields: [serviceId], references: [id], onDelete: Restrict)

  @@unique([providerId, startTime], name: "no_double_booking")
  @@index([providerId, startTime, endTime])
  @@index([customerEmail])
  @@index([providerId, status])
  @@map("bookings")
}
```

## Sample Queries

### Get Available Slots for a Day
```sql
-- 1. Get provider's availability for that day of week
SELECT start_time, end_time FROM availability
WHERE provider_id = $1 AND day_of_week = $2 AND is_available = true;

-- 2. Get existing bookings for that specific date
SELECT start_time, end_time FROM bookings
WHERE provider_id = $1
  AND DATE(start_time AT TIME ZONE $timezone) = $date
  AND status NOT IN ('cancelled');

-- 3. Get blocked periods for that date
SELECT start_datetime, end_datetime FROM blocked_periods
WHERE provider_id = $1
  AND start_datetime::date <= $date
  AND end_datetime::date >= $date;

-- Application generates all possible slots and filters out unavailable ones
```

### Create Booking (Atomic)
```sql
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Check for conflicts with locking
SELECT id FROM bookings
WHERE provider_id = $1
  AND start_time < $end_time
  AND end_time > $start_time
  AND status NOT IN ('cancelled')
FOR UPDATE;

-- If no conflicts, insert
INSERT INTO bookings (
  provider_id, service_id, customer_name, customer_email,
  start_time, end_time, status
) VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')
RETURNING id;

COMMIT;
```

## Performance Optimization

1. **Partitioning**: Partition bookings table by date range (monthly/yearly) for large datasets
2. **Archiving**: Move completed bookings older than 6 months to archive table
3. **Materialized Views**: Pre-compute popular availability patterns
4. **Caching**: Cache provider availability rules in Redis
5. **Connection Pooling**: Use PgBouncer or Prisma connection pool

## Data Retention & GDPR

- Customer data retention policy (e.g., 2 years)
- Soft delete for compliance (add deleted_at column)
- Data export API for GDPR requests
- Anonymization of old booking data
