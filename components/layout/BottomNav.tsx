'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, TrendingUp, TrendingDown, Music, FileText } from 'lucide-react'
import { clsx } from 'clsx'

// 5 items max sur mobile — Dashboard, Revenus, Dépenses, Concerts, Factures
// Artistes accessible via Sidebar desktop ou page Dashboard
const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/revenus',   label: 'Revenus',   icon: TrendingUp },
  { href: '/depenses',  label: 'Dépenses',  icon: TrendingDown },
  { href: '/concerts',  label: 'Concerts',  icon: Music },
  { href: '/factures',  label: 'Factures',  icon: FileText },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-bg-border flex justify-around py-2 z-50">
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            'flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors min-w-[44px] min-h-[44px] justify-center',
            pathname === href ? 'text-brand' : 'text-text-faint'
          )}
        >
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
