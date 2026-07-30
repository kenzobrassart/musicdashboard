import DocumentsModule from '@/components/modules/DocumentsModule'

export default function DocumentsPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-text-muted text-sm mt-1">Factures, contrats et bons de commande liés à chaque placement</p>
      </div>
      <DocumentsModule />
    </main>
  )
}
