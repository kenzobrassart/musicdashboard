'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProfil } from '@/hooks/useProfil'
import { useFisca } from '@/hooks/useFisca'
import { TAUX_URSSAF } from '@/lib/types'
import { Landmark, ArrowRight } from 'lucide-react'

export default function ParametresModule() {
  const { profil, loading, update } = useProfil()
  const { fisca } = useFisca()
  const [form, setForm] = useState(profil)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setForm(profil) }, [profil])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await update(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="text-text-muted animate-pulse">Chargement...</div>

  return (
    <div className="space-y-4 max-w-2xl">
      <form onSubmit={handleSubmit} className="card-glass p-5 space-y-4 animate-fade-in-up">
        <div>
          <h3 className="font-semibold text-sm">Émetteur des factures</h3>
          <p className="text-text-faint text-xs mt-0.5">Ces informations apparaissent sur chaque facture PDF générée.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs text-text-muted block mb-1">Nom / activité *</label>
            <input required value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} className="w-full field" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-text-muted block mb-1">Adresse</label>
            <input value={form.adresse} onChange={(e) => setForm((p) => ({ ...p, adresse: e.target.value }))} className="w-full field" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">SIRET</label>
            <input value={form.siret} onChange={(e) => setForm((p) => ({ ...p, siret: e.target.value }))} className="w-full field" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full field" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Téléphone</label>
            <input value={form.telephone} onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))} className="w-full field" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">TVA</label>
            <label className="field flex items-center gap-2 h-[42px]">
              <input type="checkbox" checked={form.mentionTvaDefaut} onChange={(e) => setForm((p) => ({ ...p, mentionTvaDefaut: e.target.checked }))} />
              <span className="text-sm">TVA applicable par défaut</span>
            </label>
          </div>
        </div>

        <div className="border-t border-white/[0.08] pt-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Coordonnées bancaires</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs text-text-muted block mb-1">IBAN</label>
              <input value={form.iban} onChange={(e) => setForm((p) => ({ ...p, iban: e.target.value }))} className="w-full field" /></div>
            <div><label className="text-xs text-text-muted block mb-1">BIC</label>
              <input value={form.bic} onChange={(e) => setForm((p) => ({ ...p, bic: e.target.value }))} className="w-full field" /></div>
          </div>
        </div>

        <div className="border-t border-white/[0.08] pt-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Identifiants professionnels (musique)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Numéro SACEM</label>
              <input value={form.numeroSacem} onChange={(e) => setForm((p) => ({ ...p, numeroSacem: e.target.value }))}
                className="w-full field" placeholder="Numéro d'auteur/éditeur" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Autre identifiant (IPI, CAE, ISWC...)</label>
              <input value={form.autreIdentifiant} onChange={(e) => setForm((p) => ({ ...p, autreIdentifiant: e.target.value }))}
                className="w-full field" />
            </div>
          </div>
          <p className="text-text-faint text-[11px] mt-2">Renseignés ici, ces identifiants apparaissent automatiquement sur tes factures PDF.</p>
        </div>

        <div className="flex items-center gap-3 justify-end pt-1">
          {saved && <span className="text-green-400 text-xs animate-pop-in">Enregistré ✓</span>}
          <button type="submit" className="btn-primary">Enregistrer</button>
        </div>
      </form>

      <Link href="/fiscalite" className="card-glass p-5 flex items-center justify-between gap-3 hover:-translate-y-0.5 transition-transform duration-200 group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Landmark size={18} />
          </div>
          <div>
            <p className="font-medium text-sm">Régime fiscal</p>
            <p className="text-text-muted text-xs mt-0.5">
              {fisca.regime === '25.6' || fisca.regime === '21.2' ? 'BNC' : 'BIC'} — {fisca.taux} % · CFP {fisca.cfp} %{fisca.vl ? ` · VL ${fisca.vl} %` : ''}
            </p>
          </div>
        </div>
        <ArrowRight size={16} className="text-text-faint shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </div>
  )
}
