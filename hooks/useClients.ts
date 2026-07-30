'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeClients } from '@/lib/firestore/clients'
import type { Client } from '@/lib/types'

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeClients(user.uid, (data) => {
      setClients(data)
      setLoading(false)
    }, (e) => { setError(e.message); setLoading(false) })
    return unsub
  }, [user])

  return { clients, loading, error }
}
