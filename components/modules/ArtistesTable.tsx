'use client'

import { useArtistes } from '@/hooks/useArtistes'

export default function ArtistesTable() {
  const { artistes, loading } = useArtistes()

  if (loading) return <div className="text-text-muted">Chargement...</div>

  if (artistes.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
      <p className="mb-2">Aucun artiste pour le moment</p>
      <p className="text-sm">Ajoutez votre premier artiste pour commencer</p>
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border text-text-muted">
            <th className="text-left py-3 px-4">Nom</th>
            <th className="text-left py-3 px-4">Email</th>
            <th className="text-left py-3 px-4">Genre</th>
          </tr>
        </thead>
        <tbody>
          {artistes.map((a) => (
            <tr key={a.id} className="border-b border-bg-border hover:bg-bg-card transition-colors">
              <td className="py-3 px-4 font-medium">{a.nom} {a.prenom}</td>
              <td className="py-3 px-4 text-text-muted">{a.email ?? '—'}</td>
              <td className="py-3 px-4 text-text-muted">{a.genre ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
