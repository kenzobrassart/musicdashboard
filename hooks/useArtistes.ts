'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeArtistes } from '@/lib/firestore/artistes'
import type { Artiste } from '@/lib/types'

export function useArtistes() {
  const { user } = useAuth()
  const [artistes, setArtistes] = useState<Artiste[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeArtistes(user.uid, (data) => {
      setArtistes(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  return { artistes, loading }
}
