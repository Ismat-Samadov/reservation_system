import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.service.findFirst({
      where: { id, providerId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, description, durationMinutes, price, currency, bufferTimeMinutes, isActive } = body

    const updated = await prisma.service.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        description: description !== undefined ? (description?.trim() || null) : existing.description,
        durationMinutes: durationMinutes !== undefined ? parseInt(durationMinutes) : existing.durationMinutes,
        price: price !== undefined ? (price ? parseFloat(price) : null) : existing.price,
        currency: currency || existing.currency,
        bufferTimeMinutes: bufferTimeMinutes !== undefined ? parseInt(bufferTimeMinutes) : existing.bufferTimeMinutes,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Service update error:', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.service.findFirst({
    where: { id, providerId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  // If active bookings exist, deactivate instead of deleting
  const activeBookings = await prisma.booking.count({
    where: { serviceId: id, status: { in: ['confirmed', 'pending'] } },
  })

  if (activeBookings > 0) {
    await prisma.service.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ message: 'Service deactivated (has active bookings)' })
  }

  await prisma.service.delete({ where: { id } })
  return NextResponse.json({ message: 'Service deleted' })
}
