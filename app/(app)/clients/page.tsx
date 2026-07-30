import ClientsModule from '@/components/modules/ClientsModule'

export default function ClientsPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <p className="text-text-muted text-sm mt-1">Répertoire utilisé pour la création de factures</p>
      </div>
      <ClientsModule />
    </main>
  )
}
