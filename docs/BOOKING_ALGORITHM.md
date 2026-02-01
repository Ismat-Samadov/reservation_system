# Concurrency-Safe Booking Algorithm

## Problem Statement

When multiple customers try to book the same time slot simultaneously, we must ensure:
1. Only ONE booking succeeds
2. No double-booking occurs
3. No race conditions
4. Fast response time (<200ms)
5. Fair allocation (first-come-first-served)

## Race Condition Scenario

```
Time    Customer A              Customer B              Database
----    ----------              ----------              --------
10:00   Check slot available    -                       Slot: FREE
10:01   -                       Check slot available    Slot: FREE
10:02   Book slot              -                       Slot: BOOKED by A
10:03   -                       Book slot              Slot: BOOKED by B (ERROR!)
```

This MUST NOT happen. We need atomic operations.

---

## Solution 1: Database Row-Level Locking (Recommended)

### Strategy
Use PostgreSQL's `SELECT FOR UPDATE` to lock rows during transaction.

### Implementation

```typescript
// lib/booking.ts
import { prisma } from '@/lib/prisma'

export async function createBookingWithLocking(data: BookingData) {
  return await prisma.$transaction(async (tx) => {
    // Step 1: Lock all potentially conflicting bookings
    const conflictingBookings = await tx.$queryRaw`
      SELECT id FROM bookings
      WHERE provider_id = ${data.providerId}
        AND start_time < ${data.endTime}
        AND end_time > ${data.startTime}
        AND status NOT IN ('cancelled')
      FOR UPDATE
    `

    // Step 2: If any rows were locked, slot is taken
    if (conflictingBookings.length > 0) {
      throw new Error('SLOT_UNAVAILABLE')
    }

    // Step 3: Slot is free, create booking
    const booking = await tx.booking.create({
      data: {
        providerId: data.providerId,
        serviceId: data.serviceId,
        startTime: data.startTime,
        endTime: data.endTime,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        status: 'confirmed',
      },
    })

    return booking
  }, {
    isolationLevel: 'Serializable', // Strongest isolation
    maxWait: 5000, // Wait up to 5s for lock
    timeout: 10000, // Transaction timeout 10s
  })
}
```

### How It Works
1. Transaction starts
2. `SELECT FOR UPDATE` locks rows that overlap with requested time
3. If rows exist → conflict → abort
4. If no rows → safe to insert → create booking
5. Transaction commits, releasing locks

### Pros
- **Guaranteed consistency**: No double-booking possible
- **Works with Prisma**: Easy to implement
- **Fair**: First transaction to lock wins

### Cons
- Slight performance overhead (locking)
- Can cause waiting if high concurrency (but this is acceptable)

---

## Solution 2: Unique Constraint (Simpler, Less Flexible)

### Strategy
Let the database enforce uniqueness via constraint violation.

### Database Constraint
```sql
CREATE UNIQUE INDEX idx_bookings_no_overlap
ON bookings(provider_id, start_time)
WHERE status NOT IN ('cancelled');
```

### Implementation
```typescript
export async function createBookingWithConstraint(data: BookingData) {
  try {
    const booking = await prisma.booking.create({
      data: {
        providerId: data.providerId,
        serviceId: data.serviceId,
        startTime: data.startTime,
        endTime: data.endTime,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        status: 'confirmed',
      },
    })
    return { success: true, booking }
  } catch (error) {
    if (error.code === 'P2002') { // Unique constraint violation
      throw new Error('SLOT_UNAVAILABLE')
    }
    throw error
  }
}
```

### Pros
- **Very simple**: Just try to insert, catch error
- **Fast**: No locking overhead
- **Bulletproof**: Database enforces uniqueness

### Cons
- Limited to exact start time matches
- Cannot handle complex overlap scenarios easily
- Requires careful index design

---

## Solution 3: Optimistic Locking with Version Field

### Strategy
Use a version counter to detect conflicts.

