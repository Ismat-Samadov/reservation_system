'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, DollarSign, ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format, addDays, startOfDay, isBefore } from 'date-fns'

interface Provider {
  id: string
  fullName: string
  businessName: string | null
  description: string | null
  avatarUrl: string | null
  timezone: string
}

interface Service {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: string | null
  currency: string
}

interface TimeSlot {
  startTime: string
  endTime: string
  available: boolean
}

type Step = 'services' | 'date' | 'slots' | 'form' | 'confirmed'

export default function PublicBookingPage() {
  const params = useParams()
  const username = params.username as string

  const [provider, setProvider] = useState<Provider | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Booking flow state
  const [step, setStep] = useState<Step>('services')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()))
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null)

  useEffect(() => {
    async function loadProvider() {
      try {
        const response = await fetch(`/api/providers/${username}`)
        if (!response.ok) throw new Error('Provider not found')
        const data = await response.json()
        setProvider(data.provider)
        setServices(data.services)
      } catch (err: any) {
        setError(err.message || 'Failed to load provider')
      } finally {
        setLoading(false)
      }
    }
    loadProvider()
  }, [username])

  async function loadSlots(date: Date, service: Service) {
    if (!provider) return
    setSlotsLoading(true)
    setSlots([])
    setSelectedSlot(null)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const res = await fetch(
        `/api/public/availability?providerId=${provider.id}&serviceId=${service.id}&date=${dateStr}`
      )
      if (!res.ok) throw new Error('Failed to fetch slots')
      const data: TimeSlot[] = await res.json()
      setSlots(data.filter((s) => s.available))
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  function handleSelectService(service: Service) {
    setSelectedService(service)
    setSelectedDate(startOfDay(new Date()))
    setStep('date')
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date)
    setStep('slots')
    loadSlots(date, selectedService!)
  }

  function handleSelectSlot(slot: TimeSlot) {
    setSelectedSlot(slot)
    setStep('form')
    setBookingError('')
  }

  async function handleSubmitBooking(e: React.FormEvent) {
    e.preventDefault()
    if (!provider || !selectedService || !selectedSlot) return
    setBookingError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: provider.id,
          serviceId: selectedService.id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          customerName: bookingForm.customerName,
          customerEmail: bookingForm.customerEmail,
          customerPhone: bookingForm.customerPhone || undefined,
          notes: bookingForm.notes || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Booking failed')
      }

      setConfirmedBooking(data)
      setStep('confirmed')
    } catch (err: any) {
      setBookingError(err.message || 'Failed to create booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetBooking() {
    setStep('services')
    setSelectedService(null)
    setSelectedSlot(null)
    setSlots([])
    setBookingForm({ customerName: '', customerEmail: '', customerPhone: '', notes: '' })
    setBookingError('')
    setConfirmedBooking(null)
  }

  function getInitials() {
    if (!provider) return ''
    return provider.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate next 30 days for date picker
  const today = startOfDay(new Date())
  const dateOptions = Array.from({ length: 30 }, (_, i) => addDays(today, i))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Provider Not Found</h1>
          <p className="text-gray-600 mb-8">The booking page you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/"><Button>Go Home</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Randevu
            </h1>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">

          {/* Provider Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-3 border-4 border-white">
                  <AvatarImage src={provider.avatarUrl || undefined} alt={provider.fullName} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-white">{provider.fullName}</h2>
                {provider.businessName && (
                  <p className="text-blue-100 mt-1">{provider.businessName}</p>
                )}
              </div>
            </div>
            {provider.description && (
              <div className="px-8 py-4 border-b">
                <p className="text-gray-600 text-center text-sm">{provider.description}</p>
              </div>
            )}
          </div>

          {/* Step: Confirmed */}
          {step === 'confirmed' && confirmedBooking && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
              <p className="text-gray-600 mb-6">
                Your appointment has been booked. A confirmation has been sent to your email.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 mb-6 text-sm">
                <p><span className="font-medium text-gray-700">Service:</span> {selectedService?.name}</p>
                <p>
                  <span className="font-medium text-gray-700">Date & Time:</span>{' '}
                  {new Date(confirmedBooking.startTime).toLocaleString([], {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </p>
                <p><span className="font-medium text-gray-700">Name:</span> {confirmedBooking.customerName}</p>
                <p><span className="font-medium text-gray-700">Email:</span> {confirmedBooking.customerEmail}</p>
              </div>
              <Button onClick={resetBooking} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                Book Another Appointment
              </Button>
            </div>
          )}

          {/* Step: Services */}
          {step === 'services' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Select a Service</h3>
              {services.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Services Available</h4>
                  <p className="text-gray-600">This provider hasn&apos;t added any services yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleSelectService(service)}
                      className="w-full bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all text-left"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{service.name}</h4>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          )}
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                            <Clock className="h-3.5 w-3.5" />
                            {service.durationMinutes} minutes
                          </div>
                        </div>
                        {service.price && (
                          <div className="flex items-center gap-1 text-blue-600 font-semibold text-lg flex-shrink-0">
                            <DollarSign className="h-4 w-4" />
                            {service.price}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Date */}
          {step === 'date' && selectedService && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setStep('services')} className="text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h3 className="text-xl font-bold text-gray-900">Select a Date</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Service: <span className="font-medium text-gray-700">{selectedService.name}</span>
              </p>

              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                {dateOptions.map((date) => {
                  const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
                  const isPast = isBefore(date, today)
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => !isPast && handleSelectDate(date)}
                      disabled={isPast}
                      className={`py-2 px-1 rounded-xl text-center border transition-all ${
                        isPast
                          ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                          : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-sm cursor-pointer'
                      }`}
                    >
                      <div className="text-xs text-gray-500">{format(date, 'EEE')}</div>
                      <div className={`text-base font-bold mt-0.5 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {format(date, 'd')}
                      </div>
                      <div className="text-xs text-gray-500">{format(date, 'MMM')}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step: Slots */}
          {step === 'slots' && selectedService && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setStep('date')} className="text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Select a Time</h3>
                  <p className="text-sm text-gray-500">
                    {format(selectedDate, 'EEEE, MMMM d')} · {selectedService.name}
                  </p>
                </div>
              </div>

              {slotsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-3">Loading available times...</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-700 mb-1">No Available Times</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    No slots available on this day. Try a different date.
                  </p>
                  <Button variant="outline" onClick={() => setStep('date')}>
                    Choose Another Date
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.startTime}
                      onClick={() => handleSelectSlot(slot)}
                      className="bg-white border border-gray-200 rounded-lg py-3 px-2 text-center hover:border-blue-400 hover:bg-blue-50 transition-all font-medium text-gray-900 text-sm"
                    >
                      {new Date(slot.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Booking Form */}
          {step === 'form' && selectedService && selectedSlot && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setStep('slots')} className="text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h3 className="text-xl font-bold text-gray-900">Your Details</h3>
              </div>

              {/* Booking Summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm">
                <p className="font-medium text-blue-900 mb-1">{selectedService.name}</p>
                <p className="text-blue-700">
                  {format(selectedDate, 'EEEE, MMMM d')} at{' '}
                  {new Date(selectedSlot.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-blue-600 mt-1">{selectedService.durationMinutes} minutes</p>
                {selectedService.price && (
                  <p className="text-blue-700 font-semibold mt-1">
                    {selectedService.price} {selectedService.currency}
                  </p>
                )}
              </div>

              {bookingError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {bookingError}
                </div>
              )}

              <form onSubmit={handleSubmitBooking} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm((f) => ({ ...f, customerName: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={bookingForm.customerEmail}
                    onChange={(e) => setBookingForm((f) => ({ ...f, customerEmail: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={bookingForm.customerPhone}
                    onChange={(e) => setBookingForm((f) => ({ ...f, customerPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="+1 555 000 0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    rows={2}
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Any special requests..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-3"
                >
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
