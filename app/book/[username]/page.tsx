'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, DollarSign, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Provider {
  id: string
  fullName: string
  businessName: string | null
  description: string | null
  avatarUrl: string | null
  timezone: string
}

interface Service {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: string | null
  currency: string
}

export default function PublicBookingPage() {
  const params = useParams()
  const username = params.username as string

  const [provider, setProvider] = useState<Provider | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProvider() {
      try {
        const response = await fetch(`/api/providers/${username}`)
        if (!response.ok) {
          throw new Error('Provider not found')
        }
        const data = await response.json()
        setProvider(data.provider)
        setServices(data.services)
      } catch (err: any) {
        setError(err.message || 'Failed to load provider')
      } finally {
        setLoading(false)
      }
    }

    loadProvider()
  }, [username])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Provider Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            The booking page you're looking for doesn't exist.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getInitials = () => {
    return provider.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              BookEasy
            </h1>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Provider Profile Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 border-4 border-white">
                  <AvatarImage
                    src={provider.avatarUrl || undefined}
                    alt={provider.fullName}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {provider.fullName}
                </h2>
                {provider.businessName && (
                  <p className="text-blue-100 text-lg">
                    {provider.businessName}
                  </p>
                )}
              </div>
            </div>

            {provider.description && (
              <div className="px-8 py-6 border-b">
                <p className="text-gray-600 text-center">
                  {provider.description}
                </p>
              </div>
            )}
          </div>

          {/* Services */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Available Services
            </h3>

            {services.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  No Services Available
                </h4>
                <p className="text-gray-600">
                  This provider hasn't added any services yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                          {service.name}
                        </h4>
                        {service.description && (
                          <p className="text-gray-600 text-sm">
                            {service.description}
                          </p>
                        )}
                      </div>
                      {service.price && (
                        <div className="flex items-center gap-1 text-blue-600 font-semibold text-lg">
                          <DollarSign className="h-5 w-5" />
                          {service.price}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {service.durationMinutes} minutes
                      </div>

                      <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                        Book Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800">
              Timezone: {provider.timezone}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
