import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

export class BookingError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = 'BookingError'
  }
}

export interface CreateBookingData {
  providerId: string
  serviceId: string
  startTime: Date
  endTime: Date
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerTimezone?: string
  notes?: string
}

/**
 * Create a booking with row-level locking to prevent double-booking
 * This is the CRITICAL function that ensures no race conditions
 */
export async function createBookingSafe(data: CreateBookingData) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        // Step 1: Lock potentially conflicting bookings using raw SQL
        // This prevents other transactions from modifying overlapping bookings
        const conflicts = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM bookings
          WHERE provider_id = ${data.providerId}::uuid
            AND start_time < ${data.endTime}::timestamptz
            AND end_time > ${data.startTime}::timestamptz
            AND status NOT IN ('cancelled')
          FOR UPDATE NOWAIT
        `

        // Step 2: If any conflicts found, slot is taken
        if (conflicts.length > 0) {
          throw new BookingError(
            'SLOT_UNAVAILABLE',
            'This time slot is no longer available'
          )
        }

        // Step 3: Verify provider and service exist
        const [provider, service] = await Promise.all([
          tx.provider.findUnique({
            where: { id: data.providerId },
            select: { id: true, fullName: true, businessName: true, email: true },
          }),
          tx.service.findUnique({
            where: { id: data.serviceId },
            select: { id: true, name: true, durationMinutes: true, price: true },
          }),
        ])

        if (!provider) {
          throw new BookingError('PROVIDER_NOT_FOUND', 'Provider not found')
        }

        if (!service || !service) {
          throw new BookingError('SERVICE_NOT_FOUND', 'Service not found')
        }

        // Step 4: Create the booking
        const booking = await tx.booking.create({
          data: {
            providerId: data.providerId,
            serviceId: data.serviceId,
            startTime: data.startTime,
            endTime: data.endTime,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            customerTimezone: data.customerTimezone || 'UTC',
            notes: data.notes,
            status: 'confirmed',
            confirmedAt: new Date(),
            version: 1,
          },
          include: {
            service: {
              select: {
                name: true,
                durationMinutes: true,
                price: true,
              },
            },
            provider: {
              select: {
                fullName: true,
                businessName: true,
                email: true,
                timezone: true,
              },
            },
          },
        })

        return booking
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 3000, // Wait up to 3s for lock
        timeout: 10000, // Transaction timeout 10s
      }
    )
  } catch (error: any) {
    // Handle Prisma errors
    if (error instanceof BookingError) {
      throw error
    }

    if (error.code === 'P2002') {
      // Unique constraint violation (backup safety net)
      throw new BookingError(
        'SLOT_UNAVAILABLE',
        'This time slot is no longer available'
      )
    }

    if (error.code === '55P03') {
      // Lock not available (NOWAIT failed)
      throw new BookingError(
        'SLOT_BUSY',
        'This slot is currently being booked by another customer. Please try again.'
      )
    }

    // Unknown error
    console.error('Booking creation error:', error)
    throw new BookingError('BOOKING_FAILED', 'Failed to create booking. Please try again.')
  }
}

/**
 * Cancel a booking (customer-initiated)
 */
export async function cancelBooking(
  bookingId: string,
  customerEmail: string,
  reason?: string
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      throw new BookingError('BOOKING_NOT_FOUND', 'Booking not found')
    }

    // Verify customer email matches
    if (booking.customerEmail !== customerEmail) {
      throw new BookingError('UNAUTHORIZED', 'Unauthorized to cancel this booking')
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      throw new BookingError('ALREADY_CANCELLED', 'This booking is already cancelled')
    }

    // Update booking status
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date(),
        version: { increment: 1 },
      },
    })

    return updated
  } catch (error) {
    if (error instanceof BookingError) {
      throw error
    }
    console.error('Booking cancellation error:', error)
    throw new BookingError('CANCELLATION_FAILED', 'Failed to cancel booking')
  }
}

/**
 * Update booking status (provider-initiated)
 */
export async function updateBookingStatus(
  bookingId: string,
  providerId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show',
  reason?: string
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      throw new BookingError('BOOKING_NOT_FOUND', 'Booking not found')
    }

    // Verify provider owns this booking
    if (booking.providerId !== providerId) {
      throw new BookingError('UNAUTHORIZED', 'Unauthorized to modify this booking')
    }

    const updateData: any = {
      status,
      version: { increment: 1 },
    }

    if (status === 'cancelled') {
      updateData.cancelledAt = new Date()
      updateData.cancellationReason = reason
    } else if (status === 'confirmed') {
      updateData.confirmedAt = new Date()
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    })

    return updated
  } catch (error) {
    if (error instanceof BookingError) {
      throw error
    }
    console.error('Booking status update error:', error)
    throw new BookingError('UPDATE_FAILED', 'Failed to update booking status')
  }
}

/**
 * Get bookings for a provider with filtering
 */
export async function getProviderBookings(
  providerId: string,
  filters?: {
    status?: string[]
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }
) {
  const page = filters?.page || 1
  const limit = filters?.limit || 50
  const skip = (page - 1) * limit

  const where: Prisma.BookingWhereInput = {
    providerId,
  }

  if (filters?.status && filters.status.length > 0) {
    where.status = { in: filters.status }
  }

  if (filters?.startDate || filters?.endDate) {
    where.startTime = {}
    if (filters.startDate) {
      where.startTime.gte = filters.startDate
    }
    if (filters.endDate) {
      where.startTime.lte = filters.endDate
    }
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        service: {
          select: {
            name: true,
            durationMinutes: true,
            price: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ])

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get a specific booking by ID
 */
export async function getBookingById(bookingId: string, providerId?: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: {
        select: {
          name: true,
          description: true,
          durationMinutes: true,
          price: true,
        },
      },
      provider: {
        select: {
          fullName: true,
          businessName: true,
          email: true,
          timezone: true,
        },
      },
    },
  })

  if (!booking) {
    throw new BookingError('BOOKING_NOT_FOUND', 'Booking not found')
  }

  // If providerId is specified, verify ownership
  if (providerId && booking.providerId !== providerId) {
    throw new BookingError('UNAUTHORIZED', 'Unauthorized to view this booking')
  }

  return booking
}
