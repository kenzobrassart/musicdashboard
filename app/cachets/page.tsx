import CachetsModule from '@/components/modules/CachetsModule'

export default function CachetsPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Cachets</h1>
        <p className="text-text-muted text-sm mt-1">Suivi des prods placées, coprods et ma part sur chaque cachet</p>
      </div>
      <CachetsModule />
    </main>
  )
}