### Implementation
```typescript
export async function createBookingOptimistic(data: BookingData) {
  const maxRetries = 3
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      // Check for conflicts
      const conflicts = await prisma.booking.findMany({
        where: {
          providerId: data.providerId,
          startTime: { lt: data.endTime },
          endTime: { gt: data.startTime },
          status: { notIn: ['cancelled'] },
        },
      })

      if (conflicts.length > 0) {
        throw new Error('SLOT_UNAVAILABLE')
      }

      // Attempt to create with version = 1
      const booking = await prisma.booking.create({
        data: {
          ...data,
          version: 1,
        },
      })

      return { success: true, booking }
    } catch (error) {
      if (error.code === 'P2002') { // Conflict detected
        attempt++
        await new Promise(resolve => setTimeout(resolve, 100 * attempt)) // Exponential backoff
        continue
      }
      throw error
    }
  }

  throw new Error('BOOKING_FAILED_AFTER_RETRIES')
}
```

### Pros
- No database locking
- Good for high read, low write scenarios

### Cons
- Requires retry logic
- Can fail after multiple attempts
- More complex code

---

## Recommended Approach: Hybrid

**Combine Solution 1 (row-level locking) with unique constraint as safety net.**

```typescript
export async function createBookingSafe(data: BookingData) {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock potentially conflicting rows
    const conflicts = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM bookings
      WHERE provider_id = ${data.providerId}::uuid
        AND start_time < ${data.endTime}::timestamp
        AND end_time > ${data.startTime}::timestamp
        AND status NOT IN ('cancelled')
      FOR UPDATE NOWAIT
    `

    if (conflicts.length > 0) {
      throw new BookingError('SLOT_UNAVAILABLE', 'This time slot is already booked')
    }

    // 2. Create booking (unique constraint as backup)
    const booking = await tx.booking.create({
      data: {
        providerId: data.providerId,
        serviceId: data.serviceId,
        startTime: data.startTime,
        endTime: data.endTime,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerTimezone: data.customerTimezone || 'UTC',
        status: 'confirmed',
        version: 1,
      },
      include: {
        service: true,
        provider: {
          select: {
            fullName: true,
            businessName: true,
            email: true,
          },
        },
      },
    })

    return booking
  }, {
    isolationLevel: 'Serializable',
    maxWait: 3000,
    timeout: 10000,
  })
}

class BookingError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = 'BookingError'
  }
}
```

---

## Time Slot Generation Algorithm

### Goal
Generate all available time slots for a given date and service.

### Algorithm Steps

```typescript
import { addMinutes, format, parse, isWithinInterval } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

interface AvailableSlot {
  startTime: Date
  endTime: Date
  available: boolean
}

export async function getAvailableSlots(
  providerId: string,
  serviceId: string,
  date: string, // YYYY-MM-DD
  customerTimezone: string = 'UTC'
): Promise<AvailableSlot[]> {
  // 1. Get provider and service details
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { timezone: true },
  })

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { durationMinutes: true, bufferTimeMinutes: true },
  })

  if (!provider || !service) {
    throw new Error('Provider or service not found')
  }

  const slotDuration = service.durationMinutes + service.bufferTimeMinutes

  // 2. Get day of week (0=Sunday, 6=Saturday)
  const targetDate = parse(date, 'yyyy-MM-dd', new Date())
  const dayOfWeek = targetDate.getDay()

  // 3. Get provider's availability for this day
  const availability = await prisma.availability.findMany({
    where: {
      providerId,
      dayOfWeek,
      isAvailable: true,
    },
  })

  if (availability.length === 0) {
    return [] // Provider not available on this day
  }

  // 4. Get existing bookings for this date
  const startOfDay = zonedTimeToUtc(
    new Date(`${date}T00:00:00`),
    provider.timezone
  )
  const endOfDay = zonedTimeToUtc(
    new Date(`${date}T23:59:59`),
    provider.timezone
  )

  const bookings = await prisma.booking.findMany({
    where: {
      providerId,
      startTime: { gte: startOfDay, lt: endOfDay },
      status: { notIn: ['cancelled'] },
    },
    select: { startTime: true, endTime: true },
  })

  // 5. Get blocked periods for this date
  const blockedPeriods = await prisma.blockedPeriod.findMany({
    where: {
      providerId,
      startDatetime: { lte: endOfDay },
      endDatetime: { gte: startOfDay },
    },
  })

  // 6. Generate all possible time slots
  const slots: AvailableSlot[] = []

  for (const avail of availability) {
    const [startHour, startMin] = avail.startTime.split(':').map(Number)
    const [endHour, endMin] = avail.endTime.split(':').map(Number)

    let currentSlotStart = zonedTimeToUtc(
      new Date(`${date}T${avail.startTime}`),
      provider.timezone
    )

    const dayEnd = zonedTimeToUtc(
      new Date(`${date}T${avail.endTime}`),
      provider.timezone
    )

    while (currentSlotStart < dayEnd) {
      const currentSlotEnd = addMinutes(currentSlotStart, slotDuration)

      // Check if slot end exceeds day end
      if (currentSlotEnd > dayEnd) break

      // Check if slot conflicts with existing bookings
      const isBooked = bookings.some(booking =>
        (currentSlotStart < booking.endTime && currentSlotEnd > booking.startTime)
      )

      // Check if slot conflicts with blocked periods
      const isBlocked = blockedPeriods.some(blocked =>
        (currentSlotStart < blocked.endDatetime && currentSlotEnd > blocked.startDatetime)
      )

      slots.push({
        startTime: utcToZonedTime(currentSlotStart, customerTimezone),
        endTime: utcToZonedTime(currentSlotEnd, customerTimezone),
        available: !isBooked && !isBlocked,
      })

      // Move to next slot
      currentSlotStart = currentSlotEnd
    }
  }

  return slots
}
```

### Time Zone Handling

```typescript
// Customer in Chicago books with John (in New York)
// Customer sees: 2024-02-15 09:00 AM CST
// Stored in DB: 2024-02-15 15:00:00 UTC
// Provider sees: 2024-02-15 10:00 AM EST

