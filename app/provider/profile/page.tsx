'use client'

import { useState } from 'react'
import { AvatarUpload } from '@/components/avatar-upload'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Phone, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'

// TODO: Replace with actual session data from NextAuth
const MOCK_PROVIDER = {
  id: '00000000-0000-0000-0000-000000000001', // Replace with actual provider ID
  fullName: 'John Doe',
  email: 'johndoe@example.com',
  phone: '+1 (555) 123-4567',
  businessName: 'Professional Services',
  businessAddress: '123 Main St, New York, NY 10001',
  timezone: 'America/New_York',
  avatarUrl: null,
  bio: 'Professional service provider with 10+ years of experience.',
}

export default function ProviderProfilePage() {
  const [provider, setProvider] = useState(MOCK_PROVIDER)

  const handleAvatarUpload = (url: string) => {
    setProvider((prev) => ({ ...prev, avatarUrl: url }))
  }

  const handleAvatarDelete = () => {
    setProvider((prev) => ({ ...prev, avatarUrl: null }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Provider Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {provider.fullName}
                </h2>
                <p className="text-blue-100">{provider.businessName}</p>
              </div>
            </div>

            {/* Avatar Upload Section */}
            <div className="relative -mt-16 mb-8">
              <AvatarUpload
                currentAvatarUrl={provider.avatarUrl}
                providerId={provider.id}
                providerName={provider.fullName}
                onUploadSuccess={handleAvatarUpload}
                onDeleteSuccess={handleAvatarDelete}
              />
            </div>

            {/* Profile Information */}
            <div className="px-8 pb-8 space-y-6">
              {/* Bio Section */}
              {provider.bio && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-gray-600">{provider.bio}</p>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-gray-600">
                    <Mail className="h-5 w-5 mt-0.5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div>{provider.email}</div>
                    </div>
                  </div>

                  {provider.phone && (
                    <div className="flex items-start gap-3 text-gray-600">
                      <Phone className="h-5 w-5 mt-0.5 text-blue-600" />
                      <div>
                        <div className="text-sm text-gray-500">Phone</div>
                        <div>{provider.phone}</div>
                      </div>
                    </div>
                  )}

                  {provider.businessAddress && (
                    <div className="flex items-start gap-3 text-gray-600">
                      <MapPin className="h-5 w-5 mt-0.5 text-blue-600" />
                      <div>
                        <div className="text-sm text-gray-500">Address</div>
                        <div>{provider.businessAddress}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 text-gray-600">
                    <Clock className="h-5 w-5 mt-0.5 text-blue-600" />
                    <div>
                      <div className="text-sm text-gray-500">Timezone</div>
                      <div>{provider.timezone}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t">
                <div className="flex gap-3">
                  <Button className="flex-1">Edit Profile</Button>
                  <Button variant="outline" className="flex-1">
                    View Public Page
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is a demo profile page. To use with real data,
              integrate with NextAuth.js for authentication and replace the mock data with
              actual session information.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
