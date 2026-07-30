import { AlertTriangle } from 'lucide-react'

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-4 flex items-start gap-3 text-sm">
      <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
      <div className="text-red-200">
        <p className="font-medium">Impossible de charger les données depuis Firestore.</p>
        <p className="text-red-300/80 text-xs mt-1 font-mono break-all">{message}</p>
        <p className="text-red-300/80 text-xs mt-2">
          Vérifiez que Firestore est activé, que les règles de sécurité (firestore.rules) sont bien publiées,
          et que les variables NEXT_PUBLIC_FIREBASE_* sont correctes sur Vercel.
        </p>
      </div>
    </div>
  )
}
