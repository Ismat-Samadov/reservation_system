import { prisma } from './prisma'
import { addMinutes, parse, startOfDay, endOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export interface TimeSlot {
  startTime: Date
  endTime: Date
  available: boolean
}

export class AvailabilityError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = 'AvailabilityError'
  }
}

/**
 * Get available time slots for a provider on a specific date
 * This is the CRITICAL algorithm that generates bookable slots
 */
export async function getAvailableSlots(
  providerId: string,
  serviceId: string,
  date: string, // YYYY-MM-DD format
  customerTimezone: string = 'UTC'
): Promise<TimeSlot[]> {
  try {
    // 1. Fetch provider and service details
    const [provider, service] = await Promise.all([
      prisma.provider.findUnique({
        where: { id: providerId },
        select: { id: true, timezone: true },
      }),
      prisma.service.findUnique({
        where: { id: serviceId, providerId },
        select: {
          id: true,
          durationMinutes: true,
          bufferTimeMinutes: true,
        },
      }),
    ])

    if (!provider) {
      throw new AvailabilityError('PROVIDER_NOT_FOUND', 'Provider not found')
    }

    if (!service) {
      throw new AvailabilityError('SERVICE_NOT_FOUND', 'Service not found')
    }

    const providerTimezone = provider.timezone
    const slotDuration = service.durationMinutes + service.bufferTimeMinutes

    // 2. Parse the date in provider's timezone
    const targetDate = parse(date, 'yyyy-MM-dd', new Date())
    const dayOfWeek = targetDate.getDay() // 0=Sunday, 6=Saturday

    // 3. Get provider's availability for this day of week
    const availabilityRules = await prisma.availability.findMany({
      where: {
        providerId,
        dayOfWeek,
        isAvailable: true,
      },
      orderBy: { startTime: 'asc' },
    })

    if (availabilityRules.length === 0) {
      // Provider not available on this day
      return []
    }

    // 4. Get start and end of day in provider's timezone (converted to UTC)
    const dayStartUTC = fromZonedTime(
      startOfDay(new Date(`${date}T00:00:00`)),
      providerTimezone
    )
    const dayEndUTC = fromZonedTime(
      endOfDay(new Date(`${date}T23:59:59`)),
      providerTimezone
    )

    // 5. Fetch existing bookings for this date
    const bookings = await prisma.booking.findMany({
      where: {
        providerId,
        startTime: { gte: dayStartUTC, lte: dayEndUTC },
        status: { notIn: ['cancelled'] },
      },
      select: { startTime: true, endTime: true },
      orderBy: { startTime: 'asc' },
    })

    // 6. Fetch blocked periods for this date
    const blockedPeriods = await prisma.blockedPeriod.findMany({
      where: {
        providerId,
        startDatetime: { lte: dayEndUTC },
        endDatetime: { gte: dayStartUTC },
      },
      select: { startDatetime: true, endDatetime: true },
    })

    // 7. Generate all possible time slots based on availability rules
    const slots: TimeSlot[] = []

    for (const rule of availabilityRules) {
      // Create datetime objects in provider's timezone, then convert to UTC
      const periodStart = fromZonedTime(
        new Date(`${date}T${rule.startTime}:00`),
        providerTimezone
      )
      const periodEnd = fromZonedTime(
        new Date(`${date}T${rule.endTime}:00`),
        providerTimezone
      )

      // Generate slots within this availability period
      let currentSlotStart = new Date(periodStart)

      while (currentSlotStart < periodEnd) {
        const currentSlotEnd = addMinutes(currentSlotStart, slotDuration)

        // Check if slot end exceeds period end
        if (currentSlotEnd > periodEnd) {
          break
        }

        // Check if slot overlaps with existing bookings
        const isBooked = bookings.some(
          (booking) =>
            currentSlotStart < booking.endTime &&
            currentSlotEnd > booking.startTime
        )

        // Check if slot overlaps with blocked periods
        const isBlocked = blockedPeriods.some(
          (blocked) =>
            currentSlotStart < blocked.endDatetime &&
            currentSlotEnd > blocked.startDatetime
        )

        // Check if slot is in the past
        const now = new Date()
        const isPast = currentSlotEnd <= now

        // Add slot with availability status
        slots.push({
          startTime: toZonedTime(currentSlotStart, customerTimezone),
          endTime: toZonedTime(currentSlotEnd, customerTimezone),
          available: !isBooked && !isBlocked && !isPast,
        })

        // Move to next slot
        currentSlotStart = currentSlotEnd
      }
    }

    return slots
  } catch (error) {
    if (error instanceof AvailabilityError) {
      throw error
    }
    console.error('Availability fetch error:', error)
    throw new AvailabilityError(
      'AVAILABILITY_FETCH_FAILED',
      'Failed to fetch available time slots'
    )
  }
}

