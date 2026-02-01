import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a test provider (barber)
  const passwordHash = await bcrypt.hash('password123', 10)

  const provider = await prisma.provider.upsert({
    where: { username: 'johndoe' },
    update: {},
    create: {
      username: 'johndoe',
      email: 'john@example.com',
      passwordHash,
      fullName: 'John Doe',
      businessName: "John's Barbershop",
      description: 'Professional barber with 10 years of experience. Specializing in classic cuts and modern styles.',
      timezone: 'America/New_York',
    },
  })

  console.log('✅ Created provider:', provider.username)

  // Create services
  const haircut = await prisma.service.upsert({
    where: { id: provider.id + '-haircut' },
    update: {},
    create: {
      id: provider.id + '-haircut',
      providerId: provider.id,
      name: 'Haircut',
      description: 'Classic men\'s haircut',
      durationMinutes: 30,
      price: 25.00,
      bufferTimeMinutes: 5,
      isActive: true,
      displayOrder: 1,
    },
  })

  const haircutBeard = await prisma.service.upsert({
    where: { id: provider.id + '-haircut-beard' },
    update: {},
    create: {
      id: provider.id + '-haircut-beard',
      providerId: provider.id,
      name: 'Haircut & Beard Trim',
      description: 'Full service haircut with professional beard styling',
      durationMinutes: 45,
      price: 35.00,
      bufferTimeMinutes: 5,
      isActive: true,
      displayOrder: 2,
    },
  })

  const beardTrim = await prisma.service.upsert({
    where: { id: provider.id + '-beard' },
    update: {},
    create: {
      id: provider.id + '-beard',
      providerId: provider.id,
      name: 'Beard Trim',
      description: 'Professional beard trimming and styling',
      durationMinutes: 20,
      price: 15.00,
      bufferTimeMinutes: 5,
      isActive: true,
      displayOrder: 3,
    },
  })

  console.log('✅ Created services:', [haircut.name, haircutBeard.name, beardTrim.name].join(', '))

  // Create weekly availability (Monday-Friday 9AM-5PM, Saturday 10AM-3PM)
  const availabilityData = [
    // Monday
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
    // Tuesday
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
    // Wednesday
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
    // Thursday
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
    // Friday
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    // Saturday
    { dayOfWeek: 6, startTime: '10:00', endTime: '15:00' },
  ]

  for (const avail of availabilityData) {
    await prisma.availability.upsert({
      where: {
        providerId_dayOfWeek_startTime_endTime: {
          providerId: provider.id,
          dayOfWeek: avail.dayOfWeek,
          startTime: avail.startTime,
          endTime: avail.endTime,
        },
      },
      update: {},
      create: {
        providerId: provider.id,
        dayOfWeek: avail.dayOfWeek,
        startTime: avail.startTime,
        endTime: avail.endTime,
        isAvailable: true,
      },
    })
  }

  console.log('✅ Created availability schedule (Mon-Fri 9AM-5PM, Sat 10AM-3PM)')

  // Create a sample booking (for demo purposes)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(14, 0, 0, 0) // 2 PM tomorrow

  const bookingEnd = new Date(tomorrow)
  bookingEnd.setMinutes(bookingEnd.getMinutes() + haircut.durationMinutes)

  await prisma.booking.create({
    data: {
      providerId: provider.id,
      serviceId: haircut.id,
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPhone: '+1234567890',
      startTime: tomorrow,
      endTime: bookingEnd,
      status: 'confirmed',
      confirmedAt: new Date(),
      notes: 'First time customer',
    },
  })

  console.log('✅ Created sample booking for tomorrow at 2:00 PM')

  // Create a blocked period (example: lunch break every day)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(0, 0, 0, 0)

  const weekAfter = new Date(nextWeek)
  weekAfter.setDate(weekAfter.getDate() + 7)

  await prisma.blockedPeriod.create({
    data: {
      providerId: provider.id,
      startDatetime: nextWeek,
      endDatetime: weekAfter,
      reason: 'Summer vacation',
    },
  })

  console.log('✅ Created blocked period (vacation next week)')

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n📝 Test credentials:')
  console.log('   Username: johndoe')
  console.log('   Email: john@example.com')
  console.log('   Password: password123')
  console.log('\n🔗 Public booking page:')
  console.log('   http://localhost:3000/book/johndoe')
  console.log('\n📊 Services:')
  console.log(`   - ${haircut.name}: $${haircut.price} (${haircut.durationMinutes} min)`)
  console.log(`   - ${haircutBeard.name}: $${haircutBeard.price} (${haircutBeard.durationMinutes} min)`)
  console.log(`   - ${beardTrim.name}: $${beardTrim.price} (${beardTrim.durationMinutes} min)`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
