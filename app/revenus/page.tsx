import RevenusModule from '@/components/modules/RevenusModule'

export default function RevenusPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Revenus</h1>
        <p className="text-text-muted text-sm mt-1">Concerts, streaming, droits d&apos;auteur et synchronisation</p>
      </div>
      <RevenusModule />
    </main>
  )
}
