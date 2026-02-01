# Multi-Tenant Reservation System

A production-ready booking platform similar to Calendly, built with Next.js 16, PostgreSQL, and Prisma. Supports service providers (barbers, consultants, tutors, etc.) managing their availability and customers booking time slots.

## Features

- **Multi-Tenant Architecture**: Each service provider has their own account and public booking page
- **Concurrency-Safe Booking**: Row-level locking prevents double-booking under high load
- **Time Zone Support**: Handles providers and customers in different time zones
- **Flexible Availability**: Weekly schedules + blocked periods (vacations, breaks)
- **Multiple Services**: Providers can offer different services with varying durations
- **Public Booking Pages**: Each provider gets a shareable link (e.g., `/book/johndoe`)
- **Real-Time Availability**: Dynamic time slot generation based on existing bookings
- **Email Notifications**: Booking confirmations and reminders (ready for Resend integration)

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (ready to implement)
- **Email**: Resend (integration ready)
- **Hosting**: Vercel-ready
- **Storage**: Cloudflare R2 (optional, for avatars/files)

## Project Structure

```
reservation_system/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes (to be implemented)
│   ├── book/                 # Public booking pages
│   ├── dashboard/            # Provider dashboard
│   ├── auth/                 # Authentication pages
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/               # React components (to be built)
├── lib/                      # Core business logic
│   ├── prisma.ts             # Prisma client singleton
│   ├── booking.ts            # Booking logic with row-level locking
│   ├── availability.ts       # Time slot generation algorithm
│   └── utils.ts              # Utility functions
├── prisma/                   # Database schema
│   └── schema.prisma         # Prisma schema with all models
├── scripts/                  # Utility scripts
│   └── seed.ts               # Database seeding script
├── test/                     # Test files
│   └── test-booking.ts       # Booking system tests
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md       # System architecture overview
│   ├── DATABASE_SCHEMA.md    # Database design & SQL
│   ├── API_DESIGN.md         # API endpoints & contracts
│   ├── BOOKING_ALGORITHM.md  # Concurrency control & time slots
│   └── IMPLEMENTATION_GUIDE.md # Step-by-step implementation guide
├── public/                   # Static assets
├── .env.example              # Environment variables template
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud)
- Git

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd reservation_system
npm install
```

### 3. Set Up Database

Create a PostgreSQL database and copy the connection string:

```bash
cp .env.example .env
```

Edit `.env` and add your database URL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/reservation_db"
```

### 4. Run Migrations

```bash
npm run db:push
# or
npm run db:migrate
```

This will create all tables in your database based on the Prisma schema.

### 5. Generate Prisma Client

```bash
npm run db:generate
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Schema

The system uses 5 main tables:

1. **providers**: Service provider accounts (barbers, consultants, etc.)
2. **services**: Services offered by providers (haircut, consultation, etc.)
3. **availability**: Weekly schedules (e.g., Monday 9AM-5PM)
4. **blocked_periods**: Vacations, breaks, unavailable times
5. **bookings**: Customer appointments with concurrency safety

### Key Features:

- **Unique Constraint**: `(provider_id, start_time)` on bookings prevents double-booking
- **Row-Level Locking**: `SELECT FOR UPDATE` in transactions ensures race-condition safety
- **Time Zone Handling**: All times stored in UTC, converted for display
- **Soft Delete**: Bookings can be cancelled but preserved for history

See `docs/DATABASE_SCHEMA.md` for complete SQL schemas.

## Core Algorithms

### 1. Concurrency-Safe Booking (`lib/booking.ts`)

```typescript
// Prevents double-booking using row-level locking
await createBookingSafe({
  providerId: "uuid",
  serviceId: "uuid",
  startTime: new Date("2024-02-15T15:00:00Z"),
  endTime: new Date("2024-02-15T15:30:00Z"),
  customerName: "Jane Smith",
  customerEmail: "jane@example.com",
})
```

**How it works:**
1. Starts a serializable transaction
2. Locks conflicting booking rows with `FOR UPDATE NOWAIT`
3. If conflicts exist, throws `SLOT_UNAVAILABLE` error
4. If no conflicts, creates booking
5. Commits transaction

**Result:** Zero double-bookings, even with 100+ simultaneous requests.

### 2. Time Slot Generation (`lib/availability.ts`)

```typescript
// Get available slots for a date
const slots = await getAvailableSlots(
  providerId,
  serviceId,
  "2024-02-15", // date
  "America/Chicago" // customer timezone
)
```

