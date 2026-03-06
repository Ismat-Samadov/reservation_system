'use client'

import { useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ProviderSidebar from '@/components/provider-sidebar'

function ProviderShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ProviderSidebar
        name={session.user?.name ?? ''}
        email={session.user?.email ?? ''}
        username={session.user?.username ?? ''}
      />
      <div className="lg:ml-60 pt-14 lg:pt-0 flex-1 min-h-screen">
        {children}
      </div>
    </div>
  )
}

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ProviderShell>{children}</ProviderShell>
    </SessionProvider>
  )
}
