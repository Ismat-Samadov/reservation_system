'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock } from 'lucide-react'

export default function AvailabilityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]

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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Your Working Hours
            </h2>
            <p className="text-gray-600 mt-2">
              Set your weekly schedule and availability
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-4">
            {days.map((day, index) => (
              <div
                key={day}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-32">
                    <p className="font-medium text-gray-900">{day}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      defaultValue="09:00"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      defaultValue="17:00"
                    />
                  </div>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked={index !== 0 && index !== 6}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}

            <div className="pt-6 border-t">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                <Clock className="mr-2 h-4 w-4" />
                Save Availability
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
