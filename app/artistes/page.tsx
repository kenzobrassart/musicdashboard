import ArtistesTable from '@/components/modules/ArtistesTable'

export default function ArtistesPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Artistes</h1>
        <p className="text-text-muted text-sm mt-1">Gérez vos artistes et leurs informations</p>
      </div>
      <ArtistesTable />
    </main>
  )
}
