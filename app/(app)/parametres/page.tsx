import ParametresModule from '@/components/modules/ParametresModule'

export default function ParametresPage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-text-muted text-sm mt-1">Informations légales utilisées pour générer tes factures PDF</p>
      </div>
      <ParametresModule />
    </main>
  )
}
