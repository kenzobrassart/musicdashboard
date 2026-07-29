import DepensesModule from '@/components/modules/DepensesModule'

export default function DepensesPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dépenses</h1>
        <p className="text-text-muted text-sm mt-1">Studio, marketing, transport et matériel</p>
      </div>
      <DepensesModule />
    </main>
  )
}