// Always:
// 1. Store in UTC
// 2. Convert to provider timezone for availability checks
// 3. Display in customer timezone for booking
```

---

## Performance Optimizations

### 1. Caching Availability
```typescript
import { redis } from '@/lib/redis'

const cacheKey = `availability:${providerId}:${date}`
const cached = await redis.get(cacheKey)

if (cached) {
  return JSON.parse(cached)
}

const slots = await getAvailableSlots(...)
await redis.set(cacheKey, JSON.stringify(slots), 'EX', 30) // 30s TTL
return slots
```

### 2. Batch Queries
Fetch provider, service, availability, bookings, blocked periods in parallel:

```typescript
const [provider, service, availability, bookings, blockedPeriods] = await Promise.all([
  prisma.provider.findUnique(...),
  prisma.service.findUnique(...),
  prisma.availability.findMany(...),
  prisma.booking.findMany(...),
  prisma.blockedPeriod.findMany(...),
])
```

### 3. Database Indexing
Ensure these indexes exist:
- `bookings(provider_id, start_time, end_time)`
- `availability(provider_id, day_of_week)`
- `blocked_periods(provider_id, start_datetime, end_datetime)`

---

## Testing Concurrency

### Load Test Script
```typescript
// test/concurrency.test.ts
import { createBookingSafe } from '@/lib/booking'

describe('Concurrent booking test', () => {
  it('should prevent double-booking under high concurrency', async () => {
    const bookingData = {
      providerId: 'provider-1',
      serviceId: 'service-1',
      startTime: new Date('2024-02-15T15:00:00Z'),
      endTime: new Date('2024-02-15T15:30:00Z'),
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
    }

    // Simulate 100 simultaneous booking attempts
    const promises = Array.from({ length: 100 }, (_, i) =>
      createBookingSafe({
        ...bookingData,
        customerEmail: `customer${i}@example.com`,
      }).catch(err => err)
    )

    const results = await Promise.all(promises)

    // Count successes
    const successes = results.filter(r => r.id).length
    const failures = results.filter(r => r instanceof Error).length

    expect(successes).toBe(1) // Only ONE should succeed
    expect(failures).toBe(99) // 99 should fail
  })
})
```

Run with:
```bash
npm run test:concurrency
```

---

## Summary

**Recommended Implementation:**
1. Use **row-level locking** with `SELECT FOR UPDATE`
2. Add **unique constraint** as backup safety net
3. Set **transaction isolation** to SERIALIZABLE
4. Implement **proper error handling** for slot conflicts
5. Add **retry logic** for deadlock scenarios (rare)
6. **Cache availability** with short TTL (30-60s)
7. Use **timezone-aware** date handling throughout

This approach guarantees **zero double-bookings** while maintaining excellent performance.
