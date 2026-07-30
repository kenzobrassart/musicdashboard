'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCachets } from '@/hooks/useCachets'
import { useDocuments } from '@/hooks/useDocuments'
import { useContacts } from '@/hooks/useContacts'
import { useAuth } from '@/hooks/useAuth'
import { useQuickActionStore } from '@/lib/store'
import { addCachet, updateCachet, deleteCachet } from '@/lib/firestore/cachets'
import { ensureContact, renameContactEverywhere } from '@/lib/firestore/contacts'
import { uploadDocumentFile, addDocument, deleteDocument } from '@/lib/firestore/documents'
import { brut, part, qte, nbComp, fmt } from '@/lib/calc'
import { downloadCsv } from '@/lib/csv'
import { Plus, Trash2, Pencil, Music2, FileText, EyeOff, Eye, Download, X, Landmark, Upload, Receipt, FileUp } from 'lucide-react'
import { clsx } from 'clsx'
import ErrorBanner from '@/components/ui/ErrorBanner'
import type { Cachet, StatutDate, TypeDocument } from '@/lib/types'

const DOC_TYPES: TypeDocument[] = ['Contrat', 'Facture', 'Autre']

interface ImportCachetRow {
  date_sortie?: string | null
  date_statut?: string | null
  artiste?: string
  son?: string
  qte?: number
  cachet_total_eur?: number
  split?: string
  ma_part_eur?: number | null
  statut?: string
  pieces?: string[]
  [key: string]: unknown
}

// L'ancien outil ne connaît pas les vrais noms des coauteurs, seulement une
// fraction ("1/2 · 50 %") — on crée des repères génériques, renommables
// ensuite via l'édition du cachet.
function coauteursFromSplit(split: string | undefined): string[] {
  if (!split) return []
  const m = split.match(/1\/(\d+)/)
  if (!m) return []
  const n = parseInt(m[1], 10)
  if (!n || n <= 1) return []
  return Array.from({ length: n - 1 }, (_, i) => `Co-auteur ${i + 2}`)
}

function mapImportRow(row: ImportCachetRow) {
  const dateSortie = row.date_sortie || ''
  const dateStatut: StatutDate = !dateSortie ? 'manquante' : row.date_statut === 'à confirmer' ? 'approx' : 'ok'
  const encaisse = (row['encaissé_en'] as string | null | undefined) || null
  return {
    date: dateSortie,
    artiste: (row.artiste || '').trim(),
    son: (row.son || '').trim(),
    quantite: Math.max(1, parseInt(String(row.qte ?? 1), 10) || 1),
    montant: Number(row.cachet_total_eur) || 0,
    coauteurs: coauteursFromSplit(row.split),
    maPart: row.ma_part_eur != null ? Number(row.ma_part_eur) : null,
    paye: row.statut === 'Encaissé',
    datePaiement: encaisse ? `${encaisse}-01` : '',
    dateStatut,
    exclureStats: false,
    exclureFiscal: false,
  } satisfies Omit<Cachet, 'id' | 'createdAt' | 'updatedAt' | 'contactId' | 'factureId'>
}

const emptyForm = {
  date: '', artiste: '', son: '', quantite: '1', montant: '', coauteurs: [] as string[], maPart: '',
  paye: false, datePaiement: '', dateStatut: 'ok' as StatutDate,
  exclureStats: false, exclureFiscal: false,
}

type SortKey = 'date' | 'artiste' | 'son' | 'brut' | 'part' | 'statut' | 'paiement'

