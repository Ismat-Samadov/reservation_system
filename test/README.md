# Test Suite

This directory contains test scripts for the reservation system.

## Available Tests

### `test-booking.ts`
Tests the core booking system functionality:
- Time slot generation
- Booking creation
- Concurrency safety (double-booking prevention)
- Database operations

## Running Tests

```bash
# Run the booking test
npx tsx test/test-booking.ts
```

## Test Requirements

- PostgreSQL database must be running
- Database must be seeded with test data: `npm run db:seed`
- Environment variables configured in `.env`

## Adding New Tests

Create new test files in this directory following the pattern:
1. Import required modules
2. Set up test data
3. Run assertions
4. Clean up test data
5. Disconnect from database

Example:
```typescript
import { prisma } from '../lib/prisma'

async function test() {
  // Your test logic here
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```
