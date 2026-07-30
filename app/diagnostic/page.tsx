'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, limit, query } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'

type Step = { label: string; status: 'pending' | 'ok' | 'error'; detail: string }

export default function DiagnosticPage() {
  const [steps, setSteps] = useState<Step[]>([
    { label: 'Configuration Firebase (variables NEXT_PUBLIC_*)', status: 'pending', detail: '' },
    { label: 'Authentification (onAuthStateChanged)', status: 'pending', detail: '' },
    { label: 'Lecture Firestore (getDocs, une seule fois, sans écoute temps réel)', status: 'pending', detail: '' },
  ])

  function update(i: number, patch: Partial<Step>) {
    setSteps((s) => s.map((step, idx) => (idx === i ? { ...step, ...patch } : step)))
  }

  useEffect(() => {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
    const missing = Object.entries(config).filter(([, v]) => !v).map(([k]) => k)
    if (missing.length > 0) {
      update(0, { status: 'error', detail: `Variables manquantes côté build : ${missing.join(', ')}` })
    } else {
      update(0, {
        status: 'ok',
        detail: `projectId=${config.projectId} · authDomain=${config.authDomain} · storageBucket=${config.storageBucket} · apiKey se termine par ...${(config.apiKey || '').slice(-6)}`,
      })
    }

    const timeoutAuth = setTimeout(() => update(1, (s => s)(steps)[1]?.status === 'pending' ? { status: 'error', detail: 'Timeout après 10s — onAuthStateChanged ne répond jamais.' } : {}), 10000)

    const unsub = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeoutAuth)
      if (user) {
        update(1, { status: 'ok', detail: `Connecté en tant que ${user.email || user.uid}` })
      } else {
        update(1, { status: 'error', detail: 'Aucun utilisateur connecté (user est null).' })
      }
    }, (err) => {
      clearTimeout(timeoutAuth)
      const e = err as { code?: string; message: string }
      update(1, { status: 'error', detail: `${e.code || ''} ${e.message}` })
    })

    const t0 = performance.now()
    const timeoutFs = setTimeout(() => {
      update(2, { status: 'error', detail: `Timeout après 15s — getDocs() ne répond jamais (aucune erreur, aucune donnée). C'est un blocage réseau, pas un problème de règles ou de config.` })
    }, 15000)

    getDocs(query(collection(db, 'users'), limit(1)))
      .then((snap) => {
        clearTimeout(timeoutFs)
        const ms = Math.round(performance.now() - t0)
        update(2, { status: 'ok', detail: `Réponse reçue en ${ms} ms (${snap.size} document(s) — normal même si 0, ça prouve que la connexion fonctionne).` })
      })
      .catch((err) => {
        clearTimeout(timeoutFs)
        const ms = Math.round(performance.now() - t0)
        update(2, { status: 'error', detail: `Erreur après ${ms} ms : [${err.code || 'inconnu'}] ${err.message}` })
      })

    return () => { clearTimeout(timeoutAuth); clearTimeout(timeoutFs); unsub() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-6 md:p-10 font-sans">
      <h1 className="text-2xl font-bold mb-2">Diagnostic de connexion</h1>
      <p className="text-text-muted text-sm mb-8">Cette page teste directement Firebase, sans passer par le dashboard. Fais une capture d&apos;écran de ce résultat.</p>
      <div className="space-y-4 max-w-2xl">
        {steps.map((s, i) => (
          <div key={i} className="bg-bg-card border border-bg-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={
                s.status === 'ok' ? 'text-green-400' : s.status === 'error' ? 'text-red-400' : 'text-yellow-400 animate-pulse'
              }>
                {s.status === 'ok' ? '✓' : s.status === 'error' ? '✗' : '…'}
              </span>
              <span className="font-medium text-sm">{s.label}</span>
            </div>
            {s.detail && <p className="text-xs text-text-muted font-mono break-all pl-6">{s.detail}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
