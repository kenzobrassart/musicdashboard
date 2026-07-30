'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { subscribeDocuments } from '@/lib/firestore/documents'
import type { DocumentFichier } from '@/lib/types'

export function useDocuments() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<DocumentFichier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeDocuments(user.uid, (data) => {
      setDocuments(data)
      setLoading(false)
    })
    return unsub
  }, [user])

  return { documents, loading }
}
