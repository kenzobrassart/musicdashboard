import StatistiquesModule from '@/components/modules/StatistiquesModule'

export default function StatistiquesPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <p className="text-text-muted text-sm mt-1">Performance par artiste et évolution des encaissements</p>
      </div>
      <StatistiquesModule />
    </main>
  )
}
