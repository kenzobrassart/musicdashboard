'use client'

import { useMemo } from 'react'
import { useCachets } from '@/hooks/useCachets'
import { useOperations } from '@/hooks/useOperations'
import { useFisca } from '@/hooks/useFisca'
import { encaissementsParMois, ligneFiscale, part, fmt, fmtMois } from '@/lib/calc'
import { TAUX_URSSAF, type FiscaSettings } from '@/lib/types'
import { AlertTriangle } from 'lucide-react'

export default function FiscaliteModule() {
  const { cachets, loading: l1 } = useCachets()
  const { operations, loading: l2 } = useOperations()
  const { fisca, loading: l3, update } = useFisca()

  const map = useMemo(() => encaissementsParMois(cachets, operations, false), [cachets, operations])
  const moisTous = useMemo(() => Object.keys(map).sort(), [map])
  const annees = useMemo(() => [...new Set(moisTous.map((m) => m.slice(0, 4)))].sort(), [moisTous])
  const anneeSel = annees.includes(fisca.annee) ? fisca.annee : ''
  const moisAff = moisTous.filter((m) => !anneeSel || m.slice(0, 4) === anneeSel)

  const { rows, total } = useMemo(() => {
    const tot = { ca: 0, cot: 0, cfp: 0, vl: 0, du: 0, net: 0 }
    const rows = moisAff.map((m) => {
      const e = map[m]
      const l = ligneFiscale(e.cachets + e.autres, fisca)
      tot.ca += l.ca; tot.cot += l.cot; tot.cfp += l.cfp; tot.vl += l.vl; tot.du += l.du; tot.net += l.net
      return { mois: m, ...l, cachets: e.cachets, autres: e.autres }
    })
    return { rows, total: tot }
  }, [moisAff, map, fisca])

  const orphelins = cachets.filter((c) => c.paye && !c.datePaiement)
  const totalOrphelins = orphelins.reduce((s, c) => s + part(c), 0)

  if (l1 || l2 || l3) return <div className="text-text-muted animate-pulse">Chargement...</div>

  const totalPct = (fisca.taux * fisca.acre + fisca.cfp + fisca.vl).toFixed(2).replace('.', ',')

  return (
    <div className="space-y-4">
      <div className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-sm">Paramètres URSSAF (micro-entrepreneur)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">Régime / activité</label>
            <select value={fisca.regime} onChange={(e) => {
              const r = e.target.value as FiscaSettings['regime']
              update({ regime: r, taux: TAUX_URSSAF[r] })
            }} className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
              <option value="25.6">BNC — 25,6 %</option>
              <option value="21.2">BNC — 21,2 %</option>
              <option value="23.2">BIC service — 23,2 %</option>
              <option value="12.3">BIC vente — 12,3 %</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Taux cotisations (%)</label>
            <input type="number" step="0.1" value={fisca.taux} onChange={(e) => update({ taux: parseFloat(e.target.value) || 0 })}
              className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">CFP (%)</label>
            <input type="number" step="0.1" value={fisca.cfp} onChange={(e) => update({ cfp: parseFloat(e.target.value) || 0 })}
              className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Versement libératoire IR (%)</label>
            <input type="number" step="0.1" value={fisca.vl} onChange={(e) => update({ vl: parseFloat(e.target.value) || 0 })}
              className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Abattement ACRE</label>
            <select value={fisca.acre} onChange={(e) => update({ acre: parseFloat(e.target.value) })}
              className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
              <option value="1">Taux plein</option>
              <option value="0.5">ACRE — 50 %</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Année</label>
            <select value={anneeSel} onChange={(e) => update({ annee: e.target.value })}
              className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
              <option value="">Toutes</option>
              {annees.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-2 flex items-end">
            <p className="text-sm"><span className="text-text-muted">Taux global à provisionner : </span><span className="font-bold text-brand">{totalPct} %</span></p>
          </div>
        </div>
      </div>

      {orphelins.length > 0 && (
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 flex items-start gap-3 text-sm">
          <AlertTriangle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-yellow-200">
            {fmt(totalOrphelins)} encaissés ne sont rattachés à aucun mois ({orphelins.map((c) => c.son).join(', ')}) : ils sont absents du tableau ci-dessous.
            Renseignez leur mois de paiement dans l&apos;onglet Cachets.
          </p>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="text-center py-16 text-text-muted">Aucun encaissement rattaché à un mois pour le moment.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wide border-b border-bg-border">
                <th className="text-left font-medium py-2 px-2">Mois</th>
                <th className="text-right font-medium py-2 px-2">Cachets</th>
                <th className="text-right font-medium py-2 px-2">Autres</th>
                <th className="text-right font-medium py-2 px-2">CA</th>
                <th className="text-right font-medium py-2 px-2">Cotisations</th>
                <th className="text-right font-medium py-2 px-2">CFP</th>
                <th className="text-right font-medium py-2 px-2">VL</th>
                <th className="text-right font-medium py-2 px-2">Dû URSSAF</th>
                <th className="text-right font-medium py-2 px-2">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.mois} className="border-b border-bg-border/50">
                  <td className="py-2.5 px-2 font-medium">{fmtMois(r.mois)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-text-muted">{r.cachets ? fmt(r.cachets) : '—'}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-text-muted">{r.autres ? fmt(r.autres) : '—'}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums font-medium">{fmt(r.ca)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{fmt(r.cot)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{fmt(r.cfp)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{fisca.vl ? fmt(r.vl) : '—'}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums font-bold text-brand">{fmt(r.du)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums font-bold text-green-400">{fmt(r.net)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-bg-border font-bold">
                <td className="py-2.5 px-2">Total {anneeSel || 'général'}</td>
                <td className="py-2.5 px-2"></td>
                <td className="py-2.5 px-2"></td>
                <td className="py-2.5 px-2 text-right tabular-nums">{fmt(total.ca)}</td>
                <td className="py-2.5 px-2 text-right tabular-nums">{fmt(total.cot)}</td>
                <td className="py-2.5 px-2 text-right tabular-nums">{fmt(total.cfp)}</td>
                <td className="py-2.5 px-2 text-right tabular-nums">{fisca.vl ? fmt(total.vl) : '—'}</td>
                <td className="py-2.5 px-2 text-right tabular-nums text-brand">{fmt(total.du)}</td>
                <td className="py-2.5 px-2 text-right tabular-nums text-green-400">{fmt(total.net)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
