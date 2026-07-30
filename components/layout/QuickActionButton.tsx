'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Music2, Wallet, FileText, FolderOpen } from 'lucide-react'
import { useQuickActionStore, type QuickActionType } from '@/lib/store'
import { clsx } from 'clsx'

const ACTIONS: { type: QuickActionType; label: string; icon: typeof Music2; href: string }[] = [
  { type: 'facture', label: 'Nouvelle facture', icon: FileText, href: '/factures' },
  { type: 'cachet', label: 'Nouveau cachet', icon: Music2, href: '/cachets' },
  { type: 'operation', label: 'Nouvelle opération', icon: Wallet, href: '/operations' },
  { type: 'document', label: 'Nouveau document', icon: FolderOpen, href: '/documents' },
]

export default function QuickActionButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const trigger = useQuickActionStore((s) => s.trigger)

  function handlePick(a: (typeof ACTIONS)[number]) {
    setOpen(false)
    trigger(a.type)
    router.push(a.href)
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />}
      <div className="fixed z-40 bottom-24 md:bottom-6 right-4 md:right-6 flex flex-col items-end gap-2.5">
        {open && (
          <div className="flex flex-col items-end gap-2">
            {ACTIONS.map((a, i) => (
              <button
                key={a.type}
                onClick={() => handlePick(a)}
                className="animate-fade-in-up flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full card-glass text-sm font-medium shadow-lg transition-all duration-200 hover:-translate-x-1"
                style={{ animationDelay: `${i * 35}ms` }}
              >
                {a.label}
                <span className="w-9 h-9 rounded-full bg-brand/15 text-brand flex items-center justify-center shrink-0">
                  <a.icon size={16} />
                </span>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Fermer' : 'Action rapide'}
          aria-expanded={open}
          className={clsx(
            'w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center',
            'shadow-lg shadow-brand/30 transition-all duration-300 ease-out hover:scale-105 active:scale-90',
            open && 'rotate-45'
          )}
        >
          <Plus size={26} />
        </button>
      </div>
    </>
  )
}
