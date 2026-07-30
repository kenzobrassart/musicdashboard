'use client'

import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  type AuthError,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

const ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Adresse email invalide.',
  'auth/user-not-found': "Aucun compte avec cet email — clique sur « Créer un compte » ci-dessous.",
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/email-already-in-use': 'Un compte existe déjà avec cet email — connecte-toi plutôt.',
  'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
  'auth/operation-not-allowed': "La connexion par email/mot de passe n'est pas activée sur le projet Firebase (Authentication → Sign-in method → Email/Password).",
  'auth/too-many-requests': 'Trop de tentatives — réessaie dans quelques minutes.',
}

function messageFor(err: unknown) {
  const code = (err as AuthError)?.code
  return (code && ERROR_MESSAGES[code]) || (err as Error)?.message || 'Une erreur est survenue.'
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      router.push('/dashboard')
    } catch (err) {
      setError(messageFor(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    setError('')
    setInfo('')
    if (!email) { setError('Renseigne ton email ci-dessus, puis clique sur « mot de passe oublié ».'); return }
    try {
      await sendPasswordResetEmail(auth, email)
      setInfo('Email de réinitialisation envoyé.')
    } catch (err) {
      setError(messageFor(err))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="bg-bg-card border border-bg-border rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-center">Compta Musique</h1>
        <p className="text-text-muted mb-6 text-sm text-center">
          {mode === 'login' ? 'Connecte-toi pour accéder à ton espace' : 'Crée ton compte'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-text-muted block mb-1">Email</label>
            <input
              required type="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              placeholder="toi@exemple.fr"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Mot de passe</label>
            <input
              required type="password" minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-primary border border-bg-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-xs leading-relaxed">{error}</p>}
          {info && <p className="text-green-400 text-xs leading-relaxed">{info}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand hover:bg-brand-hover text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Un instant...' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
          </button>
        </form>

        <div className="flex items-center justify-between mt-4 text-xs">
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo('') }}
            className="text-text-muted hover:text-brand transition-colors"
          >
            {mode === 'login' ? 'Créer un compte' : 'Déjà un compte ? Se connecter'}
          </button>
          {mode === 'login' && (
            <button type="button" onClick={handleReset} className="text-text-muted hover:text-brand transition-colors">
              Mot de passe oublié
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
