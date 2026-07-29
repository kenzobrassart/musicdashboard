'use client'

import { useState } from 'react'
import { useRevenus } from '@/hooks/useRevenus'
import { useArtistes } from '@/hooks/useArtistes'
import { useAuth } from '@/hooks/useAuth'
import { addRevenu, deleteRevenu } from '@/lib/firestore/revenus'
import { Timestamp } from 'firebase/firestore'
import { Plus, Trash2, TrendingUp } from 'lucide-react'
import type { TypeRevenu } from '@/lib/types'

const TYPES: { value: TypeRevenu; label: string }[] = [
  { value: 'concert', label: 'Concert' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'droits_auteur', label: 'Droits d\'auteur' },
  { value: 'sync', label: 'Sync / Licensing' },
  { value: 'autre', label: 'Autre' },
]

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function RevenusModule() {
  const { user } = useAuth()
  const { revenus, loading } = useRevenus()
  const { artistes } = useArtistes()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    montant: '', type: 'concert' as TypeRevenu,
    description: '', date: new Date().toISOString().split('T')[0], artisteId: ''
  })

  const total = revenus.reduce((s, r) => s + r.montant, 0)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.montant) return
    setSaving(true)
    await addRevenu(user.uid, {
      montant: parseFloat(form.montant),
      type: form.type,
      description: form.description,
      date: Timestamp.fromDate(new Date(form.date)) as unknown as Date,
      artisteId: form.artisteId,
    })
    setForm({ montant: '', type: 'concert', description: '', date: new Date().toISOString().split('T')[0], artisteId: '' })
    setShowForm(false)
    setSaving(false)
  }

  if (loading) return <div className="text-text-muted animate-pulse">Chargement...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm">{revenus.length} entrée{revenus.length > 1 ? 's' : ''}</p>
          <p className="text-green-400 font-bold text-xl tabular-nums">{fmt(total)}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm">Nouveau revenu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Montant (€) *</label>
              <input
                required type="number" step="0.01" min="0"
                value={form.montant}
                onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Date *</label>
              <input
                required type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Type *</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as TypeRevenu }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              >
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Artiste</label>
              <select
                value={form.artisteId}
                onChange={e => setForm(f => ({ ...f, artisteId: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              >
                <option value="">— Aucun —</option>
                {artistes.map(a => <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted block mb-1">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                placeholder="Ex: Cachet Olympia 15/07"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-lg border border-bg-border hover:bg-bg-card transition-colors">Annuler</button>
            <button type="submit" disabled={saving} className="text-sm bg-brand text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {revenus.length === 0 && !showForm && (
        <div className="text-center py-16 text-text-muted">
          <TrendingUp size={40} className="mx-auto mb-3 text-text-faint" />
          <p className="font-medium">Aucun revenu enregistré</p>
          <p className="text-sm mt-1">Ajoutez votre premier revenu pour commencer.</p>
        </div>
      )}

      <div className="space-y-2">
        {revenus.map(r => {
          const artiste = artistes.find(a => a.id === r.artisteId)
          const date = r.date instanceof Date ? r.date : (r.date as any)?.toDate?.()
          return (
            <div key={r.id} className="bg-bg-card border border-bg-border rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{r.description || TYPES.find(t => t.value === r.type)?.label}</p>
                <p className="text-text-muted text-xs mt-0.5">
                  {artiste ? `${artiste.prenom} ${artiste.nom} · ` : ''}
                  {date ? date.toLocaleDateString('fr-FR') : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-green-400 font-bold tabular-nums text-sm">+{fmt(r.montant)}</span>
                <button
                  onClick={() => user && deleteRevenu(user.uid, r.id)}
                  className="text-text-faint hover:text-red-400 transition-colors p-1"
                  aria-label="Supprimer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
