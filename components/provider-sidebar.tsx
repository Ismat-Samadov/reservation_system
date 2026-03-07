'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Calendar,
  Settings2,
  Clock,
  UserCircle,
  LogOut,
  ExternalLink,
  Menu,
  X,
  BarChart2,
} from 'lucide-react'

const NAV = [
  { href: '/provider/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/provider/bookings',   icon: Calendar,        label: 'Bookings' },
  { href: '/provider/analytics',  icon: BarChart2,       label: 'Analytics' },
  { href: '/provider/services',   icon: Settings2,       label: 'Services' },
  { href: '/provider/availability', icon: Clock,         label: 'Availability' },
  { href: '/provider/profile',    icon: UserCircle,      label: 'Profile' },
]

interface Props {
  name: string
  email: string
  username: string
}

export default function ProviderSidebar({ name, email, username }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const navContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800/60">
        <Link href="/provider/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-900/40">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight">Randevu</span>
            <p className="text-gray-600 text-[10px] leading-none mt-0.5">Provider Portal</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
              }`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500'}`} />
              {label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-300" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1">
        <Link
          href={`/book/${username}`}
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-blue-400 hover:bg-gray-800/70 rounded-xl text-xs transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Booking Page
        </Link>

        <div className="border-t border-gray-800/60 pt-3 mt-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-800/40 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{name}</p>
              <p className="text-gray-600 text-[10px] truncate">{email}</p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-gray-500 hover:text-red-400 hover:bg-red-950/30 rounded-xl text-sm transition-colors mt-0.5"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-60 bg-gray-950 min-h-screen flex-col fixed left-0 top-0 z-20 border-r border-gray-800 hidden lg:flex">
        {navContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 py-3">
        <Link href="/provider/dashboard">
          <span className="text-lg font-bold text-white tracking-tight">Randevu</span>
        </Link>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-60 bg-gray-950 flex flex-col border-r border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}
