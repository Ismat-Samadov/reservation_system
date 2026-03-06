import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recentBookings = await prisma.booking.findMany({
      where: {
        providerId: session.user.id,
      },
      include: {
        service: {
          select: {
            name: true,
            price: true,
            currency: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    return NextResponse.json({ bookings: recentBookings })
  } catch (error: any) {
    console.error('Recent bookings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent bookings' },
      { status: 500 }
    )
  }
}
