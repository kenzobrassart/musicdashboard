'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useContacts } from '@/hooks/useContacts'
import { useFactures } from '@/hooks/useFactures'
import { useAuth } from '@/hooks/useAuth'
import { addContact, updateContact, deleteContact, renameContactEverywhere } from '@/lib/firestore/contacts'
import { fmt } from '@/lib/calc'
import { UserPlus, Trash2, Pencil, Users, ChevronDown, FileText } from 'lucide-react'
import { clsx } from 'clsx'
import ErrorBanner from '@/components/ui/ErrorBanner'
import EntrepriseLookup from '@/components/ui/EntrepriseLookup'
import type { Contact, StatutFacture } from '@/lib/types'
import type { EntrepriseResult } from '@/lib/sirene'

const STATUT_LABEL: Record<StatutFacture, string> = {
  brouillon: 'Brouillon', envoyee: 'Envoyée', payee: 'Payée', en_retard: 'En retard', annulee: 'Annulée',
}
const STATUT_COLOR: Record<StatutFacture, string> = {
  brouillon: 'bg-text-faint/20 text-text-muted', envoyee: 'bg-blue-400/10 text-blue-400',
  payee: 'bg-green-400/10 text-green-400', en_retard: 'bg-red-400/10 text-red-400', annulee: 'bg-text-faint/20 text-text-faint line-through',
}

const emptyForm = { nom: '', interlocuteur: '', email: '', telephone: '', adresse: '', siret: '', tvaIntracom: '', notes: '' }

export default function ContactsModule() {
  const { user } = useAuth()
  const { contacts, loading, error } = useContacts()
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

  const [editNomOrigine, setEditNomOrigine] = useState('')

  function openEdit(c: Contact) {
    setEditId(c.id)
    setEditNomOrigine(c.nom)
    setForm({
      nom: c.nom, interlocuteur: c.interlocuteur || '', email: c.email || '', telephone: c.telephone || '',
      adresse: c.adresse || '', siret: c.siret || '', tvaIntracom: c.tvaIntracom || '', notes: c.notes || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.nom.trim()) return
    setSaving(true)
    if (editId) {
      const { nom, ...rest } = form
      await updateContact(user.uid, editId, rest)
      // Renommer ici propage le nouveau nom sur les cachets/factures liés.
      if (nom.trim() !== editNomOrigine.trim()) await renameContactEverywhere(user.uid, editId, nom)
    } else {
      await addContact(user.uid, form)
    }
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
    setSaving(false)
  }

  function handleEntrepriseSelect(r: EntrepriseResult) {
    setForm((f) => ({
      ...f,
      nom: f.nom.trim() ? f.nom : r.nom,
      siret: r.siret || f.siret,
      adresse: r.adresse || f.adresse,
      tvaIntracom: r.tvaIntracom || f.tvaIntracom,
    }))
  }

  async function handleDelete(id: string) {
    if (!user || !confirm('Supprimer ce contact ?')) return
    await deleteContact(user.uid, id)
  }

  if (error) return <ErrorBanner message={error} />
  if (loading) return <div className="text-text-muted animate-pulse">Chargement...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm">{contacts.length} contact{contacts.length > 1 ? 's' : ''}</p>
        <button onClick={openNew} className="btn-primary">
          <UserPlus size={16} /> Ajouter
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-glass p-5 space-y-3 animate-fade-in-up">
          <h3 className="font-semibold text-sm">{editId ? 'Modifier le contact' : 'Nouveau contact'}</h3>
          <div>
            <label className="text-xs text-text-muted block mb-1">Recherche entreprise (auto-remplissage)</label>
            <EntrepriseLookup onSelect={handleEntrepriseSelect} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Nom / raison sociale *</label>
              <input required value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                className="w-full field" placeholder="Label, artiste, société..." />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Interlocuteur</label>
              <input value={form.interlocuteur} onChange={(e) => setForm((f) => ({ ...f, interlocuteur: e.target.value }))}
                className="w-full field" placeholder="Si différent du nom ci-dessus" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full field" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Téléphone</label>
              <input value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                className="w-full field" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted block mb-1">Adresse</label>
              <input value={form.adresse} onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
                className="w-full field" placeholder="Adresse de facturation" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">SIRET</label>
              <input value={form.siret} onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
                className="w-full field" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">TVA intracommunautaire</label>
              <input value={form.tvaIntracom} onChange={(e) => setForm((f) => ({ ...f, tvaIntracom: e.target.value }))}
                className="w-full field" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted block mb-1">Notes</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full field" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Enregistrement...' : editId ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}

      {contacts.length === 0 && !showForm && (
        <div className="text-center py-16 text-text-muted">
          <Users size={40} className="mx-auto mb-3 text-text-faint" />
          <p className="font-medium">Aucun contact pour l&apos;instant 🤝</p>
          <p className="text-sm mt-1">Le répertoire se remplit tout seul dès que tu saisis un artiste ou une facture — ou ajoute le premier ici.</p>
        </div>
      )}

      <div className="space-y-2">
        {contacts.map((c) => {
          const contactFactures = factures.filter((f) => f.contactId === c.id).sort((a, b) => b.dateEmission.localeCompare(a.dateEmission))
          const caTotal = contactFactures.filter((f) => f.statut !== 'annulee').reduce((s, f) => s + f.montantTTC, 0)
          const expanded = expandedId === c.id
          return (
            <div key={c.id} className="card-glass overflow-hidden">
              <div className="w-full p-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => setExpandedId(expanded ? null : c.id)}
                  className="flex items-center gap-3 min-w-0 text-left flex-1"
                >
                  <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105">
                    <span className="text-brand font-bold text-sm">{c.nom[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.nom}</p>
                    <p className="text-text-muted text-xs truncate">{c.email || c.interlocuteur || c.siret || '—'}</p>
                  </div>
                </button>
                <div className="flex items-center gap-3 shrink-0">
                  {contactFactures.length > 0 && (
                    <button onClick={() => setExpandedId(expanded ? null : c.id)} className="text-right hidden sm:block">
                      <p className="text-brand font-bold text-sm tabular-nums">{fmt(caTotal)}</p>
                      <p className="text-text-faint text-xs">{contactFactures.length} facture{contactFactures.length > 1 ? 's' : ''}</p>
                    </button>
                  )}
                  <button onClick={() => openEdit(c)} className="btn-ghost-icon hover:text-brand p-1"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(c.id)} className="btn-ghost-icon hover:text-red-400 p-1" aria-label="Supprimer"><Trash2 size={16} /></button>
                  <button onClick={() => setExpandedId(expanded ? null : c.id)} aria-label={expanded ? 'Réduire' : 'Voir les factures'} className="btn-ghost-icon hover:text-text-primary p-1">
                    <ChevronDown size={16} className={clsx('transition-transform duration-200', expanded && 'rotate-180')} />
                  </button>
                </div>
              </div>
              {expanded && (
                <div className="border-t border-white/[0.08] px-4 py-3 bg-black/10 animate-fade-in-up">
                  {contactFactures.length === 0 ? (
                    <p className="text-text-faint text-sm py-2">Aucune facture pour ce contact pour l&apos;instant.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {contactFactures.map((f) => (
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
