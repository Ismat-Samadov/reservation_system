import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const availability = await prisma.availability.findMany({
    where: { providerId: session.user.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  return NextResponse.json(availability)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // schedule: Array<{ dayOfWeek: number, startTime: string, endTime: string, isAvailable: boolean }>
    const { schedule } = await req.json()

    if (!Array.isArray(schedule)) {
      return NextResponse.json({ error: 'Invalid schedule format' }, { status: 400 })
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    for (const entry of schedule) {
      if (!timeRegex.test(entry.startTime) || !timeRegex.test(entry.endTime)) {
        return NextResponse.json(
          { error: `Invalid time format for day ${entry.dayOfWeek}` },
          { status: 400 }
        )
      }
      if (entry.startTime >= entry.endTime) {
        return NextResponse.json(
          { error: `Start time must be before end time for day ${entry.dayOfWeek}` },
          { status: 400 }
        )
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({ where: { providerId: session.user.id } })

      const active = schedule.filter((s: any) => s.isAvailable)
      if (active.length > 0) {
        await tx.availability.createMany({
          data: active.map((s: any) => ({
            providerId: session.user.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isAvailable: true,
          })),
        })
      }
    })

    const saved = await prisma.availability.findMany({
      where: { providerId: session.user.id },
      orderBy: [{ dayOfWeek: 'asc' }],
    })

    return NextResponse.json(saved)
  } catch (error) {
    console.error('Availability update error:', error)
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 })
  }
}
