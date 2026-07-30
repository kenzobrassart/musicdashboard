'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Music2, Wallet, Landmark, FileText, FolderOpen, BarChart3, Users,
  MoreHorizontal, Pin, PinOff, X,
} from 'lucide-react'
import { clsx } from 'clsx'

const ALL_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cachets', label: 'Cachets', icon: Music2 },
  { href: '/operations', label: 'Opérations', icon: Wallet },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/fiscalite', label: 'Fiscalité', icon: Landmark },
  { href: '/statistiques', label: 'Statistiques', icon: BarChart3 },
  { href: '/factures', label: 'Factures', icon: FileText },
  { href: '/contacts', label: 'Contacts', icon: Users },
]
const DEFAULT_PICKS = ['/dashboard', '/cachets', '/operations', '/factures']
const STORAGE_KEY = 'studio-ops-bottom-nav'
const MAX_PICKS = 4

export default function BottomNav() {
  const pathname = usePathname()
  const [picks, setPicks] = useState<string[]>(DEFAULT_PICKS)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) setPicks(parsed.slice(0, MAX_PICKS))
      }
    } catch { /* localStorage indisponible, on garde les défauts */ }
  }, [])

  function togglePick(href: string) {
    setPicks((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : prev.length < MAX_PICKS ? [...prev, href] : prev
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  const items = ALL_ITEMS.filter((i) => picks.includes(i.href))

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/[0.04] backdrop-blur-xl border-t border-white/[0.08] flex justify-around py-2 z-50">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-xs min-w-[44px] min-h-[44px] justify-center',
                'transition-all duration-200 ease-out active:scale-90',
                active ? 'text-brand' : 'text-text-faint'
              )}
            >
              <Icon size={20} className={clsx('transition-transform duration-200 ease-out', active && 'scale-110 -translate-y-0.5')} />
              <span>{label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setSheetOpen(true)}
          aria-label="Plus de raccourcis"
          className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-xs min-w-[44px] min-h-[44px] justify-center text-text-faint transition-all duration-200 ease-out active:scale-90"
        >
          <MoreHorizontal size={20} />
          <span>Plus</span>
        </button>
      </nav>

      {sheetOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setSheetOpen(false)} />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 card-glass rounded-b-none border-b-0 p-4 pb-6 animate-fade-in-up max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">Navigation</h3>
              <button onClick={() => setSheetOpen(false)} className="btn-ghost-icon p-1.5"><X size={18} /></button>
            </div>
            <p className="text-text-faint text-xs mb-3">Épingle jusqu&apos;à {MAX_PICKS} raccourcis pour la barre du bas ({picks.length}/{MAX_PICKS}).</p>
            <div className="space-y-1">
              {ALL_ITEMS.map(({ href, label, icon: Icon }) => {
                const pinned = picks.includes(href)
                return (
                  <div key={href} className="flex items-center gap-2">
                    <Link
                      href={href}
                      onClick={() => setSheetOpen(false)}
                      className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-white/[0.05] transition-colors duration-150"
                    >
                      <Icon size={18} className="text-text-muted" />
                      {label}
                    </Link>
                    <button
                      onClick={() => togglePick(href)}
                      disabled={!pinned && picks.length >= MAX_PICKS}
                      title={pinned ? 'Retirer de la barre du bas' : 'Épingler à la barre du bas'}
                      className={clsx('btn-ghost-icon p-2', pinned ? 'text-brand' : 'text-text-faint', !pinned && picks.length >= MAX_PICKS && 'opacity-30')}
                    >
                      {pinned ? <Pin size={16} /> : <PinOff size={16} />}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
