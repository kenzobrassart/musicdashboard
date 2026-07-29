'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeOperations } from '@/lib/firestore/operations'
import type { Operation } from '@/lib/types'

export function useOperations() {
  const { user } = useAuth()
  const [operations, setOperations] = useState<Operation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeOperations(user.uid, (data) => {
      setOperations(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  return { operations, loading }
}
