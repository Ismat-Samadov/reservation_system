'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Copy,
  ExternalLink,
  UserCircle,
  ChevronRight,
} from 'lucide-react'
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
  service: { name: string; price: string | null; currency: string }
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  no_show: 'bg-gray-100 text-gray-600',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
}: {
  title: string
  value: string | number
  sub: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
        {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
    </div>
  )
}

export default function ProviderDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    upcomingBookings: 0,
    monthlyBookings: 0,
    totalRevenue: '0.00',
    activeServices: 0,
    cancellationRate: '0',
    totalBookingsThisMonth: 0,
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/recent-bookings'),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setRecentBookings(data.bookings)
      }
    } finally {
      setLoading(false)
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/book/${session?.user?.username}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const username = session?.user?.username ?? ''
  const cancellationHigh = parseFloat(stats.cancellationRate) > 20

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/book/${username}`} target="_blank">
            <Button variant="outline" size="sm" className="text-xs">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Booking Page
            </Button>
          </Link>
          <Button size="sm" onClick={copyLink} className="text-xs bg-blue-600 hover:bg-blue-700">
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </div>
      </header>

      <main className="p-4 sm:p-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            title="Today's Bookings"
            value={loading ? '—' : stats.todayBookings}
            sub="Active appointments"
            icon={Calendar}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            trend="up"
          />
          <StatCard
            title="Upcoming"
            value={loading ? '—' : stats.upcomingBookings}
            sub="Future bookings"
            icon={Clock}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            title="Revenue This Month"
            value={loading ? '—' : `$${stats.totalRevenue}`}
            sub={`${stats.monthlyBookings} paid bookings`}
            icon={DollarSign}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            trend="up"
          />
          <StatCard
            title="Active Services"
            value={loading ? '—' : stats.activeServices}
            sub="Services offered"
            icon={Package}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
          />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Bookings table */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Recent Bookings</h2>
                <p className="text-xs text-gray-400 mt-0.5">Latest appointments across all services</p>
              </div>
              <Link href="/provider/bookings">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                  View All <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                <Calendar className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-500">No bookings yet</p>
                <p className="text-xs text-gray-400 mt-1">Share your booking page to start receiving appointments</p>
                <Button size="sm" onClick={copyLink} className="mt-4 bg-blue-600 text-xs">
                  Copy Booking Link
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Customer', 'Service', 'Date & Time', 'Status', 'Amount'].map((h, i) => (
                        <th
                          key={h}
                          className={`text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 ${i === 4 ? 'text-right' : 'text-left'}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentBookings.slice(0, 8).map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-900">{b.customerName}</p>
                          <p className="text-xs text-gray-400">{b.customerEmail}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-gray-700">{b.service.name}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-gray-700">
                            {format(new Date(b.startTime), 'MMM d, h:mm a')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {b.service.price ? `$${b.service.price}` : <span className="text-gray-300">—</span>}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Month summary */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Month Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Total Bookings</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '—' : stats.totalBookingsThisMonth}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Confirmed</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '—' : stats.monthlyBookings}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Revenue</span>
                  <span className="text-sm font-semibold text-gray-900">{loading ? '—' : `$${stats.totalRevenue}`}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">Cancellation Rate</span>
                  <div className="flex items-center gap-1.5">
                    {cancellationHigh ? (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                    )}
                    <span className={`text-sm font-semibold ${cancellationHigh ? 'text-red-600' : 'text-green-600'}`}>
                      {loading ? '—' : `${stats.cancellationRate}%`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-1">
                {[
                  { href: '/provider/services', icon: Package, label: 'Manage Services', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { href: '/provider/availability', icon: Clock, label: 'Set Availability', color: 'text-green-600', bg: 'bg-green-50' },
                  { href: '/provider/profile', icon: UserCircle, label: 'Edit Profile', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { href: '/provider/bookings', icon: Calendar, label: 'All Bookings', color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map(({ href, icon: Icon, label, color, bg }) => (
                  <Link key={href} href={href}>
                    <div className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                      <div className={`p-1.5 rounded-md ${bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${color}`} />
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 ml-auto group-hover:text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Booking link */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-sm">
              <p className="text-sm font-semibold mb-1">Your Booking Link</p>
              <p className="text-blue-200 text-xs mb-3">Share this with clients</p>
              <div className="bg-white/10 rounded-lg px-3 py-2 text-xs font-mono text-blue-100 break-all mb-3">
                {typeof window !== 'undefined'
                  ? `${window.location.origin}/book/${username}`
                  : `/book/${username}`}
              </div>
              <Button
                size="sm"
                onClick={copyLink}
                className="w-full bg-white/20 hover:bg-white/30 border-0 text-white text-xs"
                variant="outline"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
