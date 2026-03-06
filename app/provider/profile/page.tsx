'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AvatarUpload } from '@/components/avatar-upload'
import { Button } from '@/components/ui/button'
import { Clock, ExternalLink, Pencil, X, Check } from 'lucide-react'

interface ProviderProfile {
  id: string
  fullName: string
  email: string
  username: string
  businessName: string | null
  description: string | null
  timezone: string
  avatarUrl: string | null
}

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Halifax',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Istanbul',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Baku',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
]

export default function ProviderProfilePage() {
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    businessName: '',
    description: '',
    timezone: 'UTC',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const res = await fetch('/api/provider/profile')
      if (!res.ok) throw new Error('Failed to load profile')
      const data: ProviderProfile = await res.json()
      setProfile(data)
      setForm({
        fullName: data.fullName,
        businessName: data.businessName || '',
        description: data.description || '',
        timezone: data.timezone,
      })
    } catch {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const res = await fetch('/api/provider/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      const updated: ProviderProfile = await res.json()
      setProfile(updated)
      setEditing(false)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (profile) {
      setForm({
        fullName: profile.fullName,
        businessName: profile.businessName || '',
        description: profile.description || '',
        timezone: profile.timezone,
      })
    }
    setEditing(false)
    setError('')
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
        <p className="text-xs text-gray-400 mt-0.5">Manage your public profile and account settings</p>
      </header>

      <main className="p-4 sm:p-8">
        <div className="max-w-2xl space-y-6">
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : profile ? (
            <>
              {/* Avatar Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-20" />
                <div className="px-8 pb-6">
                  <div className="-mt-10 mb-4 flex items-end gap-4">
                    <AvatarUpload
                      currentAvatarUrl={profile.avatarUrl}
                      providerId={profile.id}
                      providerName={profile.fullName}
                      onUploadSuccess={(url) => setProfile((p) => p ? { ...p, avatarUrl: url } : p)}
                      onDeleteSuccess={() => setProfile((p) => p ? { ...p, avatarUrl: null } : p)}
                    />
                    <div className="pb-1">
                      <h2 className="text-lg font-bold text-gray-900">{profile.fullName}</h2>
                      {profile.businessName && (
                        <p className="text-sm text-gray-500">{profile.businessName}</p>
                      )}
                      <p className="text-xs text-gray-400">@{profile.username}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-xs"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit Profile
                    </Button>
                    <Link href={`/book/${profile.username}`} target="_blank">
                      <Button variant="outline" size="sm" className="text-xs">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        View Public Page
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Profile Info / Edit Form */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {editing ? 'Edit Profile' : 'Profile Information'}
                  </h3>
                  {editing && (
                    <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Business Name</label>
                      <input
                        type="text"
                        value={form.businessName}
                        onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                        placeholder="Optional"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Tell clients about yourself..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Timezone</label>
                      <select
                        value={form.timezone}
                        onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        {saving ? 'Saving...' : (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancel} className="flex-1 text-xs">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-xs text-gray-400">Email</dt>
                      <dd className="text-sm text-gray-900 mt-0.5">{profile.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-400">Booking URL</dt>
                      <dd className="text-sm text-gray-900 mt-0.5 font-mono">
                        {typeof window !== 'undefined'
                          ? `${window.location.origin}/book/${profile.username}`
                          : `/book/${profile.username}`}
                      </dd>
                    </div>
                    {profile.businessName && (
                      <div>
                        <dt className="text-xs text-gray-400">Business Name</dt>
                        <dd className="text-sm text-gray-900 mt-0.5">{profile.businessName}</dd>
                      </div>
                    )}
                    {profile.description && (
                      <div>
                        <dt className="text-xs text-gray-400">Description</dt>
                        <dd className="text-sm text-gray-900 mt-0.5">{profile.description}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Timezone
                      </dt>
                      <dd className="text-sm text-gray-900 mt-0.5">{profile.timezone}</dd>
                    </div>
                  </dl>
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}
