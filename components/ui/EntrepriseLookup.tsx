'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Loader2, Building2 } from 'lucide-react'
import { searchEntreprises, type EntrepriseResult } from '@/lib/sirene'

// Champ de recherche d'entreprise (annuaire officiel gratuit) : tape un nom
// ou un SIREN/SIRET, clique un résultat, et le formulaire appelant reçoit
// nom/SIRET/adresse/TVA prêts à remplir — plus besoin de tout retaper.
export default function EntrepriseLookup({ onSelect, placeholder }: { onSelect: (r: EntrepriseResult) => void; placeholder?: string }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<EntrepriseResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setFailed(false)
      try {
        const r = await searchEntreprises(q)
        setResults(r)
        setOpen(true)
      } catch {
        setResults([])
        setFailed(true)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q])

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder || 'Chercher une entreprise (nom, SIREN, SIRET...)'}
          className="w-full field pl-8 pr-8"
        />
        {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint animate-spin" />}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1.5 w-full card-glass p-1.5 max-h-64 overflow-y-auto animate-fade-in-up">
            {failed && <p className="text-text-faint text-xs px-3 py-2">Recherche indisponible pour le moment — saisis les infos manuellement.</p>}
            {!failed && results.length === 0 && !loading && <p className="text-text-faint text-xs px-3 py-2">Aucun résultat.</p>}
            {results.map((r) => (
              <button
                key={r.siret || r.siren}
                type="button"
                onClick={() => { onSelect(r); setOpen(false); setQ(''); setResults([]) }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.07] transition-colors duration-150 flex items-start gap-2"
              >
                <Building2 size={14} className="text-brand shrink-0 mt-0.5" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">{r.nom}</span>
                  <span className="block text-xs text-text-muted truncate">{r.siren}{r.adresse ? ` · ${r.adresse}` : ''}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
