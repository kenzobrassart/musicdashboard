'use client'

import Link from 'next/link'
import { useCachets } from '@/hooks/useCachets'
import { useOperations } from '@/hooks/useOperations'
import { useFactures } from '@/hooks/useFactures'
import { part, qte, fmt, encaissementsParMois } from '@/lib/calc'
import { TrendingUp, TrendingDown, Wallet, Music2, FileText, Clock, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import ErrorBanner from '@/components/ui/ErrorBanner'

function moisPrecedent(key: string) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function DashboardStats() {
  const { cachets, loading: l1, error: e1 } = useCachets()
  const { operations, loading: l2, error: e2 } = useOperations()
  const { factures, loading: l3, error: e3 } = useFactures()

  const error = e1 || e2 || e3
  if (error) return <ErrorBanner message={error} />
  if (l1 || l2 || l3) return <div className="text-text-muted animate-pulse">Chargement...</div>

  const partTotal = cachets.reduce((s, c) => s + part(c), 0)
  const encaisse = cachets.filter((c) => c.paye).reduce((s, c) => s + part(c), 0)
  const attente = partTotal - encaisse
  const prods = cachets.reduce((s, c) => s + qte(c), 0)
  const artistes = new Set(cachets.map((c) => c.artiste).filter(Boolean)).size
  const revenusAutres = operations.filter((o) => o.type === 'revenu').reduce((s, o) => s + o.montant, 0)
  const depenses = operations.filter((o) => o.type === 'depense').reduce((s, o) => s + o.montant, 0)
  const solde = partTotal + revenusAutres - depenses
  const facturesEnAttente = factures.filter((f) => f.statut === 'envoyee' || f.statut === 'en_retard')
  const facturesEnRetard = factures.filter((f) => f.statut === 'en_retard')
  const montantEnRetard = facturesEnRetard.reduce((s, f) => s + f.montantTTC, 0)

  const moisActuelKey = new Date().toISOString().slice(0, 7)
  const moisPrecedentKey = moisPrecedent(moisActuelKey)
  const encMap = encaissementsParMois(cachets, operations, 'brut')
  const caMoisActuel = (encMap[moisActuelKey]?.cachets || 0) + (encMap[moisActuelKey]?.autres || 0)
  const caMoisPrecedentVal = (encMap[moisPrecedentKey]?.cachets || 0) + (encMap[moisPrecedentKey]?.autres || 0)
  const deltaPct = caMoisPrecedentVal > 0 ? Math.round(((caMoisActuel - caMoisPrecedentVal) / caMoisPrecedentVal) * 100) : null

  const stats = [
    { label: 'CA du mois', value: fmt(caMoisActuel), icon: TrendingUp, color: 'text-text-primary', sub: deltaPct === null ? 'pas de mois précédent' : `${deltaPct >= 0 ? '+' : ''}${deltaPct} % vs mois précédent` },
    { label: 'Prods placées', value: String(prods), icon: Music2, color: 'text-text-primary', sub: `${artistes} artiste${artistes > 1 ? 's' : ''}` },
    { label: 'Ma part', value: fmt(partTotal), icon: Wallet, color: 'text-brand', sub: prods ? `${fmt(partTotal / prods)} / prod` : '' },
    { label: 'Encaissé', value: fmt(encaisse), icon: TrendingUp, color: 'text-green-400', sub: partTotal ? `${Math.round((encaisse / partTotal) * 100)} % de ma part` : '' },
    { label: 'Autres revenus', value: fmt(revenusAutres), icon: TrendingUp, color: 'text-green-400', sub: 'hors cachets' },
    { label: 'Dépenses', value: fmt(depenses), icon: TrendingDown, color: 'text-red-400', sub: 'non déductibles' },
  ]

  const recentCachets = [...cachets].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5)
  const enAttentePaiement = cachets.filter((c) => !c.paye).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5)

  return (
    <div className="space-y-8">
      {facturesEnRetard.length > 0 && (
        <Link href="/factures" className="flex items-center gap-3 bg-red-400/10 border border-red-400/30 rounded-xl p-4 hover:bg-red-400/15 transition-colors">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <p className="text-red-200 text-sm">
            <span className="font-semibold">{facturesEnRetard.length} facture{facturesEnRetard.length > 1 ? 's' : ''} en retard</span>
            {' — '}{fmt(montantEnRetard)} à relancer ({facturesEnRetard.map((f) => f.contactNom).join(', ')})
          </p>
        </Link>
      )}

      <div className="card-glass p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-text-muted text-sm">Solde net</p>
          <p className={clsx('text-3xl font-bold tabular-nums', solde >= 0 ? 'text-green-400' : 'text-red-400')}>{fmt(solde)}</p>
        </div>
        {attente > 0 && (
          <div>
            <p className="text-text-muted text-sm text-right">En attente d&apos;encaissement</p>
            <p className="text-yellow-400 font-bold text-xl tabular-nums text-right">{fmt(attente)}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {stats.map(({ label, value, icon: Icon, color, sub }, i) => (
          <div
            key={label}
            className="card-glass p-4 md:p-5 transition-all duration-200 hover:-translate-y-1 hover:border-white/[0.14] animate-fade-in-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
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
        <div className="card-glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Derniers cachets</h2>
            <Link href="/cachets" className="text-xs text-brand hover:underline">Voir tout</Link>
          </div>
          {recentCachets.length === 0 ? (
            <p className="text-text-faint text-sm text-center py-4">Aucun cachet pour l&apos;instant</p>
          ) : (
            <ul className="space-y-2">
              {recentCachets.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg -mx-1.5 px-1.5 py-0.5 transition-colors duration-150 hover:bg-white/[0.04]">
                  <span className="text-sm truncate max-w-[60%]">{c.son}{c.artiste ? ` — ${c.artiste}` : ''}</span>
                  <span className="text-brand text-sm font-medium tabular-nums">{fmt(part(c))}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">En attente de paiement</h2>
            <Clock size={16} className="text-yellow-400" />
          </div>
          {enAttentePaiement.length === 0 ? (
            <p className="text-text-faint text-sm text-center py-4">Tout est encaissé 🎉</p>
          ) : (
            <ul className="space-y-2">
              {enAttentePaiement.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg -mx-1.5 px-1.5 py-0.5 transition-colors duration-150 hover:bg-white/[0.04]">
                  <span className="text-sm truncate max-w-[60%]">{c.son}{c.artiste ? ` — ${c.artiste}` : ''}</span>
                  <span className="text-yellow-400 text-sm font-medium tabular-nums">{fmt(part(c))}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {facturesEnAttente.length > 0 && (
        <div className="card-glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide flex items-center gap-2"><FileText size={14} /> Factures en attente</h2>
            <Link href="/factures" className="text-xs text-brand hover:underline">Voir tout</Link>
          </div>
          <ul className="space-y-2">
            {facturesEnAttente.slice(0, 5).map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2">
                <span className="text-sm truncate max-w-[60%]">{f.numero} — {f.contactNom}</span>
                <span className="text-yellow-400 text-sm font-medium tabular-nums">{fmt(f.montantTTC)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
