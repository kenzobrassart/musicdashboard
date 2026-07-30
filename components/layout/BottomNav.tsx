'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Music2, Wallet, Landmark, FileText } from 'lucide-react'
import { clsx } from 'clsx'

// 5 items max sur mobile — le reste (Documents, Statistiques, Contacts) est accessible via la Sidebar desktop
const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cachets', label: 'Cachets', icon: Music2 },
  { href: '/operations', label: 'Opérations', icon: Wallet },
  { href: '/fiscalite', label: 'Fiscalité', icon: Landmark },
  { href: '/factures', label: 'Factures', icon: FileText },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/[0.04] backdrop-blur-xl border-t border-white/[0.08] flex justify-around py-2 z-50">
      {nav.map(({ href, label, icon: Icon }) => {
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
    </nav>
  )
}