/**
 * Get only available slots (filter out unavailable)
 */
export async function getAvailableSlotsOnly(
  providerId: string,
  serviceId: string,
  date: string,
  customerTimezone: string = 'UTC'
): Promise<TimeSlot[]> {
  const allSlots = await getAvailableSlots(
    providerId,
    serviceId,
    date,
    customerTimezone
  )
  return allSlots.filter((slot) => slot.available)
}

/**
 * Check if a specific time slot is available
 */
export async function isSlotAvailable(
  providerId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const conflicts = await prisma.booking.count({
    where: {
      providerId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      status: { notIn: ['cancelled'] },
    },
  })

  const blocked = await prisma.blockedPeriod.count({
    where: {
      providerId,
      startDatetime: { lt: endTime },
      endDatetime: { gt: startTime },
    },
  })

  return conflicts === 0 && blocked === 0
}

/**
 * Get provider's weekly availability schedule
 */
export async function getProviderAvailability(providerId: string) {
  return await prisma.availability.findMany({
    where: { providerId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })
}

/**
 * Set provider's availability for a specific day
 */
export async function setProviderAvailability(
  providerId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  isAvailable: boolean = true
) {
  // Validate inputs
  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new AvailabilityError('INVALID_DAY', 'Day of week must be between 0 (Sunday) and 6 (Saturday)')
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    throw new AvailabilityError('INVALID_TIME', 'Time must be in HH:MM format')
  }

  // Check if this conflicts with existing availability
  const existing = await prisma.availability.findFirst({
    where: {
      providerId,
      dayOfWeek,
      startTime,
      endTime,
    },
  })

  if (existing) {
    // Update existing
    return await prisma.availability.update({
      where: { id: existing.id },
      data: { isAvailable },
    })
  } else {
    // Create new
    return await prisma.availability.create({
      data: {
        providerId,
        dayOfWeek,
        startTime,
        endTime,
        isAvailable,
      },
    })
  }
}

/**
 * Create a blocked period (vacation, break, etc.)
 */
export async function createBlockedPeriod(
  providerId: string,
  startDatetime: Date,
  endDatetime: Date,
  reason?: string
) {
  if (endDatetime <= startDatetime) {
    throw new AvailabilityError('INVALID_PERIOD', 'End time must be after start time')
  }

  return await prisma.blockedPeriod.create({
    data: {
      providerId,
      startDatetime,
      endDatetime,
      reason,
    },
  })
}

/**
 * Get provider's blocked periods
 */
export async function getBlockedPeriods(
  providerId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = { providerId }

  if (startDate || endDate) {
    where.AND = []
    if (startDate) {
      where.AND.push({ endDatetime: { gte: startDate } })
    }
    if (endDate) {
      where.AND.push({ startDatetime: { lte: endDate } })
    }
  }

  return await prisma.blockedPeriod.findMany({
    where,
    orderBy: { startDatetime: 'asc' },
  })
}

/**
 * Delete a blocked period
 */
export async function deleteBlockedPeriod(id: string, providerId: string) {
  const blocked = await prisma.blockedPeriod.findUnique({
    where: { id },
  })

  if (!blocked) {
    throw new AvailabilityError('BLOCKED_PERIOD_NOT_FOUND', 'Blocked period not found')
  }

  if (blocked.providerId !== providerId) {
    throw new AvailabilityError('UNAUTHORIZED', 'Unauthorized to delete this blocked period')
  }

  return await prisma.blockedPeriod.delete({
    where: { id },
  })
}
