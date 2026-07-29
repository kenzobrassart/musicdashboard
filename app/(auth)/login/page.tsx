'use client'

import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="bg-bg-card border border-bg-border rounded-xl p-8 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-2">Compta Musique</h1>
        <p className="text-text-muted mb-8 text-sm">Connectez-vous pour accéder à votre espace</p>
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-brand hover:bg-brand-hover text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Connexion avec Google
        </button>
      </div>
    </div>
  )
}
