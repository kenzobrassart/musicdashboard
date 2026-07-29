import DashboardStats from '@/components/modules/DashboardStats'

export default function DashboardPage() {
  return (
    <main className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
      <DashboardStats />
    </main>
  )
}
