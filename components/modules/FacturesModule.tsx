'use client'

import { useState } from 'react'
import { useFactures } from '@/hooks/useFactures'
import { useContacts } from '@/hooks/useContacts'
import { useDocuments } from '@/hooks/useDocuments'
import { useAuth } from '@/hooks/useAuth'
import { useProfil } from '@/hooks/useProfil'
import { addFacture, updateFacture, deleteFacture, genNumeroFacture } from '@/lib/firestore/factures'
import { addCachet, updateCachet, deleteCachet } from '@/lib/firestore/cachets'
import { addOperation, updateOperation, deleteOperation } from '@/lib/firestore/operations'
import { ensureContact, renameContactEverywhere } from '@/lib/firestore/contacts'
import { useCachets } from '@/hooks/useCachets'
import { useOperations } from '@/hooks/useOperations'
import { uploadDocumentFile, addDocument, updateDocument, deleteDocument } from '@/lib/firestore/documents'
import { fmt } from '@/lib/calc'
import { downloadCsv } from '@/lib/csv'
import ErrorBanner from '@/components/ui/ErrorBanner'
import { Plus, Trash2, Pencil, FileText, Download, Settings, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { Facture, StatutFacture, NatureFacture, LigneFacture, Contact } from '@/lib/types'

const STATUTS: { value: StatutFacture; label: string; color: string }[] = [
  { value: 'brouillon', label: 'Brouillon', color: 'bg-text-faint/20 text-text-muted' },
  { value: 'envoyee', label: 'Envoyée', color: 'bg-blue-400/10 text-blue-400' },
  { value: 'payee', label: 'Payée', color: 'bg-green-400/10 text-green-400' },
  { value: 'en_retard', label: 'En retard', color: 'bg-red-400/10 text-red-400' },
  { value: 'annulee', label: 'Annulée', color: 'bg-text-faint/20 text-text-faint line-through' },
]
const TVA_OPTIONS = [5.5, 10, 20]
const todayIso = () => new Date().toISOString().split('T')[0]
const plus30 = () => new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0]

const emptyLigne = (): LigneFacture => ({ description: '', quantite: 1, prixUnitaire: 0 })

const emptyForm = () => ({
  contactNom: '', nature: 'cachet' as NatureFacture, son: '', coauteurs: [] as string[], categorie: '',
  lignes: [emptyLigne()], mentionTva: false, tva: '20',
  dateEmission: todayIso(), dateEcheance: plus30(), notes: '',
})

