import FacturesModule from '@/components/modules/FacturesModule'

export default function FacturesPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Factures</h1>
        <p className="text-text-muted text-sm mt-1">Création, suivi et gestion de vos factures</p>
      </div>
      <FacturesModule />
    </main>
  )
}
