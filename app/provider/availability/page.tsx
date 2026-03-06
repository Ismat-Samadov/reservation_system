'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'

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
    isAvailable: i >= 1 && i <= 5,
  }))
}

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchAvailability()
  }, [])

  async function fetchAvailability() {
    try {
      const res = await fetch('/api/provider/availability')
      if (!res.ok) throw new Error('Failed to load')
      const data: Array<{ dayOfWeek: number; startTime: string; endTime: string }> = await res.json()

      if (data.length > 0) {
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

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Availability</h1>
          <p className="text-xs text-gray-400 mt-0.5">Set your working hours for each day</p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          {saving ? (
            'Saving...'
          ) : (
            <>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Changes
            </>
          )}
        </Button>
      </header>

      <main className="p-4 sm:p-8">
        <div className="max-w-2xl">
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

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              {schedule.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className={`flex flex-wrap sm:flex-nowrap items-center gap-3 p-4 transition-colors ${
                    !day.isAvailable ? 'opacity-50 bg-gray-50/50' : ''
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
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>

                  {/* Day Name */}
                  <div className="w-24 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">{DAYS[day.dayOfWeek]}</p>
                    {!day.isAvailable && <p className="text-xs text-gray-400">Closed</p>}
                  </div>

                  {/* Time Inputs */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <input
                      type="time"
                      value={day.startTime}
                      disabled={!day.isAvailable}
                      onChange={(e) => updateDay(day.dayOfWeek, 'startTime', e.target.value)}
                      className="w-32 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <input
                      type="time"
                      value={day.endTime}
                      disabled={!day.isAvailable}
                      onChange={(e) => updateDay(day.dayOfWeek, 'endTime', e.target.value)}
                      className="w-32 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
