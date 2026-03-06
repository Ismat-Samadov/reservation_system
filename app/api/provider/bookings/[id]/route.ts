import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status } = await request.json()
  const allowed = ['confirmed', 'cancelled', 'completed', 'no_show']
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const booking = await prisma.booking.findFirst({
    where: { id, providerId: session.user.id },
  })
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status,
      ...(status === 'cancelled' ? { cancelledAt: new Date() } : {}),
    },
  })

  return NextResponse.json(updated)
}
