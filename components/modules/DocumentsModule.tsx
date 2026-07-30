'use client'

import { useMemo, useState } from 'react'
import { useDocuments } from '@/hooks/useDocuments'
import { useCachets } from '@/hooks/useCachets'
import { useOperations } from '@/hooks/useOperations'
import { useAuth } from '@/hooks/useAuth'
import { uploadDocumentFile, addDocument, updateDocument, deleteDocument } from '@/lib/firestore/documents'
import { fmtSize } from '@/lib/calc'
import { Upload, Trash2, FileText, FileSignature, ClipboardList, File as FileIcon } from 'lucide-react'
import { clsx } from 'clsx'
import ErrorBanner from '@/components/ui/ErrorBanner'
import type { TypeDocument } from '@/lib/types'

const TYPES: TypeDocument[] = ['Facture', 'Contrat', 'Bon de commande', 'Autre']
const ICONS: Record<TypeDocument, typeof FileText> = { Facture: FileText, Contrat: FileSignature, 'Bon de commande': ClipboardList, Autre: FileIcon }

export default function DocumentsModule() {
  const { user } = useAuth()
  const { documents, loading, error } = useDocuments()
  const { cachets } = useCachets()
  const { operations } = useOperations()
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState<TypeDocument>('Facture')
  const [linkValue, setLinkValue] = useState('')
  const [fType, setFType] = useState('')
  const [fLien, setFLien] = useState('')
  const [fQ, setFQ] = useState('')

  const linkOptions = useMemo(() => [
    ...[...cachets].sort((a, b) => a.son.localeCompare(b.son, 'fr')).map((c) => ({ value: `cachet|${c.id}`, label: `Cachet · ${c.son}${c.artiste ? ' — ' + c.artiste : ''}` })),
    ...[...operations].sort((a, b) => a.description.localeCompare(b.description, 'fr')).map((o) => ({ value: `operation|${o.id}`, label: `Revenu/dépense · ${o.description || '(sans description)'}` })),
  ], [cachets, operations])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!user || !file) return
    setUploading(true)
    try {
      const { fileUrl, storagePath } = await uploadDocumentFile(user.uid, file, file.name)
      const lien = linkValue ? { kind: linkValue.split('|')[0] as 'cachet' | 'operation', ref: linkValue.split('|')[1] } : null
      await addDocument(user.uid, { nom: file.name, type: docType, taille: file.size, fileUrl, storagePath, lien })
      setLinkValue('')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSetLink(docId: string, value: string) {
    if (!user) return
    const lien = value ? { kind: value.split('|')[0] as 'cachet' | 'operation', ref: value.split('|')[1] } : null
    await updateDocument(user.uid, docId, { lien })
  }

  const filtered = documents.filter((d) => {
    if (fType && d.type !== fType) return false
    if (fLien === 'none' && d.lien) return false
    if ((fLien === 'cachet' || fLien === 'operation') && (!d.lien || d.lien.kind !== fLien)) return false
    if (fQ) {
      const hay = (d.nom + ' ' + d.type).toLowerCase()
      if (!hay.includes(fQ.toLowerCase())) return false
    }
    return true
  }).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

  const nonRattaches = documents.filter((d) => !d.lien).length
  const sansDoc = cachets.filter((c) => !documents.some((d) => d.lien?.kind === 'cachet' && d.lien.ref === c.id)).map((c) => c.son)

  if (error) return <ErrorBanner message={error} />
  if (loading) return <div className="text-text-muted animate-pulse">Chargement...</div>

  return (
    <div className="space-y-4">
      <p className="text-text-muted text-sm">
        {documents.length} document{documents.length > 1 ? 's' : ''} · {nonRattaches} non rattaché{nonRattaches > 1 ? 's' : ''}
        {sansDoc.length > 0 && <> · aucune pièce pour : {sansDoc.join(', ')}</>}
      </p>

      <div className="card-glass p-5 space-y-3">
        <h3 className="font-semibold text-sm">Ajouter un document</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">Type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value as TypeDocument)}
              className="w-full field">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Lier à</label>
            <select value={linkValue} onChange={(e) => setLinkValue(e.target.value)}
              className="w-full field">
              <option value="">— Aucun —</option>
              {linkOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Fichier</label>
            <label className="field flex items-center gap-2 cursor-pointer hover:border-brand transition-colors">
              <Upload size={14} className={clsx(uploading && 'animate-soft-pulse')} />
              {uploading ? 'Envoi...' : 'Choisir un fichier'}
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={fType} onChange={(e) => setFType(e.target.value)} className="field w-auto px-3 py-1.5 text-xs">
          <option value="">Tous les types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={fLien} onChange={(e) => setFLien(e.target.value)} className="field w-auto px-3 py-1.5 text-xs">
          <option value="">Tous les liens</option>
          <option value="cachet">Liés à un cachet</option>
          <option value="operation">Liés à une opération</option>
          <option value="none">Non rattachés</option>
        </select>
        <input value={fQ} onChange={(e) => setFQ(e.target.value)} placeholder="Rechercher..."
          className="field px-3 py-1.5 text-xs flex-1 min-w-[140px]" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <FileText size={40} className="mx-auto mb-3 text-text-faint" />
          <p className="font-medium">Aucun document pour l&apos;instant 📁</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => {
            const Icon = ICONS[d.type] || FileIcon
            return (
              <div key={d.id} className="card-glass p-4 flex items-center gap-3 transition-transform duration-150 hover:-translate-y-0.5">
                <Icon size={18} className="text-text-muted shrink-0" />
                <div className="min-w-0 flex-1">
                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-sm truncate hover:text-brand transition-colors block">{d.nom}</a>
                  <p className="text-text-muted text-xs mt-0.5">{d.type} · {fmtSize(d.taille)}</p>
                </div>
                <select value={d.lien ? `${d.lien.kind}|${d.lien.ref}` : ''} onChange={(e) => handleSetLink(d.id, e.target.value)}
                  className={clsx('field text-xs px-2 py-1 max-w-[220px]', !d.lien && 'border-yellow-400/50')}>
                  <option value="">— Non rattaché —</option>
                  {linkOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button
                  onClick={() => { if (user && confirm('Supprimer ce document ?')) deleteDocument(user.uid, d.id, d.storagePath) }}
                  className="btn-ghost-icon hover:text-red-400 p-1 shrink-0"><Trash2 size={15} /></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
