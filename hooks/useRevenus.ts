'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeRevenus } from '@/lib/firestore/revenus'
import type { Revenu } from '@/lib/types'

export function useRevenus() {
  const { user } = useAuth()
  const [revenus, setRevenus] = useState<Revenu[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeRevenus(user.uid, (data) => {
      setRevenus(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  return { revenus, loading }
}
