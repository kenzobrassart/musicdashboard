'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeDepenses } from '@/lib/firestore/depenses'
import type { Depense } from '@/lib/types'

export function useDepenses() {
  const { user } = useAuth()
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeDepenses(user.uid, (data) => {
      setDepenses(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  return { depenses, loading }
}
