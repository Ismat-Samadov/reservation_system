import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const VALID_RANGES = ['7d', '30d', '90d', 'all'] as const

function toNumber(val: unknown): number {
  if (val == null) return 0
  return parseFloat(String(val)) || 0
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const providerId = session.user.id
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get('range') ?? '30d') as (typeof VALID_RANGES)[number]

  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: 'Invalid range' }, { status: 400 })
  }

  const now = new Date()
  const startDate =
    range === '7d'  ? new Date(now.getTime() - 7  * 86400000) :
    range === '30d' ? new Date(now.getTime() - 30 * 86400000) :
    range === '90d' ? new Date(now.getTime() - 90 * 86400000) :
    undefined

  const where = {
    providerId,
    ...(startDate ? { startTime: { gte: startDate } } : {}),
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: { service: { select: { name: true, price: true } } },
    orderBy: { startTime: 'asc' },
  })

  // ── Status buckets ────────────────────────────────────────
  const completed  = bookings.filter(b => b.status === 'completed')
  const cancelled  = bookings.filter(b => b.status === 'cancelled')
  const noShow     = bookings.filter(b => b.status === 'no_show')
  const upcoming   = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending')

  // ── Revenue (completed only) ───────────────────────────────
  const totalRevenue    = completed.reduce((s, b) => s + toNumber(b.service.price), 0)
  const avgBookingValue = completed.length > 0 ? totalRevenue / completed.length : 0
  const completionRate  = bookings.length > 0 ? (completed.length  / bookings.length) * 100 : 0
  const cancellationRate = bookings.length > 0 ? (cancelled.length / bookings.length) * 100 : 0
  const noShowRate      = bookings.length > 0 ? (noShow.length     / bookings.length) * 100 : 0

  // ── Revenue timeline (fill every day in range) ─────────────
  const revenueMap: Record<string, { revenue: number; bookings: number }> = {}
  for (const b of bookings) {
    const key = b.startTime.toISOString().split('T')[0]
    if (!revenueMap[key]) revenueMap[key] = { revenue: 0, bookings: 0 }
    revenueMap[key].bookings++
    if (b.status === 'completed') revenueMap[key].revenue += toNumber(b.service.price)
  }

  const timelineDays = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 90
  const revenueTimeline = Array.from({ length: timelineDays }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (timelineDays - 1 - i))
    const key = d.toISOString().split('T')[0]
    return { date: key, ...(revenueMap[key] ?? { revenue: 0, bookings: 0 }) }
  })

  // ── Status breakdown ──────────────────────────────────────
  const statusMap: Record<string, number> = {}
  for (const b of bookings) statusMap[b.status] = (statusMap[b.status] ?? 0) + 1
  const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

  // ── Top services ──────────────────────────────────────────
  const serviceMap: Record<string, { name: string; bookings: number; revenue: number }> = {}
  for (const b of bookings) {
    if (!serviceMap[b.serviceId]) serviceMap[b.serviceId] = { name: b.service.name, bookings: 0, revenue: 0 }
    serviceMap[b.serviceId].bookings++
    if (b.status === 'completed') serviceMap[b.serviceId].revenue += toNumber(b.service.price)
  }
  const topServices = Object.values(serviceMap).sort((a, b) => b.bookings - a.bookings)

  // ── Top customers ─────────────────────────────────────────
  const customerMap: Record<string, { name: string; email: string; bookings: number; spent: number }> = {}
  for (const b of bookings) {
    const key = b.customerEmail
    if (!customerMap[key]) customerMap[key] = { name: b.customerName, email: b.customerEmail, bookings: 0, spent: 0 }
    customerMap[key].bookings++
    if (b.status === 'completed') customerMap[key].spent += toNumber(b.service.price)
  }
  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 10)

  // ── By day of week ────────────────────────────────────────
  const dowCounts = Array(7).fill(0)
  for (const b of bookings) dowCounts[b.startTime.getDay()]++
  const byDayOfWeek = DAYS_OF_WEEK.map((day, i) => ({ day, count: dowCounts[i] }))

  // ── By hour ───────────────────────────────────────────────
  const hourCounts = Array(24).fill(0)
  for (const b of bookings) hourCounts[b.startTime.getHours()]++
  const byHour = hourCounts.map((count, hour) => ({ hour, count })).filter(h => h.count > 0)

  return NextResponse.json({
    overview: {
      totalBookings:     bookings.length,
      completedBookings: completed.length,
      cancelledBookings: cancelled.length,
      noShowBookings:    noShow.length,
      upcomingBookings:  upcoming.length,
      totalRevenue:      totalRevenue.toFixed(2),
      avgBookingValue:   avgBookingValue.toFixed(2),
      completionRate:    completionRate.toFixed(1),
      cancellationRate:  cancellationRate.toFixed(1),
      noShowRate:        noShowRate.toFixed(1),
    },
    revenueTimeline,
    statusBreakdown,
    topServices,
    topCustomers,
    byDayOfWeek,
    byHour,
  })
}
