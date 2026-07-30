'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeContacts } from '@/lib/firestore/contacts'
import type { Contact } from '@/lib/types'

export function useContacts() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeContacts(user.uid, (data) => {
      setContacts(data)
      setLoading(false)
    }, (e) => { setError(e.message); setLoading(false) })
    return unsub
  }, [user])

  return { contacts, loading, error }
}
