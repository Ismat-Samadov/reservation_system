import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const services = await prisma.service.findMany({
    where: { providerId: session.user.id },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json(services)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description, durationMinutes, price, currency, bufferTimeMinutes } = body

    if (!name || !durationMinutes) {
      return NextResponse.json({ error: 'Name and duration are required' }, { status: 400 })
    }

    const service = await prisma.service.create({
      data: {
        providerId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        durationMinutes: parseInt(durationMinutes),
        price: price ? parseFloat(price) : null,
        currency: currency || 'USD',
        bufferTimeMinutes: parseInt(bufferTimeMinutes || 0),
        isActive: true,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Service create error:', error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
