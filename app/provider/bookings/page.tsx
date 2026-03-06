'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, ChevronRight, Check, X, UserMinus } from 'lucide-react'
import { format } from 'date-fns'

interface Booking {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  startTime: string
  endTime: string
  status: string
  notes: string | null
  service: { name: string; price: string | null; currency: string }
}

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
]

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

export default function BookingsPage() {
  const [tab, setTab] = useState('upcoming')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [tab])

  async function fetchBookings() {
    setLoading(true)
    try {
      const res = await fetch(`/api/provider/bookings?tab=${tab}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings)
      }
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    setActionLoading(id + status)
    try {
      const res = await fetch(`/api/provider/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) fetchBookings()
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-gray-900">Bookings</h1>
        <p className="text-xs text-gray-400 mt-0.5">View and manage your appointments</p>
      </header>

      <main className="p-4 sm:p-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <Calendar className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">No bookings found</p>
              <p className="text-xs text-gray-400 mt-1">
                {tab === 'upcoming'
                  ? 'Your upcoming appointments will appear here'
                  : 'No bookings match this filter'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Customer', 'Service', 'Date & Time', 'Status', 'Amount', 'Actions'].map((h, i) => (
                      <th
                        key={h}
                        className={`text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3 ${
                          i >= 4 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-900">{b.customerName}</p>
                        <p className="text-xs text-gray-400">{b.customerEmail}</p>
                        {b.customerPhone && (
                          <p className="text-xs text-gray-400">{b.customerPhone}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-700">{b.service.name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-gray-700">
                          {format(new Date(b.startTime), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(b.startTime), 'h:mm a')} – {format(new Date(b.endTime), 'h:mm a')}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {b.service.price
                            ? `${b.service.price} ${b.service.currency}`
                            : <span className="text-gray-300">—</span>}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(b.status === 'confirmed' || b.status === 'pending') && (
                            <>
                              <button
                                onClick={() => updateStatus(b.id, 'completed')}
                                disabled={!!actionLoading}
                                title="Mark as completed"
                                className="p-1.5 rounded-md hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => updateStatus(b.id, 'no_show')}
                                disabled={!!actionLoading}
                                title="Mark as no-show"
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => updateStatus(b.id, 'cancelled')}
                                disabled={!!actionLoading}
                                title="Cancel booking"
                                className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
