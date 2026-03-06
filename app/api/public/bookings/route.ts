import { NextRequest, NextResponse } from 'next/server'
import { createBookingSafe, BookingError } from '@/lib/booking'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      providerId,
      serviceId,
      startTime,
      endTime,
      customerName,
      customerEmail,
      customerPhone,
      notes,
    } = body

    if (!providerId || !serviceId || !startTime || !endTime || !customerName || !customerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const booking = await createBookingSafe({
      providerId,
      serviceId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone?.trim() || undefined,
      customerTimezone: 'UTC',
      notes: notes?.trim() || undefined,
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error: any) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 409 })
    }
    console.error('Public booking error:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
