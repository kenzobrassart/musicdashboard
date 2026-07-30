'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeCachets } from '@/lib/firestore/cachets'
import type { Cachet } from '@/lib/types'

export function useCachets() {
  const { user } = useAuth()
  const [cachets, setCachets] = useState<Cachet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeCachets(user.uid, (data) => {
      setCachets(data)
      setLoading(false)
    }, (e) => { setError(e.message); setLoading(false) })
    return unsub
  }, [user])

  return { cachets, loading, error }
}
