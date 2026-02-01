import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    const provider = await prisma.provider.findUnique({
      where: { username },
      select: {
        id: true,
        fullName: true,
        businessName: true,
        description: true,
        avatarUrl: true,
        timezone: true,
      },
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    const services = await prisma.service.findMany({
      where: {
        providerId: provider.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        price: true,
        currency: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    })

    return NextResponse.json({
      provider,
      services,
    })
  } catch (error: any) {
    console.error('Error fetching provider:', error)
    return NextResponse.json(
      { error: 'Failed to fetch provider' },
      { status: 500 }
    )
  }
}
