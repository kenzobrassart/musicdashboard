'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeFactures } from '@/lib/firestore/factures'
import type { Facture } from '@/lib/types'

export function useFactures() {
  const { user } = useAuth()
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeFactures(user.uid, (data) => {
      setFactures(data)
      setLoading(false)
    }, (e) => { setError(e.message); setLoading(false) })
    return unsub
  }, [user])

  return { factures, loading, error }
}
