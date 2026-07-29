'use client'

import { useState } from 'react'
import { useOperations } from '@/hooks/useOperations'
import { useDocuments } from '@/hooks/useDocuments'
import { useAuth } from '@/hooks/useAuth'
import { addOperation, updateOperation, deleteOperation } from '@/lib/firestore/operations'
import { fmt } from '@/lib/calc'
import { Plus, Trash2, Pencil, Wallet, FileText, EyeOff, Eye } from 'lucide-react'
import { clsx } from 'clsx'
import type { Operation, TypeOperation } from '@/lib/types'

const emptyForm = { date: new Date().toISOString().split('T')[0], type: 'revenu' as TypeOperation, categorie: '', description: '', montant: '' }

const CATEGORIES_REVENU = ['Avance sur contrat', 'Composition (film/pub)', 'Droits voisins', 'Sync / licensing', 'Autre']
const CATEGORIES_DEPENSE = ['Studio', 'Matériel', 'Logiciel / plugin', 'Marketing', 'Formation', 'Autre']

export default function OperationsModule() {
  const { user } = useAuth()
  const { operations, loading } = useOperations()
  const { documents } = useDocuments()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const revenus = operations.filter((o) => o.type === 'revenu').reduce((s, o) => s + o.montant, 0)
  const depenses = operations.filter((o) => o.type === 'depense').reduce((s, o) => s + o.montant, 0)

  function docsFor(o: Operation) {
    return documents.filter((d) => d.lien && d.lien.kind === 'operation' && (d.lien.ref === o.id || d.lien.ref === o.description))
  }

  function openNew() {
    setEditId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(o: Operation) {
    setEditId(o.id)
    setForm({ date: o.date, type: o.type, categorie: o.categorie, description: o.description, montant: String(o.montant) })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.date || form.montant === '') { alert('Renseignez au moins la date et le montant.'); return }
    setSaving(true)
    const rec = {
      date: form.date, type: form.type, categorie: form.categorie.trim(),
      description: form.description.trim(), montant: parseFloat(form.montant) || 0, exclu: false,
    }
    if (editId) await updateOperation(user.uid, editId, rec)
    else await addOperation(user.uid, rec)
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
    setSaving(false)
  }

  const sorted = [...operations].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const categories = form.type === 'revenu' ? CATEGORIES_REVENU : CATEGORIES_DEPENSE

  if (loading) return <div className="text-text-muted animate-pulse">Chargement...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-6">
          <div><p className="text-text-muted text-xs">Revenus</p><p className="text-green-400 font-bold text-lg tabular-nums">+{fmt(revenus)}</p></div>
          <div><p className="text-text-muted text-xs">Dépenses</p><p className="text-red-400 font-bold text-lg tabular-nums">−{fmt(depenses)}</p></div>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-brand text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus size={16} /> Ajouter une ligne
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm">{editId ? 'Modifier la ligne' : 'Nouvelle ligne'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Type *</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TypeOperation, categorie: '' }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
                <option value="revenu">Revenu</option>
                <option value="depense">Dépense</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Date *</label>
              <input required type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Catégorie</label>
              <input list="cat-options" value={form.categorie} onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" placeholder="Ex: Studio" />
              <datalist id="cat-options">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Montant (€) *</label>
              <input required type="number" step="0.01" min="0" value={form.montant} onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" placeholder="0.00" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-text-muted block mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" placeholder="Ex: Avance Because" />
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

      {operations.length === 0 && !showForm && (
        <div className="text-center py-16 text-text-muted">
          <Wallet size={40} className="mx-auto mb-3 text-text-faint" />
          <p className="font-medium">Aucune opération enregistrée</p>
          <p className="text-sm mt-1">Avances, achats de matériel, sync... ajoutez votre première ligne.</p>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((o) => {
          const docs = docsFor(o)
          return (
            <div key={o.id} className={clsx('bg-bg-card border border-bg-border rounded-xl p-4 flex items-center justify-between gap-3', o.exclu && 'opacity-50')}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm truncate">{o.description || o.categorie || '—'}</p>
                  {docs.length > 0 && <span className="inline-flex items-center gap-1 text-xs text-text-muted"><FileText size={12} />{docs.length}</span>}
                </div>
                <p className="text-text-muted text-xs mt-0.5">
                  {o.categorie ? `${o.categorie} · ` : ''}{new Date(o.date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={clsx('font-bold tabular-nums text-sm', o.type === 'revenu' ? 'text-green-400' : 'text-red-400')}>
                  {o.type === 'revenu' ? '+' : '−'}{fmt(o.montant)}
                </span>
                <button onClick={() => user && updateOperation(user.uid, o.id, { exclu: !o.exclu })} title={o.exclu ? 'Réintégrer' : 'Exclure des stats'}
                  className="text-text-faint hover:text-text-primary transition-colors p-1">
                  {o.exclu ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => openEdit(o)} className="text-text-faint hover:text-brand transition-colors p-1"><Pencil size={14} /></button>
                <button
                  onClick={() => { if (user && confirm('Supprimer cette ligne ?')) deleteOperation(user.uid, o.id) }}
                  className="text-text-faint hover:text-red-400 transition-colors p-1"><Trash2 size={15} /></button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