export default function CachetsModule() {
  const router = useRouter()
  const { user } = useAuth()
  const { cachets, loading, error } = useCachets()
  const { documents } = useDocuments()
  const { contacts } = useContacts()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [coauteurDraft, setCoauteurDraft] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' })
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [expandedDocsId, setExpandedDocsId] = useState<string | null>(null)
  const [rowUploading, setRowUploading] = useState<string | null>(null)

  const partTotal = cachets.reduce((s, c) => s + part(c), 0)
  const attente = cachets.filter((c) => !c.paye).reduce((s, c) => s + part(c), 0)

  function docsFor(son: string, cachetId: string) {
    return documents.filter((d) => d.lien && d.lien.kind === 'cachet' && (d.lien.ref === cachetId || d.lien.ref === son))
  }

  function openNew() {
    setEditId(null)
    setForm(emptyForm)
    setCoauteurDraft('')
    setShowForm(true)
  }

  const pendingAction = useQuickActionStore((s) => s.pending)
  const consumeAction = useQuickActionStore((s) => s.consume)
  const triggerFactureFromCachet = useQuickActionStore((s) => s.triggerFactureFromCachet)
  useEffect(() => {
    if (pendingAction === 'cachet') { openNew(); consumeAction() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction])

  function handleGenererFacture(c: Cachet) {
    triggerFactureFromCachet({
      contactNom: c.artiste, son: c.son, coauteurs: c.coauteurs || [],
      quantite: qte(c), prixUnitaire: c.montant, cachetId: c.id,
    })
    router.push('/factures')
  }

  async function handleImportFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportText(await file.text())
    e.target.value = ''
  }

  const importPreviewCount = useMemo(() => {
    try {
      const parsed = JSON.parse(importText)
      return Array.isArray(parsed) ? parsed.length : null
    } catch {
      return null
    }
  }, [importText])

  async function handleImportSubmit() {
    if (!user) return
    let rows: ImportCachetRow[]
    try {
      const parsed = JSON.parse(importText)
      if (!Array.isArray(parsed)) throw new Error('bad')
      rows = parsed
    } catch {
      alert('JSON invalide : le contenu doit être un tableau de cachets.')
      return
    }
    setImporting(true)
    try {
      const contactCache = new Map<string, string>()
      let piecesTotal = 0
      for (const row of rows) {
        const mapped = mapImportRow(row)
        piecesTotal += Array.isArray(row.pieces) ? row.pieces.length : 0
        let contactId: string | undefined
        if (mapped.artiste) {
          const key = mapped.artiste.toLowerCase()
          contactId = contactCache.get(key) ?? (await ensureContact(user.uid, mapped.artiste, contacts))
          contactCache.set(key, contactId)
        }
        await addCachet(user.uid, { ...mapped, ...(contactId ? { contactId } : {}) })
      }
      setShowImport(false)
      setImportText('')
      alert(
        `${rows.length} cachet${rows.length > 1 ? 's' : ''} importé${rows.length > 1 ? 's' : ''}.` +
        (piecesTotal > 0 ? ` ${piecesTotal} pièce${piecesTotal > 1 ? 's' : ''} mentionnée${piecesTotal > 1 ? 's' : ''} dans l'ancien fichier (sans le fichier lui-même) — à téléverser depuis la colonne Docs de chaque ligne.` : '')
      )
    } finally {
      setImporting(false)
    }
  }

  async function handleRowUpload(c: Cachet, type: TypeDocument, file: File) {
    if (!user) return
    const key = `${c.id}:${type}`
    setRowUploading(key)
    try {
      const { fileUrl, storagePath } = await uploadDocumentFile(user.uid, file, file.name)
      await addDocument(user.uid, { nom: file.name, type, taille: file.size, fileUrl, storagePath, lien: { kind: 'cachet', ref: c.id } })
    } finally {
      setRowUploading(null)
    }
  }

  function openEdit(c: Cachet) {
    setEditId(c.id)
    setForm({
      date: c.date || '', artiste: c.artiste || '', son: c.son || '',
      quantite: String(qte(c)), montant: String(c.montant), coauteurs: c.coauteurs || [],
      maPart: c.maPart === null || c.maPart === undefined ? '' : String(c.maPart),
      paye: c.paye, datePaiement: c.datePaiement || '', dateStatut: c.dateStatut || 'ok',
      exclureStats: c.exclureStats || false, exclureFiscal: c.exclureFiscal || false,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.son.trim() || form.montant === '') { alert('Renseignez au moins le son et le cachet total.'); return }
    setSaving(true)
    const quantite = Math.max(1, parseInt(form.quantite, 10) || 1)
    const artiste = form.artiste.trim()

    // Le répertoire de contacts se remplit tout seul avec l'artiste saisi. Si le
    // cachet est déjà lié à un contact et que le nom a changé, on renomme ce
    // contact partout plutôt que d'en créer un nouveau — synchro dans les deux sens.
    let contactId: string | undefined
    if (artiste) {
      const current = editId ? cachets.find((c) => c.id === editId) : undefined
      const linkedContact = current?.contactId ? contacts.find((c) => c.id === current.contactId) : undefined
      if (linkedContact && linkedContact.nom.trim().toLowerCase() !== artiste.toLowerCase()) {
        await renameContactEverywhere(user.uid, linkedContact.id, artiste)
        contactId = linkedContact.id
      } else {
        contactId = await ensureContact(user.uid, artiste, contacts)
      }
    }

    const rec = {
      date: form.date,
      artiste,
      son: form.son.trim(),
      quantite,
      montant: parseFloat(form.montant) || 0,
      coauteurs: form.coauteurs,
      maPart: form.maPart === '' ? null : parseFloat(form.maPart),
      paye: form.paye,
      datePaiement: form.datePaiement,
      dateStatut: form.date ? form.dateStatut : ('manquante' as StatutDate),
      exclureStats: form.exclureStats,
      exclureFiscal: form.exclureFiscal,
      ...(contactId ? { contactId } : {}),
    }
    if (editId) {
      await updateCachet(user.uid, editId, rec)
    } else {
      await addCachet(user.uid, rec)
    }
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
    setSaving(false)
  }

  function setSortKey(key: SortKey) {
    setSort((s) => ({
      key,
      dir: s.key === key ? (s.dir === 'asc' ? 'desc' : 'asc') : (['date', 'paiement', 'brut', 'part'].includes(key) ? 'desc' : 'asc'),
    }))
  }

  const sorted = useMemo(() => {
    const mult = sort.dir === 'asc' ? 1 : -1
    const val = (c: Cachet): string | number => {
      switch (sort.key) {
        case 'date': return c.date || ''
        case 'paiement': return c.datePaiement || ''
        case 'artiste': return (c.artiste || '').toLowerCase()
        case 'son': return (c.son || '').toLowerCase()
        case 'brut': return brut(c)
        case 'part': return part(c)
        case 'statut': return c.paye ? 1 : 0
      }
    }
    return [...cachets].sort((a, b) => {
      const va = val(a), vb = val(b)
      if (va === '' && vb === '') return 0
      if (va === '') return 1
      if (vb === '') return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mult
      return String(va).localeCompare(String(vb), 'fr') * mult
    })
  }, [cachets, sort])

  const arrow = (k: SortKey) => (sort.key === k ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '')

  function handleExportCsv() {
    downloadCsv(
      `cachets-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Date de sortie', 'Artiste', 'Son', 'Quantité', 'Brut', 'Co-auteurs', 'Ma part', 'Payé', 'Date de paiement'],
      sorted.map((c) => [c.date, c.artiste, c.son, qte(c), brut(c).toFixed(2), (c.coauteurs || []).join(', '), part(c).toFixed(2), c.paye ? 'Oui' : 'Non', c.datePaiement])
    )
  }

  if (error) return <ErrorBanner message={error} />
  if (loading) return <div className="text-text-muted animate-pulse">Chargement...</div>

  return (
    <div className="space-y-4">
      <datalist id="contacts-suggestions">
        {contacts.map((c) => <option key={c.id} value={c.nom} />)}
      </datalist>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-text-muted text-sm">{cachets.length} placement{cachets.length > 1 ? 's' : ''} · {fmt(partTotal)} de part cumulée</p>
          {attente > 0 && <p className="text-yellow-400 font-bold text-lg tabular-nums">{fmt(attente)} en attente</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportCsv} disabled={cachets.length === 0} className="btn-secondary">
            <Download size={16} /> CSV
          </button>
          <button onClick={() => setShowImport((v) => !v)} className="btn-secondary">
            <FileUp size={16} /> Importer JSON
          </button>
          <button onClick={openNew} className="btn-primary">
            <Plus size={16} /> Ajouter un cachet
          </button>
        </div>
      </div>

      {showImport && (
        <div className="card-glass p-5 space-y-3 animate-fade-in-up">
          <h3 className="font-semibold text-sm">Importer des cachets depuis un JSON (ancienne version)</h3>
          <p className="text-text-faint text-xs">
            Colle le contenu ci-dessous, ou choisis directement le fichier .json. Chaque ligne devient un cachet ;
            les artistes sont automatiquement rattachés (ou créés) dans les contacts. Les pièces mentionnées
            (facture, contrat...) ne sont pas importées faute de fichier — tu pourras les téléverser ensuite
            depuis la colonne « Docs » de chaque ligne.
          </p>
          <label className="field flex items-center gap-2 cursor-pointer hover:border-brand transition-colors w-fit px-3">
            <Upload size={14} /> Choisir un fichier .json
            <input type="file" accept="application/json,.json" className="hidden" onChange={handleImportFilePick} />
          </label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            placeholder='[{"date_sortie": "2026-03-26", "artiste": "...", "son": "...", ...}]'
            className="w-full field font-mono text-xs"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-text-muted">
              {importPreviewCount !== null ? `${importPreviewCount} cachet${importPreviewCount > 1 ? 's' : ''} détecté${importPreviewCount > 1 ? 's' : ''}` : importText ? 'JSON invalide' : ''}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowImport(false); setImportText('') }} className="btn-secondary">Annuler</button>
              <button type="button" onClick={handleImportSubmit} disabled={!importPreviewCount || importing} className="btn-primary">
                {importing ? 'Import...' : `Importer${importPreviewCount ? ` (${importPreviewCount})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card-glass p-5 space-y-3 animate-fade-in-up">
          <h3 className="font-semibold text-sm">{editId ? 'Modifier le cachet' : 'Nouveau cachet'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-text-muted block mb-1">Date de sortie</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full field" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Statut de la date</label>
              <select value={form.dateStatut} onChange={(e) => setForm((f) => ({ ...f, dateStatut: e.target.value as StatutDate }))}
                disabled={!form.date}
                className="w-full field disabled:opacity-50">
                <option value="ok">Confirmée</option>
                <option value="approx">Approximative</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Artiste</label>
              <input list="contacts-suggestions" value={form.artiste} onChange={(e) => setForm((f) => ({ ...f, artiste: e.target.value }))}
                className="w-full field" placeholder="Nom de l'artiste" />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-xs text-text-muted block mb-1">Son *</label>
              <input required value={form.son} onChange={(e) => setForm((f) => ({ ...f, son: e.target.value }))}
                className="w-full field" placeholder="Nom du titre" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Quantité</label>
              <input type="number" min="1" value={form.quantite} onChange={(e) => setForm((f) => ({ ...f, quantite: e.target.value }))}
                className="w-full field" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Cachet total (€) *</label>
              <input required type="number" step="0.01" min="0" value={form.montant} onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
                className="w-full field" placeholder="0.00" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-text-muted block mb-1">Co-auteurs (coprod) — moi non compris</label>
              <div className="flex gap-2">
                <input
                  value={coauteurDraft}
                  onChange={(e) => setCoauteurDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCoauteur() } }}
                  className="flex-1 field" placeholder="Nom du co-compositeur, puis Entrée"
                />
                <button type="button" onClick={addCoauteur} className="btn-secondary px-3">
                  <Plus size={16} />
                </button>
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
            <div>
              <label className="text-xs text-text-muted block mb-1">Ma part (€) — si différente du partage égal</label>
              <input type="number" step="0.01" min="0" value={form.maPart} onChange={(e) => setForm((f) => ({ ...f, maPart: e.target.value }))}
                className="w-full field" placeholder="auto : brut / nb coprods" />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Statut de paiement</label>
              <select value={form.paye ? '1' : '0'} onChange={(e) => setForm((f) => ({ ...f, paye: e.target.value === '1' }))}
                className="w-full field">
                <option value="0">Non payé</option>
                <option value="1">Payé</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Date de paiement</label>
              <input type="date" value={form.datePaiement} onChange={(e) => setForm((f) => ({ ...f, datePaiement: e.target.value }))}
                className="w-full field" />
            </div>
          </div>
          {form.montant && (
            <div className="bg-white/[0.03] rounded-xl p-3 text-sm flex flex-wrap gap-4 animate-fade-in-up">
              <span><span className="text-text-muted">Brut : </span><span className="font-bold tabular-nums">{fmt((parseFloat(form.montant) || 0) * (parseInt(form.quantite, 10) || 1))}</span></span>
              <span><span className="text-text-muted">Ma part estimée ({form.coauteurs.length + 1} auteur{form.coauteurs.length ? 's' : ''}) : </span><span className="font-bold text-brand tabular-nums">
                {fmt(form.maPart !== '' ? (parseFloat(form.maPart) || 0) : ((parseFloat(form.montant) || 0) * (parseInt(form.quantite, 10) || 1)) / (form.coauteurs.length + 1))}
              </span></span>
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.exclureStats} onChange={(e) => setForm((f) => ({ ...f, exclureStats: e.target.checked }))} />
              Exclure des statistiques
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.exclureFiscal} onChange={(e) => setForm((f) => ({ ...f, exclureFiscal: e.target.checked }))} />
              Exclure de la fiscalité (déclarations)
            </label>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Enregistrement...' : editId ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}

      {cachets.length === 0 && !showForm && (
        <div className="text-center py-16 text-text-muted">
          <Music2 size={40} className="mx-auto mb-3 text-text-faint" />
          <p className="font-medium">Aucun placement enregistré 🎧</p>
          <p className="text-sm mt-1">Ajoutez votre premier cachet pour commencer.</p>
        </div>
      )}

      {cachets.length > 0 && (
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wide border-b border-bg-border">
                <th className="text-left font-medium py-2 px-2 cursor-pointer" onClick={() => setSortKey('date')}>Sortie{arrow('date')}</th>
                <th className="text-left font-medium py-2 px-2 cursor-pointer" onClick={() => setSortKey('artiste')}>Artiste{arrow('artiste')}</th>
                <th className="text-left font-medium py-2 px-2 cursor-pointer" onClick={() => setSortKey('son')}>Son{arrow('son')}</th>
                <th className="text-right font-medium py-2 px-2 cursor-pointer" onClick={() => setSortKey('brut')}>Brut{arrow('brut')}</th>
                <th className="text-left font-medium py-2 px-2">Partage</th>
                <th className="text-right font-medium py-2 px-2 cursor-pointer" onClick={() => setSortKey('part')}>Ma part{arrow('part')}</th>
                <th className="text-center font-medium py-2 px-2 cursor-pointer" onClick={() => setSortKey('statut')}>Statut{arrow('statut')}</th>
                <th className="text-left font-medium py-2 px-2 cursor-pointer" onClick={() => setSortKey('paiement')}>Paiement{arrow('paiement')}</th>
                <th className="text-center font-medium py-2 px-2">Docs</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const b = brut(c), p = part(c), n = nbComp(c)
                const pct = b > 0 ? Math.round((p / b) * 100) : 100
                const docs = docsFor(c.son, c.id)
                return (
                  <Fragment key={c.id}>
                  <tr className={clsx('border-b border-bg-border/50 transition-colors duration-150 hover:bg-white/[0.02]', (c.exclureStats || c.exclureFiscal) && 'opacity-50')}>
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      {c.date ? new Date(c.date).toLocaleDateString('fr-FR') : <span className="text-text-faint italic">à renseigner</span>}
                      {c.dateStatut === 'approx' && <span className="text-yellow-400 text-xs ml-1">≈</span>}
                    </td>
                    <td className="py-2.5 px-2">{c.artiste || '—'}</td>
                    <td className="py-2.5 px-2 font-medium max-w-[220px] truncate" title={c.coauteurs?.length ? `avec ${c.coauteurs.join(', ')}` : undefined}>{c.son}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums">{fmt(b)}</td>
                    <td className="py-2.5 px-2 text-text-muted text-xs" title={c.coauteurs?.join(', ')}>{n === 1 && pct === 100 ? 'solo' : `1/${n} · ${pct}%`}</td>
                    <td className="py-2.5 px-2 text-right tabular-nums font-bold text-brand">{fmt(p)}</td>
                    <td className="py-2.5 px-2 text-center">
                      <button onClick={() => user && updateCachet(user.uid, c.id, { paye: !c.paye })}
                        className={clsx('pill-tap text-xs px-2 py-0.5 rounded-full font-medium', c.paye ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400')}>
                        {c.paye ? 'Payé' : 'En attente'}
                      </button>
                    </td>
                    <td className="py-2.5 px-2 text-xs text-text-muted whitespace-nowrap">
                      {c.datePaiement ? new Date(c.datePaiement).toLocaleDateString('fr-FR') : c.paye ? 'date à renseigner' : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button onClick={() => setExpandedDocsId((id) => (id === c.id ? null : c.id))}
                        className={clsx('btn-ghost-icon inline-flex items-center gap-1 text-xs mx-auto', expandedDocsId === c.id && 'text-brand')}>
                        {docs.length > 0 ? <><FileText size={13} />{docs.length}</> : <span className="text-text-faint">—</span>}
                      </button>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => handleGenererFacture(c)}
                          title="Générer une facture pour ce cachet"
                          className="btn-ghost-icon hover:text-brand p-1"><Receipt size={14} /></button>
                        <button onClick={() => user && updateCachet(user.uid, c.id, { exclureStats: !c.exclureStats })}
                          title={c.exclureStats ? 'Réintégrer dans les statistiques' : 'Exclure des statistiques'}
                          className={clsx('btn-ghost-icon p-1', c.exclureStats ? 'text-yellow-400' : 'hover:text-text-primary')}>
                          {c.exclureStats ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button onClick={() => user && updateCachet(user.uid, c.id, { exclureFiscal: !c.exclureFiscal })}
                          title={c.exclureFiscal ? 'Réintégrer dans la fiscalité' : 'Exclure de la fiscalité (déclarations)'}
                          className={clsx('btn-ghost-icon p-1', c.exclureFiscal ? 'text-yellow-400' : 'hover:text-text-primary')}>
                          <Landmark size={14} className={c.exclureFiscal ? 'opacity-40' : ''} />
                        </button>
                        <button onClick={() => openEdit(c)} className="btn-ghost-icon hover:text-brand p-1"><Pencil size={14} /></button>
                        <button
                          onClick={() => { if (user && confirm(`Supprimer « ${c.son} » ?`)) deleteCachet(user.uid, c.id) }}
                          className="btn-ghost-icon hover:text-red-400 p-1"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                  {expandedDocsId === c.id && (
                    <tr className="border-b border-bg-border/50 bg-white/[0.02] animate-fade-in-up">
                      <td colSpan={10} className="px-4 py-3">
                        <div className="space-y-2.5">
                          {docs.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {docs.map((d) => (
                                <span key={d.id} className="inline-flex items-center gap-1.5 bg-white/[0.05] rounded-full pl-2.5 pr-1 py-1 text-xs">
                                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors">{d.type} · {d.nom}</a>
                                  <button
                                    onClick={() => { if (user && confirm(`Supprimer « ${d.nom} » ?`)) deleteDocument(user.uid, d.id, d.storagePath) }}
                                    className="hover:bg-white/10 rounded-full p-0.5"><X size={11} /></button>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            {DOC_TYPES.map((t) => {
                              const key = `${c.id}:${t}`
                              const busy = rowUploading === key
                              return (
                                <label key={t} className={clsx('btn-secondary text-xs px-2.5 py-1.5 cursor-pointer', busy && 'opacity-60 pointer-events-none')}>
                                  <Upload size={12} /> {busy ? 'Envoi...' : t}
                                  <input type="file" className="hidden" disabled={busy}
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRowUpload(c, t, f); e.target.value = '' }} />
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
