'use client'

import { useState } from 'react'
import { useClients } from '@/hooks/useClients'
import { useAuth } from '@/hooks/useAuth'
import { addClient, updateClient, deleteClient } from '@/lib/firestore/clients'
import { UserPlus, Trash2, Pencil, Building2 } from 'lucide-react'
import ErrorBanner from '@/components/ui/ErrorBanner'
import type { Client } from '@/lib/types'

const emptyForm = { nom: '', contact: '', email: '', telephone: '', adresse: '', siret: '', tvaIntracom: '', notes: '' }

export default function ClientsModule() {
  const { user } = useAuth()
  const { clients, loading, error } = useClients()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  function openNew() {
    setEditId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(c: Client) {
    setEditId(c.id)
    setForm({
      nom: c.nom, contact: c.contact || '', email: c.email || '', telephone: c.telephone || '',
      adresse: c.adresse || '', siret: c.siret || '', tvaIntracom: c.tvaIntracom || '', notes: c.notes || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.nom.trim()) return
    setSaving(true)
    if (editId) await updateClient(user.uid, editId, form)
    else await addClient(user.uid, form)
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!user || !confirm('Supprimer ce client ?')) return
    await deleteClient(user.uid, id)
  }

  if (error) return <ErrorBanner message={error} />
  if (loading) return <div className="text-text-muted animate-pulse">Chargement...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm">{clients.length} client{clients.length > 1 ? 's' : ''}</p>
        <button onClick={openNew} className="flex items-center gap-2 bg-brand text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <UserPlus size={16} /> Ajouter
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm">{editId ? 'Modifier le client' : 'Nouveau client'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Nom / raison sociale *</label>
              <input required value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" placeholder="Label, artiste, société..." />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Contact</label>
              <input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" placeholder="Nom du contact" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Téléphone</label>
              <input value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted block mb-1">Adresse</label>
              <input value={form.adresse} onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" placeholder="Adresse de facturation" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">SIRET</label>
              <input value={form.siret} onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">TVA intracommunautaire</label>
              <input value={form.tvaIntracom} onChange={(e) => setForm((f) => ({ ...f, tvaIntracom: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted block mb-1">Notes</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-lg border border-bg-border hover:bg-bg-card transition-colors">Annuler</button>
            <button type="submit" disabled={saving} className="text-sm bg-brand text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
              {saving ? 'Enregistrement...' : editId ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}

      {clients.length === 0 && !showForm && (
        <div className="text-center py-16 text-text-muted">
          <Building2 size={40} className="mx-auto mb-3 text-text-faint" />
          <p className="font-medium">Aucun client enregistré</p>
          <p className="text-sm mt-1">Ajoutez votre premier client pour pouvoir lui créer des factures.</p>
        </div>
      )}

      <div className="space-y-2">
        {clients.map((c) => (
          <div key={c.id} className="bg-bg-card border border-bg-border rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                <span className="text-brand font-bold text-sm">{c.nom[0]?.toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{c.nom}</p>
                <p className="text-text-muted text-xs truncate">{c.email || c.contact || c.siret || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => openEdit(c)} className="text-text-faint hover:text-brand transition-colors p-1"><Pencil size={15} /></button>
              <button onClick={() => handleDelete(c.id)} className="text-text-faint hover:text-red-400 transition-colors p-1" aria-label="Supprimer"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
