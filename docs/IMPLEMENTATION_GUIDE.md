# Implementation Guide

This guide walks you through implementing the remaining features to make the reservation system fully functional.

## Current Status

**Completed:**
- Project setup with Next.js 16 + TypeScript + Tailwind
- PostgreSQL database schema with Prisma ORM
- Core booking logic with concurrency safety (row-level locking)
- Time slot generation algorithm with timezone support
- Comprehensive documentation

**To Implement:**
1. Authentication system (NextAuth.js)
2. API routes for all endpoints
3. UI components and pages
4. Email notifications
5. Provider dashboard
6. Public booking pages

---

## Phase 1: Authentication with NextAuth.js

### 1.1 Install Auth Dependencies (Already Installed)
```bash
# Already in package.json
npm install next-auth bcrypt
npm install -D @types/bcrypt
```

### 1.2 Create Auth Configuration

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const provider = await prisma.provider.findUnique({
          where: { email: credentials.email }
        })

        if (!provider) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          provider.passwordHash
        )

        if (!isValid) {
          return null
        }

        return {
          id: provider.id,
          email: provider.email,
          name: provider.fullName,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### 1.3 Create Sign Up API Route

Create `app/api/auth/signup/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { z } from "zod"

const signupSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  timezone: z.string().default("UTC"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = signupSchema.parse(body)

    // Check if username or email already exists
    const existing = await prisma.provider.findFirst({
      where: {
        OR: [
          { username: validated.username },
          { email: validated.email }
        ]
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validated.password, 10)

    // Create provider
    const provider = await prisma.provider.create({
      data: {
        username: validated.username,
        email: validated.email,
        passwordHash,
        fullName: validated.fullName,
        timezone: validated.timezone,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
      }
    })

    return NextResponse.json({ success: true, data: provider }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}
```

---

## Phase 2: Public Booking API Routes

### 2.1 Get Provider Public Profile

Create `app/api/public/[username]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const provider = await prisma.provider.findUnique({
      where: { username: params.username },
      select: {
        id: true,
        username: true,
        fullName: true,
        businessName: true,
        description: true,
        timezone: true,
        avatarUrl: true,
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            durationMinutes: true,
            price: true,
            currency: true,
          }
        }
      }
    })

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ provider })
  } catch (error) {
    console.error("Error fetching provider:", error)
    return NextResponse.json(
      { error: "Failed to fetch provider" },
      { status: 500 }
    )
  }
}
```

### 2.2 Get Available Time Slots

Create `app/api/public/[username]/availability/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAvailableSlotsOnly } from "@/lib/availability"

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")
    const serviceId = searchParams.get("serviceId")
    const timezone = searchParams.get("timezone") || "UTC"

    if (!date || !serviceId) {
      return NextResponse.json(
        { error: "Missing required parameters: date, serviceId" },
        { status: 400 }
      )
    }

    // Get provider ID from username
    const provider = await prisma.provider.findUnique({
      where: { username: params.username },
      select: { id: true }
    })

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      )
    }

    // Get available slots
    const slots = await getAvailableSlotsOnly(
      provider.id,
      serviceId,
      date,
      timezone
    )

    return NextResponse.json({
      date,
      timezone,
      slots: slots.map(slot => ({
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
      }))
    })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    )
  }
}
```

### 2.3 Create Booking

Create `app/api/public/[username]/bookings/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createBookingSafe, BookingError } from "@/lib/booking"
import { z } from "zod"

const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  customerTimezone: z.string().default("UTC"),
  notes: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const body = await req.json()
    const validated = bookingSchema.parse(body)

    // Get provider ID
    const provider = await prisma.provider.findUnique({
      where: { username: params.username },
      select: { id: true }
    })

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      )
    }

    // Create booking with concurrency safety
    const booking = await createBookingSafe({
      providerId: provider.id,
      serviceId: validated.serviceId,
      startTime: new Date(validated.startTime),
      endTime: new Date(validated.endTime),
      customerName: validated.customerName,
      customerEmail: validated.customerEmail,
      customerPhone: validated.customerPhone,
      customerTimezone: validated.customerTimezone,
      notes: validated.notes,
    })

    // TODO: Send confirmation email here

    return NextResponse.json({
      success: true,
      data: {
        id: booking.id,
        status: booking.status,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        service: booking.service,
        provider: booking.provider,
      }
    }, { status: 201 })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof BookingError) {
      const statusCode = error.code === 'SLOT_UNAVAILABLE' ? 409 : 400
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusCode }
      )
    }

    console.error("Booking creation error:", error)
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    )
  }
}
```

---

## Phase 3: Provider Dashboard API Routes

### 3.1 Get Provider Bookings

Create `app/api/provider/bookings/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getProviderBookings } from "@/lib/booking"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")?.split(",")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    const result = await getProviderBookings(session.user.id, {
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    )
  }
}
```

---

## Phase 4: Email Notifications with Resend

### 4.1 Create Email Utility

Create `lib/email.ts`:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendBookingConfirmation(booking: any) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: [booking.customerEmail],
      subject: 'Booking Confirmation',
      html: `
        <h1>Booking Confirmed!</h1>
        <p>Hi ${booking.customerName},</p>
        <p>Your booking has been confirmed.</p>
        <p><strong>Service:</strong> ${booking.service.name}</p>
        <p><strong>Date & Time:</strong> ${new Date(booking.startTime).toLocaleString()}</p>
        <p><strong>Provider:</strong> ${booking.provider.businessName || booking.provider.fullName}</p>
        <p>See you then!</p>
      `
    })

    if (error) {
      console.error('Email error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export async function sendBookingCancellation(booking: any) {
  // Similar implementation
}

export async function sendBookingReminder(booking: any) {
  // Similar implementation
}
```

### 4.2 Integrate Email in Booking Route

Update the booking creation route to send email:

```typescript
// In app/api/public/[username]/bookings/route.ts
import { sendBookingConfirmation } from "@/lib/email"

// After creating booking:
await sendBookingConfirmation(booking)
```

---

## Phase 5: UI Components

### 5.1 Create Basic UI Components

Use shadcn/ui for pre-built components:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add toast
```

### 5.2 Create Booking Calendar Component

Create `components/booking-calendar.tsx`:

```typescript
"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"

export function BookingCalendar({ provider, service }: any) {
  const [date, setDate] = useState<Date>()
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState<any>(null)

  async function fetchSlots(date: Date) {
    const dateStr = date.toISOString().split('T')[0]
    const res = await fetch(
      `/api/public/${provider.username}/availability?date=${dateStr}&serviceId=${service.id}`
    )
    const data = await res.json()
    setSlots(data.slots)
  }

  async function handleBooking() {
    if (!selectedSlot) return

    const res = await fetch(`/api/public/${provider.username}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: service.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        customerName: "...", // From form
        customerEmail: "...", // From form
      })
    })

    if (res.ok) {
      // Show success message
    }
  }

  return (
    <div>
      <Calendar
        mode="single"
        selected={date}
        onSelect={(d) => {
          setDate(d)
          if (d) fetchSlots(d)
        }}
      />

      {slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          {slots.map((slot: any) => (
            <Button
              key={slot.startTime}
              onClick={() => setSelectedSlot(slot)}
              variant={selectedSlot === slot ? "default" : "outline"}
            >
              {new Date(slot.startTime).toLocaleTimeString()}
            </Button>
          ))}
        </div>
      )}

      {selectedSlot && (
        <Button onClick={handleBooking} className="mt-4">
          Confirm Booking
        </Button>
      )}
    </div>
  )
}
```

---

## Phase 6: Public Booking Page

Create `app/book/[username]/page.tsx`:

```typescript
import { prisma } from "@/lib/prisma"
import { BookingCalendar } from "@/components/booking-calendar"
import { notFound } from "next/navigation"

