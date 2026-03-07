'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, Calendar,
  CheckCircle, XCircle, UserX, Users, Clock,
} from 'lucide-react'

type Range = '7d' | '30d' | '90d' | 'all'

interface Overview {
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  noShowBookings: number
  upcomingBookings: number
  totalRevenue: string
  avgBookingValue: string
  completionRate: string
  cancellationRate: string
  noShowRate: string
}

interface TimelinePoint { date: string; revenue: number; bookings: number }
interface StatusPoint   { status: string; count: number }
interface ServicePoint  { name: string; bookings: number; revenue: number }
interface CustomerPoint { name: string; email: string; bookings: number; spent: number }
interface DowPoint      { day: string; count: number }
interface HourPoint     { hour: number; count: number }

interface AnalyticsData {
  overview: Overview
  revenueTimeline: TimelinePoint[]
  statusBreakdown: StatusPoint[]
  topServices: ServicePoint[]
  topCustomers: CustomerPoint[]
  byDayOfWeek: DowPoint[]
  byHour: HourPoint[]
}

const STATUS_COLORS: Record<string, string> = {
  completed:  'bg-emerald-500',
  confirmed:  'bg-blue-500',
  pending:    'bg-amber-400',
  cancelled:  'bg-red-400',
  no_show:    'bg-gray-400',
}
const STATUS_LABEL: Record<string, string> = {
  completed: 'Completed', confirmed: 'Confirmed',
  pending: 'Pending', cancelled: 'Cancelled', no_show: 'No-show',
}

const RANGES: { label: string; value: Range }[] = [
  { label: '7 Days',   value: '7d' },
  { label: '30 Days',  value: '30d' },
  { label: '90 Days',  value: '90d' },
  { label: 'All Time', value: 'all' },
]

