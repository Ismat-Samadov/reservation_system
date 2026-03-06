'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, Save } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface DaySchedule {
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

function defaultSchedule(): DaySchedule[] {
  return DAYS.map((_, i) => ({
    dayOfWeek: i,
    startTime: '09:00',
    endTime: '17:00',
    // Mon-Fri available by default, Sat-Sun off
    isAvailable: i >= 1 && i <= 5,
  }))
}

export default function AvailabilityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchAvailability()
    }
  }, [status, router])

  async function fetchAvailability() {
    try {
      const res = await fetch('/api/provider/availability')
      if (!res.ok) throw new Error('Failed to load')
      const data: Array<{ dayOfWeek: number; startTime: string; endTime: string }> = await res.json()

      if (data.length > 0) {
        // Merge DB data into the default schedule
        setSchedule(
          defaultSchedule().map((day) => {
            const saved = data.find((d) => d.dayOfWeek === day.dayOfWeek)
            if (saved) {
              return { ...day, startTime: saved.startTime, endTime: saved.endTime, isAvailable: true }
            }
            return { ...day, isAvailable: false }
          })
        )
      }
    } catch {
      setError('Failed to load availability. Using defaults.')
    } finally {
      setLoading(false)
    }
  }

  function updateDay(dayOfWeek: number, field: keyof DaySchedule, value: string | boolean) {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    )
  }

  async function handleSave() {
    setError('')
    setSuccess('')

    // Validate times
    for (const day of schedule) {
      if (day.isAvailable && day.startTime >= day.endTime) {
        setError(`${DAYS[day.dayOfWeek]}: start time must be before end time`)
        return
      }
    }

    setSaving(true)
    try {
      const res = await fetch('/api/provider/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      setSuccess('Availability saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/provider/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Set Availability</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Your Working Hours</h2>
            <p className="text-gray-600 mt-2">
              Toggle days on/off and set your working hours for each day.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              {success}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {schedule.map((day) => (
              <div
                key={day.dayOfWeek}
                className={`flex items-center gap-4 p-4 transition-colors ${
                  !day.isAvailable ? 'opacity-50 bg-gray-50' : ''
                }`}
              >
                {/* Toggle */}
                <label className="flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={day.isAvailable}
                    onChange={(e) => updateDay(day.dayOfWeek, 'isAvailable', e.target.checked)}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>

                {/* Day Name */}
                <div className="w-28 flex-shrink-0">
                  <p className="font-medium text-gray-900">{DAYS[day.dayOfWeek]}</p>
                  {!day.isAvailable && <p className="text-xs text-gray-400">Closed</p>}
                </div>

                {/* Time Inputs */}
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={day.startTime}
                    disabled={!day.isAvailable}
                    onChange={(e) => updateDay(day.dayOfWeek, 'startTime', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="time"
                    value={day.endTime}
                    disabled={!day.isAvailable}
                    onChange={(e) => updateDay(day.dayOfWeek, 'endTime', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-3"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Availability
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
