'use client'

import { useMemo } from 'react'
import { useCachets } from '@/hooks/useCachets'
import { useOperations } from '@/hooks/useOperations'
import { brut, part, qte, nbComp, encaissementsParMois, fmt, fmtMois } from '@/lib/calc'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import ErrorBanner from '@/components/ui/ErrorBanner'

export default function StatistiquesModule() {
  const { cachets, loading: l1, error: e1 } = useCachets()
  const { operations, loading: l2, error: e2 } = useOperations()

  const sc = useMemo(() => cachets.filter((c) => !c.exclu), [cachets])

  const parArtiste = useMemo(() => {
    const byArtiste: Record<string, { artiste: string; prods: number; brut: number; part: number; encaisse: number; attente: number }> = {}
    sc.forEach((c) => {
      const a = c.artiste || '(sans artiste)'
      if (!byArtiste[a]) byArtiste[a] = { artiste: a, prods: 0, brut: 0, part: 0, encaisse: 0, attente: 0 }
      const e = byArtiste[a]
      const p = part(c)
      e.prods += qte(c); e.brut += brut(c); e.part += p
      if (c.paye) e.encaisse += p; else e.attente += p
    })
    return Object.values(byArtiste).sort((a, b) => b.part - a.part)
  }, [sc])

  const sBrut = sc.reduce((s, c) => s + brut(c), 0)
  const sPart = sc.reduce((s, c) => s + part(c), 0)
  const sEnc = sc.filter((c) => c.paye).reduce((s, c) => s + part(c), 0)
  const sAtt = sPart - sEnc
  const sProds = sc.reduce((s, c) => s + qte(c), 0)
  const coprods = sc.filter((c) => nbComp(c) > 1 || part(c) < brut(c)).length

  const monthly = useMemo(() => {
    const map = encaissementsParMois(cachets, operations, true)
    return Object.keys(map).sort().map((m) => ({ mois: fmtMois(m), total: map[m].cachets + map[m].autres }))
  }, [cachets, operations])

  const exclus = [
    ...cachets.filter((c) => c.exclu).map((c) => `${c.son || '(sans nom)'} — ${fmt(part(c))}`),
    ...operations.filter((o) => o.exclu).map((o) => `${o.description || o.categorie} — ${fmt(o.montant)}`),
  ]

  const kpis = [
    { label: 'Cachet brut moyen', value: sProds ? fmt(sBrut / sProds) : '—' },
    { label: 'Ma part moyenne', value: sProds ? fmt(sPart / sProds) : '—' },
    { label: 'Taux de partage', value: sBrut ? Math.round((sPart / sBrut) * 100) + ' %' : '—' },
    { label: "Taux d'encaissement", value: sPart ? Math.round((sEnc / sPart) * 100) + ' %' : '—' },
    { label: 'Co-productions', value: `${coprods} / ${sc.length}` },
    { label: 'Meilleur client', value: parArtiste.length ? parArtiste[0].artiste : '—' },
  ]

  const error = e1 || e2
  if (error) return <ErrorBanner message={error} />
  if (l1 || l2) return <div className="text-text-muted animate-pulse">Chargement...</div>

  return (
    <div className="space-y-6">
      <p className="text-text-muted text-sm">Calculées sur les lignes comptées ({sc.length} cachets)</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-bg-card border border-bg-border rounded-xl p-4">
            <p className="text-text-muted text-xs">{k.label}</p>
            <p className="text-xl font-bold tabular-nums mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {monthly.length > 0 && (
        <div className="bg-bg-card border border-bg-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4 text-text-muted uppercase tracking-wide">Encaissements par mois</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2b2b" vertical={false} />
                <XAxis dataKey="mois" stroke="#9e9a97" fontSize={12} />
                <YAxis stroke="#9e9a97" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#211f1f', border: '1px solid #2e2b2b', borderRadius: 8, fontSize: 13 }}
                  formatter={(v: number) => fmt(v)}
                />
                <Bar dataKey="total" fill="#ff563c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-text-faint text-xs mt-2">Total cumulé : {fmt(monthly.reduce((s, m) => s + m.total, 0))}</p>
        </div>
      )}

      {parArtiste.length > 0 && (
        <div className="bg-bg-card border border-bg-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4 text-text-muted uppercase tracking-wide">Par artiste</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-text-muted text-xs uppercase tracking-wide border-b border-bg-border">
                  <th className="text-left font-medium py-2 px-2">Artiste</th>
                  <th className="text-right font-medium py-2 px-2">Prods</th>
                  <th className="text-right font-medium py-2 px-2">Brut</th>
                  <th className="text-right font-medium py-2 px-2">Ma part</th>
                  <th className="text-right font-medium py-2 px-2">%</th>
                  <th className="text-right font-medium py-2 px-2">Encaissé</th>
                  <th className="text-right font-medium py-2 px-2">En attente</th>
                </tr>
              </thead>
              <tbody>
                {parArtiste.map((a) => (
                  <tr key={a.artiste} className="border-b border-bg-border/50">
                    <td className="py-2.5 px-2 font-medium">{a.artiste}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums">{a.prods}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums">{fmt(a.brut)}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums font-bold text-brand">{fmt(a.part)}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-text-muted">{a.brut ? Math.round((a.part / a.brut) * 100) + ' %' : '—'}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-green-400">{a.encaisse ? fmt(a.encaisse) : '—'}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-yellow-400">{a.attente ? fmt(a.attente) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-bg-border font-bold">
                  <td className="py-2.5 px-2">Total</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{sProds}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{fmt(sBrut)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-brand">{fmt(sPart)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{sBrut ? Math.round((sPart / sBrut) * 100) + ' %' : '—'}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-green-400">{fmt(sEnc)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-yellow-400">{fmt(sAtt)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {exclus.length > 0 && (
        <p className="text-text-faint text-xs">
          {exclus.length} élément(s) exclu(s) des statistiques (toujours comptés dans la synthèse et la fiscalité) : {exclus.join(' · ')}
        </p>
      )}
    </div>
  )
}
