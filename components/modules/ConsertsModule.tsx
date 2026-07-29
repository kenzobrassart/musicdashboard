'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { subscribeConcerts } from '@/lib/firestore/concerts'
import type { Concert } from '@/lib/types'
import { clsx } from 'clsx'

const statutColor: Record<Concert['statut'], string> = {
  confirme: 'bg-green-400/10 text-green-400',
  en_attente: 'bg-yellow-400/10 text-yellow-400',
  annule: 'bg-red-400/10 text-red-400',
}

export default function ConsertsModule() {
  const { user } = useAuth()
  const [concerts, setConcerts] = useState<Concert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    return subscribeConcerts(user.uid, (data) => {
      setConcerts(data)
      setLoading(false)
    })
  }, [user])

  if (loading) return <div className="text-text-muted">Chargement...</div>

  return (
    <div className="space-y-3">
      {concerts.length === 0 && (
        <p className="text-text-muted text-center py-12">Aucun concert enregistré</p>
      )}
      {concerts.map((c) => (
        <div key={c.id} className="bg-bg-card border border-bg-border rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{c.lieu}</p>
              <p className="text-text-muted text-xs mt-0.5">{c.ville}</p>
            </div>
            <span className={clsx('text-xs px-2 py-1 rounded-full font-medium', statutColor[c.statut])}>
              {c.statut.replace('_', ' ')}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-text-muted text-sm">{new Date(c.date).toLocaleDateString('fr-FR')}</span>
            <span className="font-bold tabular-nums text-brand">
              {c.cachet.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
