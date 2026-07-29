'use client'

import { useState } from 'react'
import { useConcerts } from '@/hooks/useConcerts'
import { useArtistes } from '@/hooks/useArtistes'
import { useAuth } from '@/hooks/useAuth'
import { addConcert, deleteConcert, updateConcert } from '@/lib/firestore/concerts'
import { Timestamp } from 'firebase/firestore'
import { Plus, Trash2, Music, MapPin } from 'lucide-react'
import { clsx } from 'clsx'
import type { StatutConcert } from '@/lib/types'

const STATUTS: { value: StatutConcert; label: string; color: string }[] = [
  { value: 'confirme', label: 'Confirmé', color: 'bg-green-400/10 text-green-400' },
  { value: 'en_attente', label: 'En attente', color: 'bg-yellow-400/10 text-yellow-400' },
  { value: 'annule', label: 'Annulé', color: 'bg-red-400/10 text-red-400' },
]

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function ConsertsModule() {
  const { user } = useAuth()
  const { concerts, loading } = useConcerts()
  const { artistes } = useArtistes()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    artisteId: '', lieu: '', ville: '',
    date: new Date().toISOString().split('T')[0],
    cachet: '', statut: 'en_attente' as StatutConcert, notes: ''
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.lieu || !form.ville) return
    setSaving(true)
    await addConcert(user.uid, {
      artisteId: form.artisteId,
      lieu: form.lieu,
      ville: form.ville,
      date: Timestamp.fromDate(new Date(form.date)) as unknown as Date,
      cachet: parseFloat(form.cachet) || 0,
      statut: form.statut,
      notes: form.notes,
    })
    setForm({ artisteId: '', lieu: '', ville: '', date: new Date().toISOString().split('T')[0], cachet: '', statut: 'en_attente', notes: '' })
    setShowForm(false)
    setSaving(false)
  }

  async function handleStatutChange(id: string, statut: StatutConcert) {
    if (!user) return
    await updateConcert(user.uid, id, { statut })
  }

  if (loading) return <div className="text-text-muted animate-pulse">Chargement...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm">{concerts.length} concert{concerts.length > 1 ? 's' : ''}</p>
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
          <h3 className="font-semibold text-sm">Nouveau concert</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Lieu / Salle *</label>
              <input
                required value={form.lieu}
                onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                placeholder="L'Olympia"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Ville *</label>
              <input
                required value={form.ville}
                onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                placeholder="Paris"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Date *</label>
              <input
                required type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Cachet (€)</label>
              <input
                type="number" step="0.01" min="0" value={form.cachet}
                onChange={e => setForm(f => ({ ...f, cachet: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                placeholder="0.00"
              />
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
            <div>
              <label className="text-xs text-text-muted block mb-1">Statut</label>
              <select
                value={form.statut}
                onChange={e => setForm(f => ({ ...f, statut: e.target.value as StatutConcert }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              >
                {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted block mb-1">Notes</label>
              <input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                placeholder="Infos supplémentaires..."
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

      {concerts.length === 0 && !showForm && (
        <div className="text-center py-16 text-text-muted">
          <Music size={40} className="mx-auto mb-3 text-text-faint" />
          <p className="font-medium">Aucun concert enregistré</p>
          <p className="text-sm mt-1">Ajoutez votre premier concert pour commencer.</p>
        </div>
      )}

      <div className="space-y-2">
        {concerts.map(c => {
          const artiste = artistes.find(a => a.id === c.artisteId)
          const statut = STATUTS.find(s => s.value === c.statut)!
          const date = c.date instanceof Date ? c.date : (c.date as any)?.toDate?.()
          return (
            <div key={c.id} className="bg-bg-card border border-bg-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{c.lieu}</p>
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', statut.color)}>{statut.label}</span>
                  </div>
                  <p className="text-text-muted text-xs mt-0.5 flex items-center gap-1">
                    <MapPin size={10} />
                    {c.ville}{artiste ? ` · ${artiste.prenom} ${artiste.nom}` : ''}
                    {date ? ` · ${date.toLocaleDateString('fr-FR')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.cachet > 0 && <span className="text-green-400 font-bold tabular-nums text-sm">{fmt(c.cachet)}</span>}
                  <select
                    value={c.statut}
                    onChange={e => handleStatutChange(c.id, e.target.value as StatutConcert)}
                    className="text-xs bg-bg-primary border border-bg-border rounded-lg px-2 py-1 focus:outline-none focus:border-brand"
                  >
                    {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <button
                    onClick={() => user && deleteConcert(user.uid, c.id)}
                    className="text-text-faint hover:text-red-400 transition-colors p-1"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {c.notes && <p className="text-text-faint text-xs mt-2 italic">{c.notes}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
