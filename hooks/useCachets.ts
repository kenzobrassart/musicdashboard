'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeCachets } from '@/lib/firestore/cachets'
import type { Cachet } from '@/lib/types'

export function useCachets() {
  const { user } = useAuth()
  const [cachets, setCachets] = useState<Cachet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeCachets(user.uid, (data) => {
      setCachets(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  return { cachets, loading }
}
