'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useClients } from '@/hooks/useClients'
import { useFactures } from '@/hooks/useFactures'
import { useAuth } from '@/hooks/useAuth'
import { addClient, updateClient, deleteClient } from '@/lib/firestore/clients'
import { fmt } from '@/lib/calc'
import { UserPlus, Trash2, Pencil, Building2, ChevronDown, FileText } from 'lucide-react'
import { clsx } from 'clsx'
import ErrorBanner from '@/components/ui/ErrorBanner'
import type { Client, StatutFacture } from '@/lib/types'

const STATUT_LABEL: Record<StatutFacture, string> = {
  brouillon: 'Brouillon', envoyee: 'Envoyée', payee: 'Payée', en_retard: 'En retard', annulee: 'Annulée',
}
const STATUT_COLOR: Record<StatutFacture, string> = {
  brouillon: 'bg-text-faint/20 text-text-muted', envoyee: 'bg-blue-400/10 text-blue-400',
  payee: 'bg-green-400/10 text-green-400', en_retard: 'bg-red-400/10 text-red-400', annulee: 'bg-text-faint/20 text-text-faint line-through',
}

const emptyForm = { nom: '', contact: '', email: '', telephone: '', adresse: '', siret: '', tvaIntracom: '', notes: '' }

export default function ClientsModule() {
  const { user } = useAuth()
  const { clients, loading, error } = useClients()
  const { factures } = useFactures()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
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
        {clients.map((c) => {
          const clientFactures = factures.filter((f) => f.clientId === c.id).sort((a, b) => b.dateEmission.localeCompare(a.dateEmission))
          const caTotal = clientFactures.filter((f) => f.statut !== 'annulee').reduce((s, f) => s + f.montantTTC, 0)
          const expanded = expandedId === c.id
          return (
            <div key={c.id} className="bg-bg-card border border-bg-border rounded-xl overflow-hidden">
              <div className="w-full p-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => setExpandedId(expanded ? null : c.id)}
                  className="flex items-center gap-3 min-w-0 text-left flex-1"
                >
                  <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                    <span className="text-brand font-bold text-sm">{c.nom[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.nom}</p>
                    <p className="text-text-muted text-xs truncate">{c.email || c.contact || c.siret || '—'}</p>
                  </div>
                </button>
                <div className="flex items-center gap-3 shrink-0">
                  {clientFactures.length > 0 && (
                    <button onClick={() => setExpandedId(expanded ? null : c.id)} className="text-right hidden sm:block">
                      <p className="text-brand font-bold text-sm tabular-nums">{fmt(caTotal)}</p>
                      <p className="text-text-faint text-xs">{clientFactures.length} facture{clientFactures.length > 1 ? 's' : ''}</p>
                    </button>
                  )}
                  <button onClick={() => openEdit(c)} className="text-text-faint hover:text-brand transition-colors p-1"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-text-faint hover:text-red-400 transition-colors p-1" aria-label="Supprimer"><Trash2 size={16} /></button>
                  <button onClick={() => setExpandedId(expanded ? null : c.id)} aria-label={expanded ? 'Réduire' : 'Voir les factures'} className="text-text-faint hover:text-text-primary transition-colors p-1">
                    <ChevronDown size={16} className={clsx('transition-transform', expanded && 'rotate-180')} />
                  </button>
                </div>
              </div>
              {expanded && (
                <div className="border-t border-bg-border px-4 py-3 bg-bg-primary/40">
                  {clientFactures.length === 0 ? (
                    <p className="text-text-faint text-sm py-2">Aucune facture pour ce client pour l&apos;instant.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {clientFactures.map((f) => (
                        <Link key={f.id} href="/factures" className="flex items-center justify-between gap-3 text-sm py-1.5 hover:text-brand transition-colors">
                          <span className="flex items-center gap-2 min-w-0">
                            <FileText size={13} className="text-text-faint shrink-0" />
                            <span className="font-mono text-xs text-text-muted shrink-0">{f.numero}</span>
                            <span className="truncate">{f.son || f.categorie || ''}</span>
                          </span>
                          <span className="flex items-center gap-2 shrink-0">
                            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', STATUT_COLOR[f.statut])}>{STATUT_LABEL[f.statut]}</span>
                            <span className="tabular-nums font-medium">{fmt(f.montantTTC)}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
