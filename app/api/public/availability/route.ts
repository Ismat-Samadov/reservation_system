import { NextRequest, NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/availability'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get('providerId')
  const serviceId = searchParams.get('serviceId')
  const date = searchParams.get('date') // YYYY-MM-DD

  if (!providerId || !serviceId || !date) {
    return NextResponse.json({ error: 'providerId, serviceId, and date are required' }, { status: 400 })
  }

  try {
    // Return slots in UTC — the client will display in browser's local timezone
    const slots = await getAvailableSlots(providerId, serviceId, date, 'UTC')
    return NextResponse.json(slots)
  } catch (error: any) {
    console.error('Public availability error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch slots' }, { status: 500 })
  }
}
