'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Music2, Wallet, FolderOpen, Landmark, BarChart3, FileText, Users, Settings } from 'lucide-react'
import { clsx } from 'clsx'
import Logo from '@/components/ui/Logo'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cachets', label: 'Cachets', icon: Music2 },
  { href: '/operations', label: 'Revenus & dépenses', icon: Wallet },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/fiscalite', label: 'Fiscalité', icon: Landmark },
  { href: '/statistiques', label: 'Statistiques', icon: BarChart3 },
  { href: '/factures', label: 'Factures', icon: FileText },
  { href: '/contacts', label: 'Contacts', icon: Users },
]

const navSysteme = [
  { href: '/parametres', label: 'Paramètres', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white/[0.02] backdrop-blur-xl border-r border-white/[0.06] px-3 py-6">
      <div className="mb-8 px-3 flex items-center gap-2.5">
        <Logo size={30} />
        <span className="font-bold text-lg tracking-tight">Dashboard</span>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-200 ease-out',
                active
                  ? 'bg-brand/[0.12] text-brand'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/[0.05] hover:translate-x-0.5'
              )}
            >
              <span className={clsx(
                'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full bg-brand transition-all duration-200 ease-out',
                active ? 'h-5 opacity-100' : 'h-0 opacity-0'
              )} />
              <Icon size={18} className="transition-transform duration-200 ease-out group-hover:scale-110" />
              {label}
            </Link>
          )
        })}
      </nav>
      <nav className="flex flex-col gap-1 pt-3 border-t border-white/[0.06]">
        {navSysteme.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-200 ease-out',
                active
                  ? 'bg-brand/[0.12] text-brand'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/[0.05] hover:translate-x-0.5'
              )}
            >
              <Icon size={18} className="transition-transform duration-200 ease-out group-hover:scale-110" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
