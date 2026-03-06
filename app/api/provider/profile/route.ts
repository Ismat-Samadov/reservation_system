import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const provider = await prisma.provider.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      username: true,
      businessName: true,
      description: true,
      timezone: true,
      avatarUrl: true,
    },
  })

  if (!provider) {
    return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
  }

  return NextResponse.json(provider)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { fullName, businessName, description, timezone } = body

    const updated = await prisma.provider.update({
      where: { id: session.user.id },
      data: {
        fullName: fullName || undefined,
        businessName: businessName !== undefined ? businessName : undefined,
        description: description !== undefined ? description : undefined,
        timezone: timezone || undefined,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        businessName: true,
        description: true,
        timezone: true,
        avatarUrl: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
