/**
 * Test Script - Booking System Functionality
 *
 * This script tests the core booking logic to ensure:
 * 1. Time slots are generated correctly
 * 2. Bookings can be created
 * 3. Concurrency safety prevents double-booking
 */

import { prisma } from './lib/prisma'
import { getAvailableSlots } from './lib/availability'
import { createBookingSafe } from './lib/booking'

async function main() {
  console.log('🧪 Testing Reservation System\n')

  // Get the test provider
  const provider = await prisma.provider.findUnique({
    where: { username: 'johndoe' },
    include: { services: true }
  })

  if (!provider) {
    console.error('❌ Test provider not found. Run: npm run db:seed')
    return
  }

  console.log(`✅ Found provider: ${provider.fullName} (@${provider.username})`)
  console.log(`   Services: ${provider.services.length}\n`)

  // Test 1: Get available slots for tomorrow
  console.log('📅 Test 1: Fetching available time slots for tomorrow...')
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const service = provider.services[0]
  const slots = await getAvailableSlots(
    provider.id,
    service.id,
    tomorrowStr,
    'America/New_York'
  )

  const availableSlots = slots.filter(s => s.available)
  console.log(`   ✅ Found ${slots.length} total slots`)
  console.log(`   ✅ ${availableSlots.length} available slots`)
  console.log(`   ✅ ${slots.length - availableSlots.length} unavailable slots\n`)

  if (availableSlots.length > 0) {
    const firstSlot = availableSlots[0]
    console.log(`   First available slot: ${firstSlot.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}\n`)

    // Test 2: Create a booking
    console.log('📝 Test 2: Creating a test booking...')
    try {
      const booking = await createBookingSafe({
        providerId: provider.id,
        serviceId: service.id,
        startTime: firstSlot.startTime,
        endTime: firstSlot.endTime,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
        notes: 'This is a test booking',
      })

      console.log(`   ✅ Booking created successfully!`)
      console.log(`   ID: ${booking.id}`)
      console.log(`   Status: ${booking.status}`)
      console.log(`   Time: ${booking.startTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}\n`)

      // Test 3: Try to book the same slot (should fail)
      console.log('🔒 Test 3: Testing concurrency safety (attempting double-booking)...')
      try {
        await createBookingSafe({
          providerId: provider.id,
          serviceId: service.id,
          startTime: firstSlot.startTime,
          endTime: firstSlot.endTime,
          customerName: 'Another Customer',
          customerEmail: 'another@example.com',
        })
        console.log('   ❌ ERROR: Double-booking was allowed! This should not happen.')
      } catch (error: any) {
        if (error.code === 'SLOT_UNAVAILABLE') {
          console.log('   ✅ Correctly prevented double-booking!')
          console.log(`   Error message: "${error.message}"\n`)
        } else {
          console.log('   ⚠️  Unexpected error:', error.message)
        }
      }

      // Test 4: Verify slot is now unavailable
      console.log('🔄 Test 4: Verifying slot is now marked as unavailable...')
      const updatedSlots = await getAvailableSlots(
        provider.id,
        service.id,
        tomorrowStr,
        'America/New_York'
      )
      const bookedSlot = updatedSlots.find(s =>
        s.startTime.getTime() === firstSlot.startTime.getTime()
      )

      if (bookedSlot && !bookedSlot.available) {
        console.log('   ✅ Slot correctly marked as unavailable\n')
      } else {
        console.log('   ❌ Slot is still showing as available (ERROR)\n')
      }

      // Clean up test booking
      console.log('🧹 Cleaning up test booking...')
      await prisma.booking.delete({ where: { id: booking.id } })
      console.log('   ✅ Test booking removed\n')

    } catch (error: any) {
      console.log(`   ❌ Error creating booking: ${error.message}\n`)
    }
  }

  // Test 5: View database stats
  console.log('📊 Test 5: Database Statistics')
  const stats = await Promise.all([
    prisma.provider.count(),
    prisma.service.count(),
    prisma.availability.count(),
    prisma.booking.count(),
    prisma.blockedPeriod.count(),
  ])

  console.log(`   Providers: ${stats[0]}`)
  console.log(`   Services: ${stats[1]}`)
  console.log(`   Availability Rules: ${stats[2]}`)
  console.log(`   Bookings: ${stats[3]}`)
  console.log(`   Blocked Periods: ${stats[4]}\n`)

  console.log('✅ All tests completed!\n')
  console.log('🌐 Open http://localhost:3000 to view the application')
  console.log('📖 Next steps: See docs/IMPLEMENTATION_GUIDE.md to build the UI\n')
}

main()
  .catch((e) => {
    console.error('❌ Test error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
