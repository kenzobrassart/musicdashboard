'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeProfil, saveProfil, PROFIL_DEFAULT } from '@/lib/firestore/settings'
import type { ProfilEmetteur } from '@/lib/types'

export function useProfil() {
  const { user } = useAuth()
  const [profil, setProfil] = useState<ProfilEmetteur>(PROFIL_DEFAULT)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeProfil(user.uid, (data) => {
      setProfil(data)
      setLoading(false)
    }, (e) => { setError(e.message); setLoading(false) })
    return unsub
  }, [user])

  async function update(patch: Partial<ProfilEmetteur>) {
    if (!user) return
    await saveProfil(user.uid, patch)
  }

  return { profil, loading, error, update }
}
