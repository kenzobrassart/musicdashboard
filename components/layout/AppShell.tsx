'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import QuickActionButton from './QuickActionButton'
import Logo from '@/components/ui/Logo'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3 animate-fade-in-up">
          <Logo size={36} className="animate-soft-pulse" />
          <p className="text-text-muted text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <QuickActionButton />
      <BottomNav />
    </div>
  )
}
