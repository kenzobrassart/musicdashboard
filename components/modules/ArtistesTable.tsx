'use client'

import { useState } from 'react'
import { useArtistes } from '@/hooks/useArtistes'
import { useAuth } from '@/hooks/useAuth'
import { addArtiste, deleteArtiste } from '@/lib/firestore/artistes'
import { UserPlus, Trash2, User } from 'lucide-react'
import { clsx } from 'clsx'

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Électronique', 'Classique', 'R&B', 'Autre']

export default function ArtistesTable() {
  const { user } = useAuth()
  const { artistes, loading } = useArtistes()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', genre: '' })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.nom.trim()) return
    setSaving(true)
    await addArtiste(user.uid, form)
    setForm({ nom: '', prenom: '', email: '', telephone: '', genre: '' })
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!user || !confirm('Supprimer cet artiste ?')) return
    await deleteArtiste(user.uid, id)
  }

  if (loading) return <div className="text-text-muted animate-pulse">Chargement...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm">{artistes.length} artiste{artistes.length > 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <UserPlus size={16} />
          Ajouter
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm">Nouvel artiste</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Nom *</label>
              <input
                required
                value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                placeholder="Dupont"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Prénom</label>
              <input
                value={form.prenom}
                onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                placeholder="jean@exemple.fr"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Téléphone</label>
              <input
                value={form.telephone}
                onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                placeholder="06 00 00 00 00"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted block mb-1">Genre musical</label>
              <select
                value={form.genre}
                onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              >
                <option value="">Sélectionner...</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
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

      {artistes.length === 0 && !showForm && (
        <div className="text-center py-16 text-text-muted">
          <User size={40} className="mx-auto mb-3 text-text-faint" />
          <p className="font-medium">Aucun artiste enregistré</p>
          <p className="text-sm mt-1">Ajoutez votre premier artiste pour commencer.</p>
        </div>
      )}

      <div className="space-y-2">
        {artistes.map(a => (
          <div key={a.id} className="bg-bg-card border border-bg-border rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                <span className="text-brand font-bold text-sm">{a.nom[0]?.toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{a.prenom} {a.nom}</p>
                <p className="text-text-muted text-xs truncate">{a.email ?? a.genre ?? '—'}</p>
              </div>
            </div>
            {a.genre && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand shrink-0 hidden sm:block">{a.genre}</span>
            )}
            <button
              onClick={() => handleDelete(a.id)}
              className="text-text-faint hover:text-red-400 transition-colors shrink-0 p-1"
              aria-label="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
