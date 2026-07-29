'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, TrendingUp, TrendingDown, Music, FileText } from 'lucide-react'
import { clsx } from 'clsx'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/artistes',  label: 'Artistes',  icon: Users },
  { href: '/revenus',   label: 'Revenus',   icon: TrendingUp },
  { href: '/depenses',  label: 'Dépenses',  icon: TrendingDown },
  { href: '/concerts',  label: 'Concerts',  icon: Music },
  { href: '/factures',  label: 'Factures',  icon: FileText },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-bg-secondary border-r border-bg-border px-3 py-6">
      <div className="mb-8 px-3">
        <span className="text-brand font-bold text-lg tracking-tight">Compta Musique</span>
      </div>
      <nav className="flex flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-brand/10 text-brand'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-card'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
