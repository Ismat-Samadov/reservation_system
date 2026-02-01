'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock, Mail, Phone } from 'lucide-react'

export default function BookingsPage() {
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
            <h1 className="text-2xl font-bold">My Bookings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">All Bookings</h2>
            <p className="text-gray-600 mt-2">
              View and manage your appointments
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button variant="default">Upcoming</Button>
            <Button variant="outline">Past</Button>
            <Button variant="outline">Cancelled</Button>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No bookings yet
              </h3>
              <p className="text-gray-600 mb-6">
                Your upcoming appointments will appear here. Share your booking
                page with clients to start receiving bookings.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/provider/services">
                  <Button variant="outline">Add Services</Button>
                </Link>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  Share Booking Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