**How it works:**
1. Fetches provider's weekly availability rules
2. Fetches existing bookings for the date
3. Fetches blocked periods (vacations, breaks)
4. Generates all possible slots based on service duration
5. Filters out booked, blocked, and past slots
6. Converts to customer's timezone for display

**Result:** Real-time availability that respects all constraints.

See `docs/BOOKING_ALGORITHM.md` for detailed explanations.

## API Endpoints (To Be Implemented)

The system is designed with these RESTful endpoints:

### Public (No Auth)
- `GET /api/public/:username` - Get provider's public profile
- `GET /api/public/:username/availability` - Get available time slots
- `POST /api/public/:username/bookings` - Create a booking
- `DELETE /api/public/bookings/:id/cancel` - Cancel a booking

### Provider (Authenticated)
- `GET /api/provider/profile` - Get provider profile
- `PUT /api/provider/profile` - Update profile
- `GET /api/provider/services` - List services
- `POST /api/provider/services` - Create service
- `GET /api/provider/availability` - Get weekly schedule
- `POST /api/provider/availability` - Set availability
- `POST /api/provider/blocked-periods` - Block time period
- `GET /api/provider/bookings` - List bookings with filters
- `PATCH /api/provider/bookings/:id/status` - Update booking status

See `docs/API_DESIGN.md` for complete API specifications.

## Environment Variables

Create a `.env` file with the following:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/reservation_db"

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"

# Optional: Cloudflare R2 for file uploads
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
```

## Database Setup Options

### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Create database
createdb reservation_db

# Set DATABASE_URL
DATABASE_URL="postgresql://localhost:5432/reservation_db"
```

### Option 2: Supabase (Recommended for production)
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string from Settings > Database
4. Use "connection pooling" URL for Prisma

### Option 3: Neon (Serverless Postgres)
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Set DATABASE_URL in .env

### Option 4: Railway
1. Create account at [railway.app](https://railway.app)
2. Create PostgreSQL service
3. Copy DATABASE_URL from variables tab

## Deployment to Vercel

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Add environment variables in project settings
- Deploy

3. **Set Up Database**
- Use Supabase, Neon, or Railway for production database
- Add `DATABASE_URL` to Vercel environment variables
- Redeploy

## Development Workflow

### 1. Run Development Server
```bash
npm run dev
```

### 2. View Database (Prisma Studio)
```bash
npm run db:studio
```

This opens a GUI at `http://localhost:5555` to view/edit database records.

### 3. Make Schema Changes
```bash
# Edit prisma/schema.prisma
npm run db:push  # Push changes to database
npm run db:generate  # Regenerate Prisma client
```

### 4. Create Migration
```bash
npm run db:migrate
# Enter migration name when prompted
```

## Testing Concurrency

To test the double-booking prevention:

```typescript
// test-concurrency.ts
import { createBookingSafe } from './lib/booking'

async function testConcurrentBookings() {
  const bookingData = {
    providerId: 'provider-id',
    serviceId: 'service-id',
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
  const successes = results.filter(r => r.id).length
  const failures = results.filter(r => r instanceof Error).length

  console.log(`Successes: ${successes}`)  // Should be 1
  console.log(`Failures: ${failures}`)    // Should be 99
}

testConcurrentBookings()
```

Expected result: Only ONE booking succeeds, 99 fail with `SLOT_UNAVAILABLE`.

## Next Steps

### Immediate Implementation Tasks:
1. **Authentication**: Implement NextAuth.js for provider login/signup
2. **API Routes**: Create all API endpoints from `API_DESIGN.md`
3. **UI Components**: Build booking calendar, provider dashboard
4. **Public Pages**: Create booking flow for customers
5. **Email Notifications**: Integrate Resend for confirmations

### Future Enhancements:
- Payment integration (Stripe)
- Google Calendar sync
- SMS reminders (Twilio)
- Multi-language support
- Mobile app (React Native)
- Advanced analytics dashboard
- Team/staff management
- Recurring bookings
- Waiting list feature

## Documentation

Comprehensive documentation available in `/docs`:

- **ARCHITECTURE.md**: System design, components, data flow
- **DATABASE_SCHEMA.md**: Complete database schema with SQL
- **API_DESIGN.md**: All API endpoints with request/response examples
- **BOOKING_ALGORITHM.md**: Concurrency control and time slot generation

## Support

For issues, questions, or contributions:
- Check documentation in `/docs` folder
- Review code comments in `/lib` folder
- Open an issue on GitHub

## License

MIT License - feel free to use for commercial or personal projects.

---

Built with Next.js, PostgreSQL, and Prisma.