export default function FacturesModule() {
  const { user } = useAuth()
  const { factures, loading: l1, error: e1 } = useFactures()
  const { contacts, loading: l2, error: e2 } = useContacts()
  const { documents } = useDocuments()
  const { cachets } = useCachets()
  const { operations } = useOperations()
  const { profil, update: updateProfilSettings } = useProfil()
  const [showForm, setShowForm] = useState(false)
  const [showProfil, setShowProfil] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [coauteurDraft, setCoauteurDraft] = useState('')
  const [profilForm, setProfilForm] = useState(profil)

  const totalEnAttente = factures.filter((f) => f.statut === 'envoyee' || f.statut === 'en_retard').reduce((s, f) => s + f.montantTTC, 0)

  function openNew() {
    setEditId(null)
    setForm(emptyForm())
    setCoauteurDraft('')
    setShowForm(true)
  }

  function openEdit(f: Facture) {
    setEditId(f.id)
    setForm({
      contactNom: f.contactNom, nature: f.nature, son: f.son || '', coauteurs: f.coauteurs || [], categorie: f.categorie || '',
      lignes: f.lignes.length ? f.lignes.map((l) => ({ ...l })) : [emptyLigne()],
      mentionTva: f.mentionTva, tva: String(f.tva || 20),
      dateEmission: f.dateEmission, dateEcheance: f.dateEcheance, notes: f.notes || '',
    })
    setCoauteurDraft('')
    setShowForm(true)
  }

  function addCoauteur() {
    const name = coauteurDraft.trim()
    if (!name) return
    setForm((f) => ({ ...f, coauteurs: [...f.coauteurs, name] }))
    setCoauteurDraft('')
  }
  function removeCoauteur(i: number) {
    setForm((f) => ({ ...f, coauteurs: f.coauteurs.filter((_, idx) => idx !== i) }))
  }

  function updateLigne(i: number, patch: Partial<LigneFacture>) {
    setForm((f) => ({ ...f, lignes: f.lignes.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }))
  }
  function addLigne() { setForm((f) => ({ ...f, lignes: [...f.lignes, emptyLigne()] })) }
  function removeLigne(i: number) { setForm((f) => ({ ...f, lignes: f.lignes.length > 1 ? f.lignes.filter((_, idx) => idx !== i) : f.lignes })) }

  const montantHT = form.lignes.reduce((s, l) => s + (l.quantite || 0) * (l.prixUnitaire || 0), 0)
  const montantTTC = form.mentionTva ? montantHT * (1 + parseFloat(form.tva) / 100) : montantHT

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!form.contactNom.trim()) { alert('Renseignez le contact (nom du client/artiste/label).'); return }
    if (form.nature === 'cachet' && !form.son.trim()) { alert('Renseignez le nom du son.'); return }
    if (!form.lignes.some((l) => l.description.trim() && l.prixUnitaire > 0)) { alert('Ajoutez au moins une ligne valide.'); return }
    setSaving(true)
    try {
      // Le contact est créé à la volée s'il n'existe pas déjà dans le répertoire.
      // S'il est déjà lié à cette facture et que le nom a changé, on le renomme
      // partout plutôt que d'en créer un nouveau — synchro dans les deux sens.
      const contactNom = form.contactNom.trim()
      const existingFacture = editId ? factures.find((f) => f.id === editId) : undefined
      const linkedContact = existingFacture ? contacts.find((c) => c.id === existingFacture.contactId) : undefined
      let contactId: string
      if (linkedContact && linkedContact.nom.trim().toLowerCase() !== contactNom.toLowerCase()) {
        await renameContactEverywhere(user.uid, linkedContact.id, contactNom)
        contactId = linkedContact.id
      } else {
        contactId = await ensureContact(user.uid, contactNom, contacts)
      }
      // contactNom fait foi : si on vient de renommer, l'état local `contacts`
      // n'a pas encore reçu la mise à jour temps réel de Firestore.
      const existingContact = contacts.find((c) => c.id === contactId)
      const contact: Contact = { ...(existingContact || { id: contactId, createdAt: new Date(), updatedAt: new Date() }), nom: contactNom }

      const lignes = form.lignes.filter((l) => l.description.trim())
      const baseData = {
        contactId: contact.id, contactNom: contact.nom, nature: form.nature,
        son: form.nature === 'cachet' ? form.son.trim() : undefined,
        coauteurs: form.nature === 'cachet' ? form.coauteurs : undefined,
        categorie: form.nature === 'autre' ? form.categorie.trim() : undefined,
        lignes, montantHT, tva: parseFloat(form.tva) || 0, montantTTC, mentionTva: form.mentionTva,
        dateEmission: form.dateEmission, dateEcheance: form.dateEcheance, notes: form.notes.trim(),
      }

      let factureId: string = editId ?? ''
      let cachetId: string | undefined
      let operationId: string | undefined
      let numero: string
      let statut: Facture['statut']

      if (editId) {
        const existing = factures.find((f) => f.id === editId)!
        numero = existing.numero
        statut = existing.statut
        await updateFacture(user.uid, editId, baseData)
        cachetId = existing.cachetId
        operationId = existing.operationId
        if (existing.nature === 'cachet' && cachetId) {
          await updateCachet(user.uid, cachetId, {
            artiste: contact.nom, son: form.son.trim(), montant: montantHT, coauteurs: form.coauteurs, contactId: contact.id,
          })
        } else if (existing.nature === 'autre' && operationId) {
          await updateOperation(user.uid, operationId, {
            categorie: form.categorie.trim(), description: lignes.map((l) => l.description).join(', '),
            montant: montantHT, date: form.dateEmission, contactId: contact.id,
          })
        }
      } else {
        numero = genNumeroFacture(factures)
        statut = 'brouillon'
        const docRef = await addFacture(user.uid, {
          ...baseData, numero, statut,
        } as Omit<Facture, 'id' | 'createdAt' | 'updatedAt'>)
        factureId = docRef.id

        if (form.nature === 'cachet') {
          const cRef = await addCachet(user.uid, {
            date: '', artiste: contact.nom, son: form.son.trim(), quantite: 1, montant: montantHT,
            coauteurs: form.coauteurs, maPart: null, paye: false, datePaiement: '', dateStatut: 'manquante',
            exclu: false, factureId, contactId: contact.id,
          })
          cachetId = cRef.id
        } else {
          const oRef = await addOperation(user.uid, {
            date: form.dateEmission, type: 'revenu', categorie: form.categorie.trim() || 'Facturation',
            description: lignes.map((l) => l.description).join(', '), montant: montantHT,
            exclu: false, factureId, contactId: contact.id,
          })
          operationId = oRef.id
        }
        await updateFacture(user.uid, factureId, { cachetId, operationId })
      }

      // Génère le PDF et le range dans Documents, lié au placement/opération.
      const factureForPdf: Facture = {
        id: factureId, numero, ...baseData, statut, cachetId, operationId,
      } as Facture
      const { generateInvoicePdfBlob } = await import('@/lib/invoicePdf')
      const blob = await generateInvoicePdfBlob(factureForPdf, contact, profil)
      const fileName = `${numero}.pdf`
      const { fileUrl, storagePath } = await uploadDocumentFile(user.uid, blob, fileName)
      const lien = { kind: (form.nature === 'cachet' ? 'cachet' : 'operation') as 'cachet' | 'operation', ref: (cachetId || operationId)! }

      const existingDocId = editId ? factures.find((f) => f.id === editId)?.documentId : undefined
      if (existingDocId) {
        await updateDocument(user.uid, existingDocId, { nom: fileName, fileUrl, storagePath, lien })
      } else {
        const dRef = await addDocument(user.uid, { nom: fileName, type: 'Facture', taille: blob.size, fileUrl, storagePath, lien, factureId })
        await updateFacture(user.uid, factureId!, { documentId: dRef.id })
      }

      setShowForm(false)
      setEditId(null)
      setForm(emptyForm())
    } finally {
      setSaving(false)
    }
  }

  async function handleStatutChange(f: Facture, statut: StatutFacture) {
    if (!user) return
    if (statut === 'annulee') {
      const linkedCachet = f.cachetId ? cachets.find((c) => c.id === f.cachetId) : undefined
      const linkedOperation = f.operationId ? operations.find((o) => o.id === f.operationId) : undefined
      let msg = `Annuler la facture ${f.numero} ?`
      if (linkedCachet && !linkedCachet.paye) msg += ` Le cachet « ${linkedCachet.son} » sera retiré du suivi (non payé à ce jour).`
      else if (linkedCachet && linkedCachet.paye) msg += ` Le cachet « ${linkedCachet.son} » est déjà marqué payé : il restera dans le suivi, à corriger manuellement si besoin.`
      if (linkedOperation) msg += ` L'opération liée sera retirée du suivi.`
      if (!confirm(msg)) return
      await updateFacture(user.uid, f.id, { statut })
      if (linkedCachet && !linkedCachet.paye) await deleteCachet(user.uid, linkedCachet.id)
      if (linkedOperation) await deleteOperation(user.uid, linkedOperation.id)
      return
    }
    const patch: Partial<Facture> = { statut }
    if (statut === 'payee') patch.datePaiement = todayIso()
    await updateFacture(user.uid, f.id, patch)
    if (f.cachetId) {
      await updateCachet(user.uid, f.cachetId, statut === 'payee'
        ? { paye: true, datePaiement: todayIso().slice(0, 7) }
        : { paye: false })
    }
  }

  async function handleDelete(f: Facture) {
    if (!user || !confirm(`Supprimer la facture ${f.numero} ? Le placement/opération lié ne sera pas supprimé.`)) return
    await deleteFacture(user.uid, f.id)
    if (f.documentId) await deleteDocument(user.uid, f.documentId)
  }

  async function saveProfilForm(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    await updateProfilSettings(profilForm)
    setShowProfil(false)
  }

  const loading = l1 || l2
  const error = e1 || e2

  if (error) return <ErrorBanner message={error} />

  function handleExportCsv() {
    downloadCsv(
      `factures-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Numéro', 'Contact', 'Nature', 'Statut', 'Émission', 'Échéance', 'Montant HT', 'Montant TTC'],
      [...factures].sort((a, b) => b.dateEmission.localeCompare(a.dateEmission)).map((f) => [
        f.numero, f.contactNom, f.nature === 'cachet' ? 'Cachet' : 'Autre revenu', STATUTS.find((s) => s.value === f.statut)?.label || f.statut,
        f.dateEmission, f.dateEcheance, f.montantHT.toFixed(2), f.montantTTC.toFixed(2),
      ])
    )
  }

  return (
    <div className="space-y-4">
      <datalist id="contacts-suggestions">
        {contacts.map((c) => <option key={c.id} value={c.nom} />)}
      </datalist>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-text-muted text-sm">{factures.length} facture{factures.length > 1 ? 's' : ''}</p>
          {totalEnAttente > 0 && <p className="text-yellow-400 font-bold text-lg tabular-nums">{fmt(totalEnAttente)} en attente</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportCsv} disabled={factures.length === 0} className="btn-secondary">
            <Download size={16} /> CSV
          </button>
          <button onClick={() => { setProfilForm(profil); setShowProfil(!showProfil) }} className="btn-secondary">
            <Settings size={16} /> Mes informations
          </button>
          <button onClick={openNew} className="btn-primary">
            <Plus size={16} /> Nouvelle facture
          </button>
        </div>
      </div>

      {showProfil && (
        <form onSubmit={saveProfilForm} className="card-glass p-5 space-y-3 animate-fade-in-up">
          <h3 className="font-semibold text-sm">Mes informations (émetteur des factures)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs text-text-muted block mb-1">Nom / activité *</label>
              <input required value={profilForm.nom} onChange={(e) => setProfilForm((p) => ({ ...p, nom: e.target.value }))} className="w-full field" /></div>
            <div><label className="text-xs text-text-muted block mb-1">SIRET</label>
              <input value={profilForm.siret} onChange={(e) => setProfilForm((p) => ({ ...p, siret: e.target.value }))} className="w-full field" /></div>
            <div className="sm:col-span-2"><label className="text-xs text-text-muted block mb-1">Adresse</label>
              <input value={profilForm.adresse} onChange={(e) => setProfilForm((p) => ({ ...p, adresse: e.target.value }))} className="w-full field" /></div>
            <div><label className="text-xs text-text-muted block mb-1">Email</label>
              <input type="email" value={profilForm.email} onChange={(e) => setProfilForm((p) => ({ ...p, email: e.target.value }))} className="w-full field" /></div>
            <div><label className="text-xs text-text-muted block mb-1">Téléphone</label>
              <input value={profilForm.telephone} onChange={(e) => setProfilForm((p) => ({ ...p, telephone: e.target.value }))} className="w-full field" /></div>
            <div><label className="text-xs text-text-muted block mb-1">IBAN</label>
              <input value={profilForm.iban} onChange={(e) => setProfilForm((p) => ({ ...p, iban: e.target.value }))} className="w-full field" /></div>
            <div><label className="text-xs text-text-muted block mb-1">BIC</label>
              <input value={profilForm.bic} onChange={(e) => setProfilForm((p) => ({ ...p, bic: e.target.value }))} className="w-full field" /></div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setShowProfil(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">Enregistrer</button>
          </div>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card-glass p-5 space-y-3 animate-fade-in-up">
          <h3 className="font-semibold text-sm">{editId ? 'Modifier la facture' : 'Nouvelle facture'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Contact *</label>
              <input required list="contacts-suggestions" value={form.contactNom} onChange={(e) => setForm((f) => ({ ...f, contactNom: e.target.value }))}
                className="w-full field" placeholder="Nom du client, artiste ou label" />
              <p className="text-text-faint text-[11px] mt-1">Nouveau nom ? Il sera ajouté à tes contacts automatiquement.</p>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Nature *</label>
              <select value={form.nature} onChange={(e) => setForm((f) => ({ ...f, nature: e.target.value as NatureFacture }))}
                disabled={!!editId}
                className="w-full field disabled:opacity-50">
                <option value="cachet">Cachet (prod placée)</option>
                <option value="autre">Autre revenu</option>
              </select>
            </div>
            {form.nature === 'cachet' ? (
              <>
                <div>
                  <label className="text-xs text-text-muted block mb-1">Son *</label>
                  <input required value={form.son} onChange={(e) => setForm((f) => ({ ...f, son: e.target.value }))}
                    className="w-full field" placeholder="Nom du titre" />
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-1">Co-auteurs (coprod) — moi non compris</label>
                  <div className="flex gap-2">
                    <input
                      value={coauteurDraft}
                      onChange={(e) => setCoauteurDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCoauteur() } }}
                      className="flex-1 field" placeholder="Nom, puis Entrée"
                    />
                    <button type="button" onClick={addCoauteur} className="btn-secondary px-3"><Plus size={16} /></button>
                  </div>
                  {form.coauteurs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.coauteurs.map((name, i) => (
                        <span key={i} className="animate-pop-in inline-flex items-center gap-1.5 bg-brand/10 text-brand text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full">
                          {name}
                          <button type="button" onClick={() => removeCoauteur(i)} className="hover:bg-brand/20 rounded-full p-0.5 transition-colors">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <label className="text-xs text-text-muted block mb-1">Catégorie</label>
                <input value={form.categorie} onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value }))}
                  className="w-full field" placeholder="Ex: Composition (film)" />
              </div>
            )}
            <div>
              <label className="text-xs text-text-muted block mb-1">Date d&apos;émission</label>
              <input type="date" value={form.dateEmission} onChange={(e) => setForm((f) => ({ ...f, dateEmission: e.target.value }))}
                className="w-full field" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Date d&apos;échéance</label>
              <input type="date" value={form.dateEcheance} onChange={(e) => setForm((f) => ({ ...f, dateEcheance: e.target.value }))}
                className="w-full field" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-text-muted block">Lignes de facturation *</label>
            {form.lignes.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px_100px_100px_28px] gap-2 items-center">
                <input value={l.description} onChange={(e) => updateLigne(i, { description: e.target.value })} placeholder="Description"
                  className="field px-2 py-1.5" />
                <input type="number" min="1" value={l.quantite} onChange={(e) => updateLigne(i, { quantite: parseInt(e.target.value, 10) || 1 })}
                  className="field px-2 py-1.5" title="Quantité" />
                <input type="number" step="0.01" min="0" value={l.prixUnitaire} onChange={(e) => updateLigne(i, { prixUnitaire: parseFloat(e.target.value) || 0 })}
                  className="field px-2 py-1.5" title="Prix unitaire HT" />
                <span className="text-sm tabular-nums text-right">{fmt(l.quantite * l.prixUnitaire)}</span>
                <button type="button" onClick={() => removeLigne(i)} className="btn-ghost-icon hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            ))}
            <button type="button" onClick={addLigne} className="text-xs text-brand hover:underline">+ Ajouter une ligne</button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.mentionTva} onChange={(e) => setForm((f) => ({ ...f, mentionTva: e.target.checked }))} />
              TVA applicable
            </label>
            {form.mentionTva && (
              <select value={form.tva} onChange={(e) => setForm((f) => ({ ...f, tva: e.target.value }))}
                className="field w-auto px-3 py-1.5">
                {TVA_OPTIONS.map((t) => <option key={t} value={t}>{t}%</option>)}
              </select>
            )}
          </div>

          <div>
            <label className="text-xs text-text-muted block mb-1">Notes</label>
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full field" />
          </div>

          <div className="bg-white/[0.03] rounded-xl p-3 text-sm flex gap-4 animate-fade-in-up">
            <span><span className="text-text-muted">Total HT : </span><span className="font-bold tabular-nums">{fmt(montantHT)}</span></span>
            <span><span className="text-text-muted">Total TTC : </span><span className="font-bold text-brand tabular-nums">{fmt(montantTTC)}</span></span>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Génération...' : editId ? 'Enregistrer' : 'Créer la facture'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-text-muted animate-pulse">Chargement...</div>
      ) : factures.length === 0 && !showForm ? (
        <div className="text-center py-16 text-text-muted">
          <FileText size={40} className="mx-auto mb-3 text-text-faint" />
          <p className="font-medium">Aucune facture créée 🧾</p>
          <p className="text-sm mt-1">Créez votre première facture pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {factures.map((f) => {
            const statut = STATUTS.find((s) => s.value === f.statut)!
            return (
              <div key={f.id} className={clsx('card-glass p-4 transition-opacity duration-300', f.statut === 'annulee' && 'opacity-60')}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono text-xs text-text-muted">{f.numero}</p>
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', statut.color)}>{statut.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-bg-primary text-text-muted">{f.nature === 'cachet' ? 'Cachet' : 'Autre revenu'}</span>
                    </div>
                    <p className="font-medium text-sm mt-0.5">{f.contactNom}{f.son ? ` — ${f.son}` : f.categorie ? ` — ${f.categorie}` : ''}</p>
                    <p className="text-text-muted text-xs">
                      {new Date(f.dateEmission).toLocaleDateString('fr-FR')} → échéance {new Date(f.dateEcheance).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-brand font-bold tabular-nums text-sm">{fmt(f.montantTTC)}</span>
                    <p className="text-text-faint text-xs">HT: {fmt(f.montantHT)}{f.mentionTva ? ` · TVA ${f.tva}%` : ' · TVA non applicable'}</p>
                    <div className="flex items-center gap-2">
                      <select value={f.statut} onChange={(e) => handleStatutChange(f, e.target.value as StatutFacture)}
                        className="text-xs field w-auto px-2 py-1">
                        {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      {f.documentId && documents.find((d) => d.id === f.documentId) && (
                        <a href={documents.find((d) => d.id === f.documentId)!.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="btn-ghost-icon hover:text-brand p-1" aria-label="Télécharger le PDF" title="Télécharger le PDF">
                          <Download size={15} />
                        </a>
                      )}
                      {f.statut !== 'annulee' && (
                        <button onClick={() => openEdit(f)} className="btn-ghost-icon hover:text-brand p-1" aria-label="Modifier"><Pencil size={15} /></button>
                      )}
                      <button onClick={() => handleDelete(f)} className="btn-ghost-icon hover:text-red-400 p-1" aria-label="Supprimer"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
