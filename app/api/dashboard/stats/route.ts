import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const provider = await prisma.provider.findUnique({
      where: { email: session.user.email },
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // Today's bookings
    const todayBookings = await prisma.booking.count({
      where: {
        providerId: provider.id,
        startTime: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          in: ['confirmed', 'completed'],
        },
      },
    })

    // Upcoming bookings (future)
    const upcomingBookings = await prisma.booking.count({
      where: {
        providerId: provider.id,
        startTime: {
          gt: now,
        },
        status: 'confirmed',
      },
    })

    // Total bookings this month
    const monthlyBookings = await prisma.booking.count({
      where: {
        providerId: provider.id,
        startTime: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: {
          in: ['confirmed', 'completed'],
        },
      },
    })

    // Revenue this month
    const monthlyRevenue = await prisma.booking.findMany({
      where: {
        providerId: provider.id,
        startTime: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: {
          in: ['confirmed', 'completed'],
        },
      },
      include: {
        service: {
          select: {
            price: true,
          },
        },
      },
    })

    const totalRevenue = monthlyRevenue.reduce((sum, booking) => {
      const price = booking.service.price ? parseFloat(booking.service.price.toString()) : 0
      return sum + price
    }, 0)

    // Active services
    const activeServices = await prisma.service.count({
      where: {
        providerId: provider.id,
        isActive: true,
      },
    })

    // Cancellation rate
    const totalBookings = await prisma.booking.count({
      where: {
        providerId: provider.id,
        startTime: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    })

    const cancelledBookings = await prisma.booking.count({
      where: {
        providerId: provider.id,
        startTime: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: 'cancelled',
      },
    })

    const cancellationRate = totalBookings > 0
      ? ((cancelledBookings / totalBookings) * 100).toFixed(1)
      : 0

    return NextResponse.json({
      todayBookings,
      upcomingBookings,
      monthlyBookings,
      totalRevenue: totalRevenue.toFixed(2),
      activeServices,
      cancellationRate,
      totalBookingsThisMonth: totalBookings,
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
