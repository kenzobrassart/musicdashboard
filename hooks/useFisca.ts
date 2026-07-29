'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeFisca, saveFisca, FISCA_DEFAULT } from '@/lib/firestore/settings'
import type { FiscaSettings } from '@/lib/types'

export function useFisca() {
  const { user } = useAuth()
  const [fisca, setFisca] = useState<FiscaSettings>(FISCA_DEFAULT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeFisca(user.uid, (data) => {
      setFisca(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  async function update(patch: Partial<FiscaSettings>) {
    if (!user) return
    await saveFisca(user.uid, patch)
  }

  return { fisca, loading, update }
}