function fmt(n: string | number) {
  return `$${parseFloat(String(n)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function BarChart({
  data, valueKey, labelKey, color = 'bg-blue-500', height = 160,
}: {
  data: Record<string, number | string>[]
  valueKey: string
  labelKey: string
  color?: string
  height?: number
}) {
  const values = data.map(d => Number(d[valueKey]))
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-px w-full" style={{ height }}>
      {data.map((d, i) => {
        const pct = (Number(d[valueKey]) / max) * 100
        return (
          <div key={i} className="relative flex-1 flex flex-col items-center justify-end group h-full">
            <div
              className={`w-full rounded-sm ${color} transition-all`}
              style={{ height: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
            />
            {/* Tooltip */}
            {Number(d[valueKey]) > 0 && (
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] rounded px-1.5 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 shadow-lg">
                <span className="font-semibold">{d[labelKey]}</span>
                <br />
                {typeof d[valueKey] === 'number' && (d[valueKey] as number) % 1 !== 0
                  ? fmt(d[valueKey])
                  : d[valueKey]}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function HorizBar({ label, value, max, color, sub }: { label: string; value: number; max: number; color: string; sub?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-24 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-10 text-right flex-shrink-0">{sub ?? value}</span>
    </div>
  )
}

function KpiCard({
  label, value, sub, icon: Icon, iconBg, iconColor, trend,
}: {
  label: string; value: string | number; sub: string
  icon: React.ElementType; iconBg: string; iconColor: string; trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        {trend === 'up'   && <TrendingUp  className="h-3 w-3 text-emerald-500" />}
        {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-400" />}
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>('30d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/provider/analytics?range=${range}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { load() }, [load])

  const ov = data?.overview

  // Revenue timeline — for 90d/all, group by week to keep bars readable
  const timelineData = (() => {
    if (!data) return []
    const tl = data.revenueTimeline
    if (range === '7d' || range === '30d') {
      return tl.map(d => ({
        label: new Date(d.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: d.revenue,
        bookings: d.bookings,
      }))
    }
    // Group by week
    const weeks: { label: string; revenue: number; bookings: number }[] = []
    for (let i = 0; i < tl.length; i += 7) {
      const slice = tl.slice(i, i + 7)
      const revenue = slice.reduce((s, x) => s + x.revenue, 0)
      const bookings = slice.reduce((s, x) => s + x.bookings, 0)
      const d = new Date(slice[0].date + 'T00:00')
      weeks.push({ label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue, bookings })
    }
    return weeks
  })()

  const maxService  = Math.max(...(data?.topServices.map(s => s.bookings) ?? [1]))
  const maxCustomer = Math.max(...(data?.topCustomers.map(c => c.bookings) ?? [1]))
  const maxDow      = Math.max(...(data?.byDayOfWeek.map(d => d.count) ?? [1]))

  const totalForStatus = data?.statusBreakdown.reduce((s, x) => s + x.count, 0) ?? 1

  // X-axis labels for timeline (show every Nth)
  const labelStep = range === '7d' ? 1 : range === '30d' ? 5 : 2

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">Customer engagement &amp; business performance</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                range === r.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 sm:p-8 space-y-6">

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            label="Total Revenue"
            value={loading ? '—' : fmt(ov?.totalRevenue ?? 0)}
            sub="From completed bookings"
            icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600"
            trend="up"
          />
          <KpiCard
            label="Total Bookings"
            value={loading ? '—' : ov?.totalBookings ?? 0}
            sub={`${ov?.upcomingBookings ?? 0} upcoming`}
            icon={Calendar} iconBg="bg-blue-50" iconColor="text-blue-600"
          />
          <KpiCard
            label="Avg Booking Value"
            value={loading ? '—' : fmt(ov?.avgBookingValue ?? 0)}
            sub="Per completed session"
            icon={TrendingUp} iconBg="bg-violet-50" iconColor="text-violet-600"
            trend="up"
          />
          <KpiCard
            label="Completion Rate"
            value={loading ? '—' : `${ov?.completionRate ?? 0}%`}
            sub={`${ov?.cancellationRate ?? 0}% cancelled`}
            icon={CheckCircle} iconBg="bg-orange-50" iconColor="text-orange-500"
            trend={parseFloat(ov?.completionRate ?? '0') >= 70 ? 'up' : 'down'}
          />
        </div>

        {/* Revenue chart + Status breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Revenue bar chart */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Revenue Over Time</h2>
                <p className="text-xs text-gray-400 mt-0.5">Daily revenue from completed bookings</p>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {loading ? '—' : fmt(ov?.totalRevenue ?? 0)}
              </span>
            </div>

            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <BarChart
                    data={timelineData.map(d => ({ label: d.label, value: d.revenue }))}
                    valueKey="value"
                    labelKey="label"
                    color="bg-blue-500"
                    height={160}
                  />
                </div>
                {/* X-axis labels */}
                <div className="flex mt-1">
                  {timelineData.map((d, i) => (
                    <div key={i} className="flex-1 text-center">
                      {i % labelStep === 0 && (
                        <span className="text-[9px] text-gray-400">{d.label}</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Status breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Booking Status</h2>
            <p className="text-xs text-gray-400 mb-5">Distribution across all bookings</p>

            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : (
              <>
                {/* Stacked bar */}
                <div className="flex h-4 rounded-full overflow-hidden mb-5 gap-px">
                  {data?.statusBreakdown
                    .sort((a, b) => b.count - a.count)
                    .map(s => (
                      <div
                        key={s.status}
                        className={`${STATUS_COLORS[s.status] ?? 'bg-gray-300'} transition-all`}
                        style={{ width: `${(s.count / totalForStatus) * 100}%` }}
                        title={`${STATUS_LABEL[s.status] ?? s.status}: ${s.count}`}
                      />
                    ))}
                </div>

                {/* Legend */}
                <div className="space-y-2.5">
                  {data?.statusBreakdown
                    .sort((a, b) => b.count - a.count)
                    .map(s => (
                      <div key={s.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[s.status] ?? 'bg-gray-300'}`} />
                          <span className="text-xs text-gray-600">{STATUS_LABEL[s.status] ?? s.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-900">{s.count}</span>
                          <span className="text-[10px] text-gray-400 w-8 text-right">
                            {((s.count / totalForStatus) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Mini KPIs */}
                <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                  {[
                    { icon: CheckCircle, val: `${ov?.completionRate}%`,   label: 'Done',    color: 'text-emerald-600' },
                    { icon: XCircle,     val: `${ov?.cancellationRate}%`, label: 'Cancelled', color: 'text-red-400' },
                    { icon: UserX,       val: `${ov?.noShowRate}%`,       label: 'No-show',  color: 'text-gray-400' },
                  ].map(({ icon: Icon, val, label, color }) => (
                    <div key={label}>
                      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
                      <p className="text-sm font-bold text-gray-900">{val}</p>
                      <p className="text-[10px] text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bookings per day chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Booking Volume</h2>
            <p className="text-xs text-gray-400 mt-0.5">Number of bookings per day</p>
          </div>
          {loading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <BarChart
                data={timelineData.map(d => ({ label: d.label, value: d.bookings }))}
                valueKey="value"
                labelKey="label"
                color="bg-indigo-400"
                height={80}
              />
              <div className="flex mt-1">
                {timelineData.map((d, i) => (
                  <div key={i} className="flex-1 text-center">
                    {i % labelStep === 0 && (
                      <span className="text-[9px] text-gray-400">{d.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top services + Top customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Top services */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Top Services</h2>
            <p className="text-xs text-gray-400 mb-5">By number of bookings</p>
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : data?.topServices.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {data?.topServices.map(s => (
                  <div key={s.name}>
                    <HorizBar
                      label={s.name}
                      value={s.bookings}
                      max={maxService}
                      color="bg-blue-500"
                      sub={String(s.bookings)}
                    />
                    <div className="flex justify-between mt-0.5 px-0">
                      <span className="text-[10px] text-gray-400 pl-27" style={{ paddingLeft: '6.5rem' }}>
                        {s.bookings} booking{s.bookings !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] font-medium text-emerald-600">{fmt(s.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top customers */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Top Customers</h2>
            <p className="text-xs text-gray-400 mb-5">By number of visits</p>
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : data?.topCustomers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-2.5">
                {data?.topCustomers.map((c, i) => (
                  <div key={c.email} className="flex items-center gap-3">
                    {/* Rank badge */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-gray-100 text-gray-600' :
                      i === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-400'
                    }`}>
                      {i + 1}
                    </div>
                    {/* Avatar initials */}
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{c.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{c.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-gray-900">{c.bookings} visit{c.bookings !== 1 ? 's' : ''}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">{fmt(c.spent)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Busiest days + Busiest hours */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* By day of week */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Busiest Days</h2>
            </div>
            <p className="text-xs text-gray-400 mb-5">Total bookings by day of week</p>
            {loading ? (
              <div className="h-28 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="space-y-2.5">
                {data?.byDayOfWeek.map(d => (
                  <HorizBar
                    key={d.day}
                    label={d.day}
                    value={d.count}
                    max={maxDow}
                    color="bg-violet-500"
                    sub={String(d.count)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* By hour */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Busiest Hours</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">Bookings by time of day</p>
            {loading ? (
              <div className="h-28 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : (
              <>
                <BarChart
                  data={(data?.byHour ?? []).map(h => ({
                    label: `${h.hour % 12 || 12}${h.hour < 12 ? 'am' : 'pm'}`,
                    value: h.count,
                  }))}
                  valueKey="value"
                  labelKey="label"
                  color="bg-emerald-500"
                  height={100}
                />
                <div className="flex mt-1">
                  {(data?.byHour ?? []).map((h, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[9px] text-gray-400">
                        {`${h.hour % 12 || 12}${h.hour < 12 ? 'a' : 'p'}`}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Customer stats summary */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Customer Engagement Summary</h2>
          </div>
          {loading ? (
            <div className="h-16 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Unique Customers',  value: data?.topCustomers.length ?? 0,               sub: 'in selected period' },
                { label: 'Completed',         value: ov?.completedBookings ?? 0,                   sub: 'appointments' },
                { label: 'Cancelled',         value: ov?.cancelledBookings ?? 0,                   sub: `+ ${ov?.noShowBookings ?? 0} no-show` },
                { label: 'Avg Revenue / Visit', value: fmt(ov?.avgBookingValue ?? 0),              sub: 'per session' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="text-center py-3 px-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs font-medium text-gray-700 mt-0.5">{label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
