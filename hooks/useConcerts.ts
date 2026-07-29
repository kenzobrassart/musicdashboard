'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeConcerts } from '@/lib/firestore/concerts'
import type { Concert } from '@/lib/types'

export function useConcerts() {
  const { user } = useAuth()
  const [concerts, setConcerts] = useState<Concert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeConcerts(user.uid, (data) => {
      setConcerts(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  return { concerts, loading }
}
