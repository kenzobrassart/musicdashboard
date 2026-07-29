'use client'

import { useState } from 'react'
import { useFactures } from '@/hooks/useFactures'
import { useArtistes } from '@/hooks/useArtistes'
import { useAuth } from '@/hooks/useAuth'
import { addFacture, deleteFacture, updateFacture } from '@/lib/firestore/factures'
import { Timestamp } from 'firebase/firestore'
import { Plus, Trash2, FileText } from 'lucide-react'
import { clsx } from 'clsx'
import type { StatutFacture } from '@/lib/types'

const STATUTS: { value: StatutFacture; label: string; color: string }[] = [
  { value: 'brouillon', label: 'Brouillon', color: 'bg-text-faint/20 text-text-muted' },
  { value: 'envoyee', label: 'Envoyée', color: 'bg-blue-400/10 text-blue-400' },
  { value: 'payee', label: 'Payée', color: 'bg-green-400/10 text-green-400' },
  { value: 'en_retard', label: 'En retard', color: 'bg-red-400/10 text-red-400' },
]

const TVA_OPTIONS = [0, 5.5, 10, 20]

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

function genNumero(factures: { numero: string }[]) {
  const year = new Date().getFullYear()
  const count = factures.filter(f => f.numero.startsWith(`FAC-${year}`)).length + 1
  return `FAC-${year}-${String(count).padStart(3, '0')}`
}

export default function FacturesModule() {
  const { user } = useAuth()
  const { factures, loading } = useFactures()
  const { artistes } = useArtistes()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client: '', artisteId: '', description: '',
    montantHT: '', tva: '20',
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0],
    statut: 'brouillon' as StatutFacture,
  })

  const montantTTC = form.montantHT
    ? parseFloat(form.montantHT) * (1 + parseFloat(form.tva) / 100)
    : 0

  const totalEnAttente = factures
    .filter(f => f.statut === 'envoyee' || f.statut === 'en_retard')
    .reduce((s, f) => s + f.montantTTC, 0)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.client || !form.montantHT) return
    setSaving(true)
    const ht = parseFloat(form.montantHT)
    const tva = parseFloat(form.tva)
    await addFacture(user.uid, {
      numero: genNumero(factures),
      client: form.client,
      artisteId: form.artisteId || undefined,
      description: form.description,
      montantHT: ht,
      tva,
      montantTTC: ht * (1 + tva / 100),
      statut: form.statut,
      dateEmission: Timestamp.fromDate(new Date(form.dateEmission)) as unknown as Date,
      dateEcheance: Timestamp.fromDate(new Date(form.dateEcheance)) as unknown as Date,
    })
    setForm({
      client: '', artisteId: '', description: '', montantHT: '', tva: '20',
      dateEmission: new Date().toISOString().split('T')[0],
      dateEcheance: new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0],
      statut: 'brouillon',
    })
    setShowForm(false)
    setSaving(false)
  }

  async function handleStatutChange(id: string, statut: StatutFacture) {
    if (!user) return
    await updateFacture(user.uid, id, { statut })
  }

  if (loading) return <div className="text-text-muted animate-pulse">Chargement...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-sm">{factures.length} facture{factures.length > 1 ? 's' : ''}</p>
          {totalEnAttente > 0 && (
            <p className="text-yellow-400 font-bold text-lg tabular-nums">{fmt(totalEnAttente)} en attente</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Nouvelle facture
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm">Nouvelle facture</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Client *</label>
              <input
                required value={form.client}
                onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                placeholder="Nom du client"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Artiste lié</label>
              <select
                value={form.artisteId}
                onChange={e => setForm(f => ({ ...f, artisteId: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              >
                <option value="">— Aucun —</option>
                {artistes.map(a => <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Montant HT (€) *</label>
              <input
                required type="number" step="0.01" min="0"
                value={form.montantHT}
                onChange={e => setForm(f => ({ ...f, montantHT: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">TVA (%)</label>
              <select
                value={form.tva}
                onChange={e => setForm(f => ({ ...f, tva: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              >
                {TVA_OPTIONS.map(t => <option key={t} value={t}>{t}%</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Date d'émission</label>
              <input
                type="date" value={form.dateEmission}
                onChange={e => setForm(f => ({ ...f, dateEmission: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Date d'échéance</label>
              <input
                type="date" value={form.dateEcheance}
                onChange={e => setForm(f => ({ ...f, dateEcheance: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted block mb-1">Description / Objet</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                placeholder="Ex: Prestation concert + frais techniques"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted block mb-1">Statut</label>
              <select
                value={form.statut}
                onChange={e => setForm(f => ({ ...f, statut: e.target.value as StatutFacture }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              >
                {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          {form.montantHT && (
            <div className="bg-bg-primary rounded-lg p-3 text-sm">
              <span className="text-text-muted">Total TTC : </span>
              <span className="font-bold text-brand tabular-nums">{fmt(montantTTC)}</span>
            </div>
          )}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-lg border border-bg-border hover:bg-bg-card transition-colors">Annuler</button>
            <button type="submit" disabled={saving} className="text-sm bg-brand text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {factures.length === 0 && !showForm && (
        <div className="text-center py-16 text-text-muted">
          <FileText size={40} className="mx-auto mb-3 text-text-faint" />
          <p className="font-medium">Aucune facture créée</p>
          <p className="text-sm mt-1">Créez votre première facture pour commencer.</p>
        </div>
      )}

      <div className="space-y-2">
        {factures.map(f => {
          const artiste = artistes.find(a => a.id === f.artisteId)
          const statut = STATUTS.find(s => s.value === f.statut)!
          const dateEmission = f.dateEmission instanceof Date ? f.dateEmission : (f.dateEmission as any)?.toDate?.()
          const dateEcheance = f.dateEcheance instanceof Date ? f.dateEcheance : (f.dateEcheance as any)?.toDate?.()
          return (
            <div key={f.id} className="bg-bg-card border border-bg-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-mono text-xs text-text-muted">{f.numero}</p>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', statut.color)}>{statut.label}</span>
                  </div>
                  <p className="font-medium text-sm mt-0.5">{f.client}</p>
                  <p className="text-text-muted text-xs">
                    {artiste ? `${artiste.prenom} ${artiste.nom} · ` : ''}
                    {dateEmission ? dateEmission.toLocaleDateString('fr-FR') : ''}
                    {dateEcheance ? ` → échéance ${dateEcheance.toLocaleDateString('fr-FR')}` : ''}
                  </p>
                  {f.description && <p className="text-text-faint text-xs mt-1 italic">{f.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-brand font-bold tabular-nums text-sm">{fmt(f.montantTTC)}</span>
                  <p className="text-text-faint text-xs">HT: {fmt(f.montantHT)} · TVA {f.tva}%</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={f.statut}
                      onChange={e => handleStatutChange(f.id, e.target.value as StatutFacture)}
                      className="text-xs bg-bg-primary border border-bg-border rounded-lg px-2 py-1 focus:outline-none focus:border-brand"
                    >
                      {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <button
                      onClick={() => user && deleteFacture(user.uid, f.id)}
                      className="text-text-faint hover:text-red-400 transition-colors p-1"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
