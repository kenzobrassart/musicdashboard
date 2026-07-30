'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeClients } from '@/lib/firestore/clients'
import type { Client } from '@/lib/types'

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeClients(user.uid, (data) => {
      setClients(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  return { clients, loading }
}
