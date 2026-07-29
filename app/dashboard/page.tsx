import DashboardStats from '@/components/modules/DashboardStats'

export default function DashboardPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-text-muted text-sm mt-1">Vue d&apos;ensemble de votre activité musicale</p>
      </div>
      <DashboardStats />
    </main>
  )
}
