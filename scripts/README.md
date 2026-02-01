# Scripts

This directory contains utility scripts for the reservation system.

## Available Scripts

### `seed.ts`
Seeds the database with test data including:
- Sample provider (John's Barbershop)
- Services (Haircut, Haircut & Beard Trim, Beard Trim)
- Weekly availability schedule
- Sample booking
- Blocked period (vacation)

**Usage:**
```bash
npm run db:seed
```

**Test Credentials:**
- Username: `johndoe`
- Email: `john@example.com`
- Password: `password123`

## Adding New Scripts

Create new scripts in this directory for:
- Database migrations
- Data imports/exports
- Cleanup operations
- Batch operations
- Analytics generation

Example script template:
```typescript
import { prisma } from '../lib/prisma'

async function main() {
  // Your script logic here
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Run with:
```bash
npx tsx scripts/your-script.ts
```
