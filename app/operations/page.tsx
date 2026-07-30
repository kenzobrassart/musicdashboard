import OperationsModule from '@/components/modules/OperationsModule'

export default function OperationsPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Revenus & dépenses</h1>
        <p className="text-text-muted text-sm mt-1">Avances, achats de matériel, sync et autres mouvements hors cachets</p>
      </div>
      <OperationsModule />
    </main>
  )
}