export default async function BookingPage({
  params
}: {
  params: { username: string }
}) {
  const provider = await prisma.provider.findUnique({
    where: { username: params.username },
    include: {
      services: {
        where: { isActive: true }
      }
    }
  })

  if (!provider) {
    notFound()
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-2">
        {provider.businessName || provider.fullName}
      </h1>
      <p className="text-muted-foreground mb-8">{provider.description}</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Select a Service</h2>
          {provider.services.map(service => (
            <div key={service.id} className="border p-4 rounded mb-2">
              <h3 className="font-medium">{service.name}</h3>
              <p className="text-sm text-muted-foreground">
                {service.durationMinutes} minutes • ${service.price}
              </p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Select Date & Time</h2>
          <BookingCalendar provider={provider} service={provider.services[0]} />
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 7: Provider Dashboard

Create `app/dashboard/page.tsx`:

```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { getProviderBookings } from "@/lib/booking"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const { bookings } = await getProviderBookings(session.user.id, {
    limit: 10
  })

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid gap-4">
        <h2 className="text-xl font-semibold">Recent Bookings</h2>
        {bookings.map(booking => (
          <div key={booking.id} className="border p-4 rounded">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{booking.customerName}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.service.name}
                </p>
              </div>
              <div className="text-right">
                <p>{new Date(booking.startTime).toLocaleDateString()}</p>
                <p className="text-sm">
                  {new Date(booking.startTime).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## Testing

### Test Concurrency Safety

Create `scripts/test-concurrency.ts`:

```typescript
import { createBookingSafe } from '../lib/booking'

async function test() {
  const data = {
    providerId: 'your-provider-id',
    serviceId: 'your-service-id',
    startTime: new Date('2024-03-01T15:00:00Z'),
    endTime: new Date('2024-03-01T15:30:00Z'),
    customerName: 'Test',
    customerEmail: 'test@example.com',
  }

  const promises = Array(100).fill(null).map((_, i) =>
    createBookingSafe({
      ...data,
      customerEmail: `test${i}@example.com`
    }).catch(e => e)
  )

  const results = await Promise.all(promises)
  const successes = results.filter(r => r.id).length

  console.log(`Success: ${successes} (should be 1)`)
  console.log(`Failures: ${100 - successes} (should be 99)`)
}

test()
```

Run:
```bash
npx ts-node scripts/test-concurrency.ts
```

---

## Deployment Checklist

- [ ] Set up production PostgreSQL database
- [ ] Add all environment variables to Vercel
- [ ] Run database migrations
- [ ] Test authentication flow
- [ ] Test booking creation
- [ ] Test email delivery
- [ ] Configure custom domain
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Add analytics (Vercel Analytics, Plausible)

---

## Next Features to Implement

1. Password reset flow
2. Email verification
3. Provider profile image upload (R2)
4. Advanced booking filters
5. Export bookings to CSV
6. SMS notifications (Twilio)
7. Payment integration (Stripe)
8. Calendar sync (Google Calendar, iCal)
9. Booking reminders (cron job)
10. Analytics dashboard

---

## Support

For questions or issues, refer to:
- `README.md` - Project overview
- `docs/ARCHITECTURE.md` - System design
- `docs/API_DESIGN.md` - API reference
- `docs/BOOKING_ALGORITHM.md` - Core algorithms
