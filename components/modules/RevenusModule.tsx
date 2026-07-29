'use client'

import { useRevenus } from '@/hooks/useRevenus'

export default function RevenusModule() {
  const { revenus, loading } = useRevenus()

  if (loading) return <div className="text-text-muted">Chargement...</div>

  return (
    <div className="space-y-3">
      {revenus.length === 0 && (
        <p className="text-text-muted text-center py-12">Aucun revenu enregistré</p>
      )}
      {revenus.map((r) => (
        <div key={r.id} className="bg-bg-card border border-bg-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">{r.description ?? r.type}</p>
            <p className="text-text-muted text-xs mt-0.5">{r.type}</p>
          </div>
          <span className="text-green-400 font-bold tabular-nums">
            +{r.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
      ))}
    </div>
  )
}
