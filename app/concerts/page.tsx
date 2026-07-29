import ConsertsModule from '@/components/modules/ConsertsModule'

export default function ConsertsPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Concerts</h1>
        <p className="text-text-muted text-sm mt-1">Suivi de vos dates et statuts de concerts</p>
      </div>
      <ConsertsModule />
    </main>
  )
}
