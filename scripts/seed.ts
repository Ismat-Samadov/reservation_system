import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Helper: get a Date offset from now (days can be negative for past)
function daysFromNow(days: number, hour: number, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d
}

async function main() {
  console.log('Seeding database...')

  // ── Provider ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10)

  const provider = await prisma.provider.upsert({
    where: { username: 'johndoe' },
    update: {
      fullName: 'John Doe',
      businessName: "John's Barbershop",
      description: 'Professional barber with 10 years of experience. Specializing in classic cuts, fades, and modern styles. Walk-ins welcome — appointments preferred.',
      timezone: 'America/New_York',
    },
    create: {
      username: 'johndoe',
      email: 'john@example.com',
      passwordHash,
      fullName: 'John Doe',
      businessName: "John's Barbershop",
      description: 'Professional barber with 10 years of experience. Specializing in classic cuts, fades, and modern styles. Walk-ins welcome — appointments preferred.',
      timezone: 'America/New_York',
    },
  })

  console.log('Created provider:', provider.username)

  // ── Services ──────────────────────────────────────────────
  const haircut = await prisma.service.upsert({
    where: { id: provider.id + '-haircut' },
    update: { name: 'Haircut', price: 25.00, durationMinutes: 30, bufferTimeMinutes: 5, isActive: true, displayOrder: 1 },
    create: {
      id: provider.id + '-haircut',
      providerId: provider.id,
      name: 'Haircut',
      description: "Classic men's haircut — scissor or clipper, finished with a hot towel.",
      durationMinutes: 30,
      price: 25.00,
      bufferTimeMinutes: 5,
      isActive: true,
      displayOrder: 1,
    },
  })

  const haircutBeard = await prisma.service.upsert({
    where: { id: provider.id + '-haircut-beard' },
    update: { name: 'Haircut & Beard Trim', price: 35.00, durationMinutes: 45, bufferTimeMinutes: 5, isActive: true, displayOrder: 2 },
    create: {
      id: provider.id + '-haircut-beard',
      providerId: provider.id,
      name: 'Haircut & Beard Trim',
      description: 'Full-service haircut with professional beard shaping and styling.',
      durationMinutes: 45,
      price: 35.00,
      bufferTimeMinutes: 5,
      isActive: true,
      displayOrder: 2,
    },
  })

  const beardTrim = await prisma.service.upsert({
    where: { id: provider.id + '-beard' },
    update: { name: 'Beard Trim', price: 15.00, durationMinutes: 20, bufferTimeMinutes: 5, isActive: true, displayOrder: 3 },
    create: {
      id: provider.id + '-beard',
      providerId: provider.id,
      name: 'Beard Trim',
      description: 'Precision beard trimming and line-up.',
      durationMinutes: 20,
      price: 15.00,
      bufferTimeMinutes: 5,
      isActive: true,
      displayOrder: 3,
    },
  })

  const fade = await prisma.service.upsert({
    where: { id: provider.id + '-fade' },
    update: { name: 'Skin Fade', price: 30.00, durationMinutes: 35, bufferTimeMinutes: 5, isActive: true, displayOrder: 4 },
    create: {
      id: provider.id + '-fade',
      providerId: provider.id,
      name: 'Skin Fade',
      description: 'Sharp skin fade with a natural blend — low, mid, or high.',
      durationMinutes: 35,
      price: 30.00,
      bufferTimeMinutes: 5,
      isActive: true,
      displayOrder: 4,
    },
  })

  console.log('Created services:', [haircut.name, haircutBeard.name, beardTrim.name, fade.name].join(', '))

  // ── Availability ──────────────────────────────────────────
  const availabilityData = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 6, startTime: '10:00', endTime: '15:00' },
  ]

  for (const avail of availabilityData) {
    await prisma.availability.upsert({
      where: {
        providerId_dayOfWeek_startTime_endTime: {
          providerId: provider.id,
          dayOfWeek: avail.dayOfWeek,
          startTime: avail.startTime,
          endTime: avail.endTime,
        },
      },
      update: {},
      create: { providerId: provider.id, ...avail, isAvailable: true },
    })
  }

  console.log('Created availability (Mon-Fri 9-5, Sat 10-3)')

  // ── Blocked periods ───────────────────────────────────────
  // Delete existing blocked periods and recreate
  await prisma.blockedPeriod.deleteMany({ where: { providerId: provider.id } })

  // Vacation two weeks from now
  const vacationStart = daysFromNow(14, 0)
  const vacationEnd = daysFromNow(21, 0)
  await prisma.blockedPeriod.create({
    data: {
      providerId: provider.id,
      startDatetime: vacationStart,
      endDatetime: vacationEnd,
      reason: 'Summer vacation',
    },
  })

  console.log('Created blocked period (vacation in 2 weeks)')

  // ── Bookings ──────────────────────────────────────────────
  // Delete all existing bookings so we can recreate cleanly
  await prisma.booking.deleteMany({ where: { providerId: provider.id } })

  const customers = [
    { name: 'Alex Martinez',   email: 'alex.martinez@email.com',   phone: '+1 (212) 555-0101' },
    { name: 'James Wilson',    email: 'james.wilson@email.com',    phone: '+1 (212) 555-0102' },
    { name: 'Chris Johnson',   email: 'chris.j@email.com',         phone: '+1 (212) 555-0103' },
    { name: 'Mike Thompson',   email: 'mike.t@email.com',          phone: '+1 (212) 555-0104' },
    { name: 'David Lee',       email: 'david.lee@email.com',       phone: '+1 (212) 555-0105' },
    { name: 'Ryan Davis',      email: 'ryan.davis@email.com',      phone: '+1 (212) 555-0106' },
    { name: 'Kevin Brown',     email: 'kevin.b@email.com',         phone: '+1 (212) 555-0107' },
    { name: 'Sam Garcia',      email: 'sam.garcia@email.com',      phone: '+1 (212) 555-0108' },
    { name: 'Tom Anderson',    email: 'tom.a@email.com',           phone: '+1 (212) 555-0109' },
    { name: 'Luke Robinson',   email: 'luke.r@email.com',          phone: '+1 (212) 555-0110' },
    { name: 'Ethan Clark',     email: 'ethan.c@email.com',         phone: '+1 (212) 555-0111' },
    { name: 'Noah Walker',     email: 'noah.w@email.com',          phone: '+1 (212) 555-0112' },
    { name: 'Liam Harris',     email: 'liam.h@email.com',          phone: '+1 (212) 555-0113' },
    { name: 'Mason Lewis',     email: 'mason.l@email.com',         phone: '+1 (212) 555-0114' },
    { name: 'Oliver Young',    email: 'oliver.y@email.com',        phone: '+1 (212) 555-0115' },
    { name: 'Lucas King',      email: 'lucas.k@email.com',         phone: '+1 (212) 555-0116' },
    { name: 'Aiden Scott',     email: 'aiden.s@email.com',         phone: '+1 (212) 555-0117' },
    { name: 'Jackson Green',   email: 'jackson.g@email.com',       phone: '+1 (212) 555-0118' },
  ]

  // Each booking definition: [dayOffset, hour, serviceKey, status, customerIdx, notes?]
  type BookingDef = {
    dayOffset: number
    hour: number
    minute?: number
    service: typeof haircut
    status: string
    customerIdx: number
    notes?: string
  }

  const bookingDefs: BookingDef[] = [
    // ── Today ──
    { dayOffset: 0, hour: 9,  minute: 0,  service: haircut,      status: 'confirmed',  customerIdx: 0,  notes: 'Prefers scissor cut' },
    { dayOffset: 0, hour: 10, minute: 30, service: beardTrim,    status: 'confirmed',  customerIdx: 1 },
    { dayOffset: 0, hour: 14, minute: 0,  service: haircutBeard, status: 'confirmed',  customerIdx: 2,  notes: 'Regular client' },
    { dayOffset: 0, hour: 15, minute: 30, service: fade,         status: 'pending',    customerIdx: 3 },

    // ── Tomorrow ──
    { dayOffset: 1, hour: 9,  minute: 0,  service: haircutBeard, status: 'confirmed',  customerIdx: 4 },
    { dayOffset: 1, hour: 10, minute: 30, service: haircut,      status: 'confirmed',  customerIdx: 5 },
    { dayOffset: 1, hour: 14, minute: 0,  service: beardTrim,    status: 'pending',    customerIdx: 6 },

    // ── In 2 days ──
    { dayOffset: 2, hour: 11, minute: 0,  service: fade,         status: 'confirmed',  customerIdx: 7 },
    { dayOffset: 2, hour: 15, minute: 0,  service: haircut,      status: 'confirmed',  customerIdx: 8 },

    // ── In 4 days ──
    { dayOffset: 4, hour: 9,  minute: 30, service: haircutBeard, status: 'confirmed',  customerIdx: 9 },
    { dayOffset: 4, hour: 13, minute: 0,  service: haircut,      status: 'pending',    customerIdx: 10 },

    // ── In 7 days ──
    { dayOffset: 7, hour: 10, minute: 0,  service: fade,         status: 'confirmed',  customerIdx: 11 },
    { dayOffset: 7, hour: 14, minute: 30, service: haircut,      status: 'confirmed',  customerIdx: 12 },

    // ── Yesterday (past) ──
    { dayOffset: -1, hour: 10, minute: 0,  service: haircut,      status: 'completed',  customerIdx: 13 },
    { dayOffset: -1, hour: 13, minute: 30, service: haircutBeard, status: 'completed',  customerIdx: 14 },
    { dayOffset: -1, hour: 15, minute: 0,  service: beardTrim,    status: 'completed',  customerIdx: 0 },

    // ── 2 days ago ──
    { dayOffset: -2, hour: 9,  minute: 0,  service: fade,         status: 'completed',  customerIdx: 1 },
    { dayOffset: -2, hour: 11, minute: 0,  service: haircut,      status: 'no_show',    customerIdx: 2 },
    { dayOffset: -2, hour: 14, minute: 0,  service: haircutBeard, status: 'completed',  customerIdx: 3 },

    // ── 3 days ago ──
    { dayOffset: -3, hour: 9,  minute: 30, service: haircut,      status: 'completed',  customerIdx: 4 },
    { dayOffset: -3, hour: 13, minute: 0,  service: beardTrim,    status: 'completed',  customerIdx: 5 },
    { dayOffset: -3, hour: 16, minute: 0,  service: haircut,      status: 'cancelled',  customerIdx: 6,  notes: 'Client cancelled same day' },

    // ── 5 days ago ──
    { dayOffset: -5, hour: 10, minute: 0,  service: fade,         status: 'completed',  customerIdx: 7 },
    { dayOffset: -5, hour: 11, minute: 30, service: haircut,      status: 'completed',  customerIdx: 8 },
    { dayOffset: -5, hour: 14, minute: 0,  service: haircutBeard, status: 'cancelled',  customerIdx: 9 },
    { dayOffset: -5, hour: 16, minute: 0,  service: beardTrim,    status: 'completed',  customerIdx: 10 },

    // ── 7 days ago ──
    { dayOffset: -7, hour: 9,  minute: 0,  service: haircut,      status: 'completed',  customerIdx: 11 },
    { dayOffset: -7, hour: 10, minute: 30, service: haircutBeard, status: 'completed',  customerIdx: 12 },
    { dayOffset: -7, hour: 13, minute: 0,  service: fade,         status: 'no_show',    customerIdx: 13 },
    { dayOffset: -7, hour: 15, minute: 0,  service: haircut,      status: 'completed',  customerIdx: 14 },

    // ── 10 days ago ──
    { dayOffset: -10, hour: 9,  minute: 30, service: beardTrim,    status: 'completed',  customerIdx: 15 },
    { dayOffset: -10, hour: 11, minute: 0,  service: haircut,      status: 'completed',  customerIdx: 16 },
    { dayOffset: -10, hour: 14, minute: 30, service: haircutBeard, status: 'cancelled',  customerIdx: 17 },

    // ── 14 days ago ──
    { dayOffset: -14, hour: 10, minute: 0,  service: fade,         status: 'completed',  customerIdx: 0 },
    { dayOffset: -14, hour: 11, minute: 30, service: haircut,      status: 'completed',  customerIdx: 1 },
    { dayOffset: -14, hour: 14, minute: 0,  service: haircutBeard, status: 'completed',  customerIdx: 2 },
    { dayOffset: -14, hour: 16, minute: 0,  service: beardTrim,    status: 'cancelled',  customerIdx: 3 },

    // ── 18 days ago ──
    { dayOffset: -18, hour: 9,  minute: 0,  service: haircut,      status: 'completed',  customerIdx: 4 },
    { dayOffset: -18, hour: 10, minute: 30, service: fade,         status: 'completed',  customerIdx: 5 },
    { dayOffset: -18, hour: 13, minute: 0,  service: haircutBeard, status: 'completed',  customerIdx: 6 },

    // ── 21 days ago ──
    { dayOffset: -21, hour: 9,  minute: 0,  service: beardTrim,    status: 'completed',  customerIdx: 7 },
    { dayOffset: -21, hour: 10, minute: 0,  service: haircut,      status: 'completed',  customerIdx: 8 },
    { dayOffset: -21, hour: 14, minute: 30, service: haircutBeard, status: 'completed',  customerIdx: 9 },
    { dayOffset: -21, hour: 16, minute: 0,  service: fade,         status: 'cancelled',  customerIdx: 10 },
  ]

  let created = 0
  for (const def of bookingDefs) {
    const start = daysFromNow(def.dayOffset, def.hour, def.minute ?? 0)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + def.service.durationMinutes)

    const customer = customers[def.customerIdx]

    try {
      await prisma.booking.create({
        data: {
          providerId: provider.id,
          serviceId: def.service.id,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          startTime: start,
          endTime: end,
          status: def.status,
          notes: def.notes ?? null,
          confirmedAt: def.status !== 'pending' ? start : null,
          customerTimezone: 'America/New_York',
        },
      })
      created++
    } catch {
      // Skip if time slot already exists (re-seed)
    }
  }

  console.log(`Created ${created} bookings`)

  console.log('\nSeeding completed!')
  console.log('\nTest credentials:')
  console.log('  Email:    john@example.com')
  console.log('  Password: password123')
  console.log('\nPublic booking page:')
  console.log('  http://localhost:3000/book/johndoe')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
