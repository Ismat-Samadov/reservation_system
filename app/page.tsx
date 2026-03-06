'use client'

import { useState } from 'react'
import Link from "next/link"
import { Calendar, Clock, Users, Zap, Shield, Globe, Menu, X } from "lucide-react"

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-7 w-7 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Randevu</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition text-sm">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition text-sm">How It Works</a>
              <Link href="/auth/signin" className="text-gray-600 hover:text-gray-900 transition text-sm">Sign In</Link>
              <Link href="/auth/signup" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                Get Started
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileNavOpen && (
            <div className="md:hidden pt-3 pb-2 border-t mt-3 space-y-1">
              <a href="#features" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Features</a>
              <a href="#how-it-works" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">How It Works</a>
              <Link href="/auth/signin" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Sign In</Link>
              <Link href="/auth/signup" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-center">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 md:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-5 leading-tight">
            Your Business, <span className="text-blue-600">Booked Solid</span>
          </h1>
          <p className="text-base sm:text-xl text-gray-600 mb-8 leading-relaxed">
            The all-in-one booking platform trusted by barbers, consultants, tutors, and service providers worldwide.
            Accept bookings 24/7 and grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="px-7 py-3.5 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg">
              Start Free Trial
            </Link>
            <Link href="/book/johndoe" className="px-7 py-3.5 bg-white text-blue-600 text-base font-semibold rounded-lg hover:bg-gray-50 transition border-2 border-blue-600">
              View Demo
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">No credit card required · Free 14-day trial</p>
        </div>

        {/* Stats */}
        <div className="max-w-3xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '10k+', label: 'Active Providers' },
            { value: '500k+', label: 'Bookings Made' },
            { value: '24/7', label: 'Availability' },
            { value: '99.9%', label: 'Uptime' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl sm:text-4xl font-bold text-blue-600">{value}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3">Everything You Need to Succeed</h2>
            <p className="text-base sm:text-xl text-gray-600">Powerful features designed for modern service providers</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-600', Icon: Calendar, title: 'Smart Scheduling', desc: 'Automated scheduling that prevents double-bookings and manages your availability intelligently.' },
              { bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-600', Icon: Clock, title: 'Real-Time Availability', desc: 'Customers see live availability and can book instantly without back-and-forth emails.' },
              { bg: 'bg-green-50', border: 'border-green-100', iconBg: 'bg-green-600', Icon: Users, title: 'Customer Management', desc: 'Keep track of all your clients, their booking history, and contact information in one place.' },
              { bg: 'bg-orange-50', border: 'border-orange-100', iconBg: 'bg-orange-600', Icon: Zap, title: 'Lightning Fast', desc: 'Built on modern technology for instant page loads and smooth booking experience.' },
              { bg: 'bg-red-50', border: 'border-red-100', iconBg: 'bg-red-600', Icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security with automatic backups and 99.9% uptime guarantee.' },
              { bg: 'bg-indigo-50', border: 'border-indigo-100', iconBg: 'bg-indigo-600', Icon: Globe, title: 'Global Timezone Support', desc: 'Automatically handles different timezones for you and your international clients.' },
            ].map(({ bg, border, iconBg, Icon, title, desc }) => (
              <div key={title} className={`p-5 rounded-xl ${bg} border ${border}`}>
                <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-base sm:text-xl text-gray-600">Get started in minutes, not hours</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            {[
              { n: 1, title: 'Create Your Account', desc: 'Sign up in seconds with your email. No credit card required for the trial period.' },
              { n: 2, title: 'Set Your Availability', desc: 'Define your working hours, services, and pricing. Add breaks and time off as needed.' },
              { n: 3, title: 'Share Your Booking Link', desc: 'Get a personalized booking page (e.g., randevu.az/yourname) to share with clients.' },
              { n: 4, title: 'Accept Bookings 24/7', desc: 'Clients book online anytime. You get instant notifications and an organized dashboard.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                  {n}
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">Ready to Grow Your Business?</h2>
          <p className="text-sm sm:text-xl text-blue-100 mb-8 max-w-xl mx-auto">
            Join thousands of professionals who trust Randevu to manage their bookings
          </p>
          <Link href="/auth/signup" className="inline-block px-7 py-3.5 bg-white text-blue-600 text-base font-semibold rounded-lg hover:bg-gray-100 transition shadow-lg">
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="text-lg font-bold text-white">Randevu</span>
              </div>
              <p className="text-xs">The modern booking platform for service providers</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="/book/johndoe" className="hover:text-white transition">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
            <p>&copy; 2026 Randevu. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
