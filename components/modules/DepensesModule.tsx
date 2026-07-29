'use client'

import { useDepenses } from '@/hooks/useDepenses'

export default function DepensesModule() {
  const { depenses, loading } = useDepenses()

  if (loading) return <div className="text-text-muted">Chargement...</div>

  return (
    <div className="space-y-3">
      {depenses.length === 0 && (
        <p className="text-text-muted text-center py-12">Aucune dépense enregistrée</p>
      )}
      {depenses.map((d) => (
        <div key={d.id} className="bg-bg-card border border-bg-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">{d.description ?? d.type}</p>
            <p className="text-text-muted text-xs mt-0.5">{d.type}</p>
          </div>
          <span className="text-red-400 font-bold tabular-nums">
            -{d.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
      ))}
    </div>
  )
}
