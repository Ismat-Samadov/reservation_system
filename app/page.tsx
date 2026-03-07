'use client'

import { useState } from 'react'
import Link from "next/link"
import { Calendar, Clock, Users, Zap, Shield, Globe, Menu, X, Smartphone, Download, Star, CheckCircle } from "lucide-react"

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-4.5 w-4.5 text-white h-[18px] w-[18px]" />
              </div>
              <span className="text-xl font-bold text-gray-900">Randevu</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-500 hover:text-gray-900 transition text-sm font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-500 hover:text-gray-900 transition text-sm font-medium">How It Works</a>
              <a href="#install" className="text-gray-500 hover:text-gray-900 transition text-sm font-medium">Mobile App</a>
              <Link href="/auth/signin" className="text-gray-500 hover:text-gray-900 transition text-sm font-medium">Sign In</Link>
              <Link href="/auth/signup" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold shadow-sm">
                Get Started Free
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {mobileNavOpen && (
            <div className="md:hidden pt-3 pb-2 border-t mt-3 space-y-0.5">
              <a href="#features" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Features</a>
              <a href="#how-it-works" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg font-medium">How It Works</a>
              <a href="#install" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Mobile App</a>
              <Link href="/auth/signin" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg font-medium">Sign In</Link>
              <Link href="/auth/signup" onClick={() => setMobileNavOpen(false)} className="block px-3 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-center mt-2">
                Get Started Free
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 40%)'}} />
        <div className="absolute inset-0" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />

        <div className="relative container mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-semibold mb-8 backdrop-blur-sm">
              <Star className="h-3 w-3 fill-blue-400 text-blue-400" />
              Trusted by 10,000+ service providers
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Your Business,{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                Booked Solid
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100/80 mb-10 leading-relaxed max-w-2xl mx-auto">
              The all-in-one booking platform for barbers, consultants, tutors, and every service provider.
              Accept appointments 24/7 and grow your business — for free.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/signup" className="px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white text-base font-bold rounded-xl transition shadow-xl shadow-blue-900/40 border border-blue-400/30">
                Start Free — No Card Needed
              </Link>
              <Link href="/book/johndoe" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-base font-semibold rounded-xl transition border border-white/20 backdrop-blur-sm">
                See Live Demo →
              </Link>
            </div>
            <p className="text-xs text-blue-300/60 mt-5">Free 14-day trial · No credit card · Cancel anytime</p>
          </div>

          {/* Stats bar */}
          <div className="max-w-3xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-0 bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
            {[
              { value: '10k+', label: 'Active Providers' },
              { value: '500k+', label: 'Bookings Made' },
              { value: '24/7', label: 'Availability' },
              { value: '99.9%', label: 'Uptime SLA' },
            ].map(({ value, label }, i) => (
              <div key={label} className={`text-center px-6 py-6 ${i < 3 ? 'border-r border-white/10' : ''} ${i >= 2 ? 'hidden md:block' : ''}`}>
                <div className="text-2xl sm:text-3xl font-bold text-white">{value}</div>
                <div className="text-xs text-blue-300/70 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Features</div>
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Powerful tools designed for modern service providers</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { iconBg: 'bg-blue-600', Icon: Calendar, title: 'Smart Scheduling', desc: 'Automated scheduling that prevents double-bookings and manages your availability intelligently.' },
              { iconBg: 'bg-violet-600', Icon: Clock, title: 'Real-Time Availability', desc: 'Customers see live availability and can book instantly without back-and-forth emails.' },
              { iconBg: 'bg-emerald-600', Icon: Users, title: 'Customer Management', desc: 'Keep track of all your clients, their booking history, and contact information.' },
              { iconBg: 'bg-amber-500', Icon: Zap, title: 'Lightning Fast', desc: 'Built on modern technology for instant page loads and a smooth booking experience.' },
              { iconBg: 'bg-rose-600', Icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security with automatic backups and 99.9% uptime guarantee.' },
              { iconBg: 'bg-indigo-600', Icon: Globe, title: 'Global Timezones', desc: 'Automatically handles timezones so you and your international clients are always in sync.' },
            ].map(({ iconBg, Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Process</div>
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">Up and Running in Minutes</h2>
            <p className="text-lg text-gray-500">Get your booking page live before your next coffee break</p>
          </div>

          <div className="max-w-2xl mx-auto">
            {[
              { n: 1, title: 'Create Your Account', desc: 'Sign up with your email in seconds. No credit card required for the trial.', color: 'from-blue-500 to-blue-600' },
              { n: 2, title: 'Set Your Services & Hours', desc: 'Define your working hours, services, pricing, and buffer times between appointments.', color: 'from-violet-500 to-violet-600' },
              { n: 3, title: 'Share Your Booking Link', desc: 'Get a personalized page (randevu.app/yourname) to share on social media or your website.', color: 'from-emerald-500 to-emerald-600' },
              { n: 4, title: 'Accept Bookings 24/7', desc: 'Clients book online anytime. Your dashboard stays organized with all appointments in one place.', color: 'from-orange-500 to-orange-600' },
            ].map(({ n, title, desc, color }, i) => (
              <div key={n} className="flex gap-5">
                {/* Left column: number + connector line */}
                <div className="flex flex-col items-center">
                  <div className={`flex-shrink-0 w-11 h-11 bg-gradient-to-br ${color} text-white rounded-2xl flex items-center justify-center text-base font-extrabold shadow-md`}>
                    {n}
                  </div>
                  {i < 3 && <div className="w-px flex-1 bg-gray-200 my-2" />}
                </div>
                {/* Right column: text */}
                <div className={`pb-8 pt-1 flex-1 ${i === 3 ? 'pb-0' : ''}`}>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Install App Section */}
      <section id="install" className="py-20 sm:py-28 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 70% 50%, #3b82f6 0%, transparent 60%)'}} />
        <div className="relative container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-semibold mb-6">
                <Smartphone className="h-3 w-3" />
                Available as a Mobile App
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                Manage Bookings From Your Phone
              </h2>
              <p className="text-blue-100/70 text-base mb-8 leading-relaxed">
                Install Randevu directly on your home screen. Works offline, loads instantly, and feels like a native app — no App Store required.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  'Install directly from your browser — no app store',
                  'Works on iPhone, Android, and desktop',
                  'Loads instantly, even on slow connections',
                  'Get notified of new bookings',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-blue-100/80">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-blue-50 transition text-sm">
                  <Download className="h-4 w-4" />
                  Get Started &amp; Install
                </Link>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full scale-75" />
                {/* Phone */}
                <div className="relative w-56 bg-slate-800 rounded-[2.5rem] border-4 border-slate-700 shadow-2xl overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-2xl z-10" />
                  {/* Screen */}
                  <div className="pt-8 pb-4 px-3 bg-gradient-to-b from-slate-900 to-slate-800 min-h-[400px]">
                    {/* App header */}
                    <div className="flex items-center justify-between mb-4 px-1">
                      <span className="text-white text-xs font-bold">Randevu</span>
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">JD</span>
                      </div>
                    </div>
                    {/* Stat cards */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { label: "Today", value: "3", color: "from-blue-600 to-blue-700" },
                        { label: "This Week", value: "12", color: "from-violet-600 to-violet-700" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className={`bg-gradient-to-br ${color} rounded-xl p-3`}>
                          <div className="text-white/70 text-[9px] mb-0.5">{label}</div>
                          <div className="text-white text-lg font-bold">{value}</div>
                        </div>
                      ))}
                    </div>
                    {/* Booking items */}
                    <div className="bg-slate-700/50 rounded-xl p-2.5 mb-2">
                      <div className="text-slate-400 text-[9px] mb-2 font-semibold uppercase tracking-wide">Upcoming</div>
                      {[
                        { name: 'Alex M.', service: 'Haircut', time: '10:00 AM', color: 'bg-green-500' },
                        { name: 'Sarah K.', service: 'Beard Trim', time: '11:30 AM', color: 'bg-blue-500' },
                        { name: 'John D.', service: 'Haircut', time: '2:00 PM', color: 'bg-violet-500' },
                      ].map(({ name, service, time, color }) => (
                        <div key={name} className="flex items-center gap-2 py-1.5 border-b border-slate-600/50 last:border-0">
                          <div className={`w-1.5 h-6 rounded-full ${color} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-[10px] font-medium truncate">{name}</div>
                            <div className="text-slate-400 text-[9px]">{service}</div>
                          </div>
                          <div className="text-slate-300 text-[9px] font-medium">{time}</div>
                        </div>
                      ))}
                    </div>
                    {/* Install prompt */}
                    <div className="bg-blue-600/30 border border-blue-500/40 rounded-xl p-2.5 flex items-center gap-2">
                      <Download className="h-3 w-3 text-blue-400 flex-shrink-0" />
                      <span className="text-blue-200 text-[9px]">Add to Home Screen</span>
                    </div>
                  </div>
                  {/* Home indicator */}
                  <div className="flex justify-center py-2 bg-slate-800">
                    <div className="w-16 h-1 bg-slate-600 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Install instructions */}
          <div className="max-w-4xl mx-auto mt-16 grid sm:grid-cols-3 gap-5">
            {[
              { step: '1', platform: 'iPhone / Safari', instruction: 'Tap the Share button → "Add to Home Screen"' },
              { step: '2', platform: 'Android / Chrome', instruction: 'Tap the menu (⋮) → "Add to Home Screen" or "Install App"' },
              { step: '3', platform: 'Desktop / Chrome', instruction: 'Click the install icon (⊕) in the address bar' },
            ].map(({ step, platform, instruction }) => (
              <div key={platform} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                <div className="w-7 h-7 bg-blue-500/30 border border-blue-400/30 rounded-lg flex items-center justify-center text-blue-300 text-xs font-bold mb-3">{step}</div>
                <div className="text-white text-sm font-semibold mb-1">{platform}</div>
                <div className="text-blue-100/60 text-xs leading-relaxed">{instruction}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-10 sm:p-16 shadow-xl shadow-blue-200">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">Ready to Grow?</h2>
            <p className="text-base sm:text-lg text-blue-100 mb-10 max-w-xl mx-auto">
              Join thousands of professionals who trust Randevu to manage their bookings effortlessly
            </p>
            <Link href="/auth/signup" className="inline-block px-8 py-4 bg-white text-blue-700 text-base font-bold rounded-xl hover:bg-blue-50 transition shadow-lg">
              Start Your Free Trial
            </Link>
            <p className="text-blue-200/70 text-xs mt-5">No credit card required · Free forever for solo providers</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-14">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Calendar className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-base font-bold text-white">Randevu</span>
              </div>
              <p className="text-xs leading-relaxed">The modern booking platform for service providers worldwide.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#install" className="hover:text-white transition">Mobile App</a></li>
                <li><a href="/book/johndoe" className="hover:text-white transition">Live Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2.5 text-xs">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p>&copy; 2026 Randevu. All rights reserved.</p>
            <p className="text-gray-600">Built for service providers, by service providers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
