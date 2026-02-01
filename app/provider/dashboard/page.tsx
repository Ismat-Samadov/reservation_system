'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Users, DollarSign, Settings, LogOut, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { format } from 'date-fns'

interface DashboardStats {
  todayBookings: number
  upcomingBookings: number
  monthlyBookings: number
  totalRevenue: string
  activeServices: number
  cancellationRate: string
  totalBookingsThisMonth: number
}

interface Booking {
  id: string
  customerName: string
  customerEmail: string
  startTime: string
  endTime: string
  status: string
  service: {
    name: string
    price: string | null
    currency: string
  }
}

export default function ProviderDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    upcomingBookings: 0,
    monthlyBookings: 0,
    totalRevenue: '0',
    activeServices: 0,
    cancellationRate: '0',
    totalBookingsThisMonth: 0,
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status, router])

  async function fetchDashboardData() {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/recent-bookings'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json()
        setRecentBookings(bookingsData.bookings)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                BookEasy
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-2">
            Welcome back, {session.user?.name}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '...' : stats.todayBookings}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Active today
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '...' : stats.upcomingBookings}
                </p>
                <p className="text-xs text-gray-500 mt-1">Future bookings</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue (Month)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${loading ? '...' : stats.totalRevenue}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {loading ? '...' : stats.monthlyBookings} bookings
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Services</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? '...' : stats.activeServices}
                </p>
                <p className="text-xs text-gray-500 mt-1">Services offered</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Monthly Performance</p>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.totalBookingsThisMonth}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total bookings this month</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Cancellation Rate</p>
              {parseFloat(stats.cancellationRate) > 20 ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '...' : `${stats.cancellationRate}%`}
            </p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm p-6 text-white">
            <p className="text-sm font-medium text-blue-100 mb-2">
              Share Your Page
            </p>
            <p className="text-xs text-blue-100 mb-3">
              Get more bookings by sharing your link
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={() => {
                const url = `${window.location.origin}/book/${session?.user?.email?.split('@')[0]}`
                navigator.clipboard.writeText(url)
                alert('Booking link copied to clipboard!')
              }}
            >
              Copy Booking Link
            </Button>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Bookings</h3>
            <Link href="/provider/bookings">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No bookings yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Share your booking page to start receiving appointments
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-gray-900">
                        {booking.customerName}
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{booking.service.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(booking.startTime), 'PPp')}
                    </p>
                  </div>
                  <div className="text-right">
                    {booking.service.price && (
                      <p className="font-semibold text-gray-900">
                        ${booking.service.price}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">{booking.customerEmail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/provider/bookings">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <Calendar className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                View Bookings
              </h3>
              <p className="text-sm text-gray-600">
                Manage your appointments and schedules
              </p>
            </div>
          </Link>

          <Link href="/provider/services">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <Settings className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Manage Services
              </h3>
              <p className="text-sm text-gray-600">
                Add, edit, or remove your services
              </p>
            </div>
          </Link>

          <Link href="/provider/availability">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <Clock className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Set Availability
              </h3>
              <p className="text-sm text-gray-600">
                Configure your working hours and breaks
              </p>
            </div>
          </Link>

          <Link href="/provider/profile">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <Users className="h-8 w-8 text-orange-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Edit Profile
              </h3>
              <p className="text-sm text-gray-600">
                Update your profile and business information
              </p>
            </div>
          </Link>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm p-6 text-white col-span-1 md:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-semibold mb-2">Your Booking Page</h3>
            <p className="text-sm text-blue-100 mb-4">
              Share this link with your clients
            </p>
            <div className="bg-white/20 rounded-lg p-2 text-sm break-all">
              {`${window.location.origin}/book/${session.user?.email?.split('@')[0]}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
