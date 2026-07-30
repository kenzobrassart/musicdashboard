import FiscaliteModule from '@/components/modules/FiscaliteModule'

export default function FiscalitePage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Fiscalité</h1>
        <p className="text-text-muted text-sm mt-1">Cotisations URSSAF dues par mois selon vos encaissements</p>
      </div>
      <FiscaliteModule />
    </main>
  )
}
