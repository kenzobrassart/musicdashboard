'use client'

import { useRevenus } from '@/hooks/useRevenus'
import { useDepenses } from '@/hooks/useDepenses'
import { useConcerts } from '@/hooks/useConcerts'
import { useArtistes } from '@/hooks/useArtistes'
import { useFactures } from '@/hooks/useFactures'
import { TrendingUp, TrendingDown, DollarSign, Music, Users, FileText } from 'lucide-react'
import { clsx } from 'clsx'

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function DashboardStats() {
  const { revenus } = useRevenus()
  const { depenses } = useDepenses()
  const { concerts } = useConcerts()
  const { artistes } = useArtistes()
  const { factures } = useFactures()

  const totalRevenus = revenus.reduce((s, r) => s + r.montant, 0)
  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0)
  const benefice = totalRevenus - totalDepenses
  const facturesEnAttente = factures.filter(f => f.statut === 'envoyee' || f.statut === 'en_retard')
  const montantEnAttente = facturesEnAttente.reduce((s, f) => s + f.montantTTC, 0)

  const stats = [
    { label: 'Revenus totaux', value: fmt(totalRevenus), icon: TrendingUp, color: 'text-green-400', sub: `${revenus.length} entrée${revenus.length > 1 ? 's' : ''}` },
    { label: 'Dépenses totales', value: fmt(totalDepenses), icon: TrendingDown, color: 'text-red-400', sub: `${depenses.length} entrée${depenses.length > 1 ? 's' : ''}` },
    { label: 'Bénéfice net', value: fmt(benefice), icon: DollarSign, color: benefice >= 0 ? 'text-green-400' : 'text-red-400', sub: benefice >= 0 ? 'Positif' : 'Négatif' },
    { label: 'Concerts', value: String(concerts.length), icon: Music, color: 'text-brand', sub: `${concerts.filter(c => c.statut === 'confirme').length} confirmé(s)` },
    { label: 'Artistes', value: String(artistes.length), icon: Users, color: 'text-brand', sub: 'enregistrés' },
    { label: 'Factures en attente', value: fmt(montantEnAttente), icon: FileText, color: facturesEnAttente.length > 0 ? 'text-yellow-400' : 'text-green-400', sub: `${facturesEnAttente.length} facture(s)` },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {stats.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-bg-card border border-bg-border rounded-xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-muted text-xs md:text-sm">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <p className={clsx('text-xl md:text-2xl font-bold tabular-nums', color)}>{value}</p>
            <p className="text-text-faint text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Derniers revenus */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4 text-text-muted uppercase tracking-wide">Derniers revenus</h2>
          {revenus.length === 0 ? (
            <p className="text-text-faint text-sm text-center py-4">Aucun revenu</p>
          ) : (
            <ul className="space-y-2">
              {revenus.slice(0, 5).map(r => (
                <li key={r.id} className="flex items-center justify-between">
                  <span className="text-sm truncate max-w-[60%]">{r.description ?? r.type}</span>
                  <span className="text-green-400 text-sm font-medium tabular-nums">+{fmt(r.montant)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Prochains concerts */}
        <div className="bg-bg-card border border-bg-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4 text-text-muted uppercase tracking-wide">Prochains concerts</h2>
          {concerts.length === 0 ? (
            <p className="text-text-faint text-sm text-center py-4">Aucun concert</p>
          ) : (
            <ul className="space-y-2">
              {concerts.slice(0, 5).map(c => (
                <li key={c.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{c.lieu}</p>
                    <p className="text-text-faint text-xs">{c.ville}</p>
                  </div>
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    c.statut === 'confirme' ? 'bg-green-400/10 text-green-400' :
                    c.statut === 'en_attente' ? 'bg-yellow-400/10 text-yellow-400' :
                    'bg-red-400/10 text-red-400'
                  )}>
                    {c.statut === 'confirme' ? 'Confirmé' : c.statut === 'en_attente' ? 'En attente' : 'Annulé'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
