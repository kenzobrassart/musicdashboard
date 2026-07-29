'use client'

import { useRevenus } from '@/hooks/useRevenus'
import { useDepenses } from '@/hooks/useDepenses'
import { TrendingUp, TrendingDown, DollarSign, Music } from 'lucide-react'

export default function DashboardStats() {
  const { revenus } = useRevenus()
  const { depenses } = useDepenses()

  const totalRevenus = revenus.reduce((s, r) => s + r.montant, 0)
  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0)
  const benefice = totalRevenus - totalDepenses

  const stats = [
    { label: 'Revenus', value: totalRevenus, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Dépenses', value: totalDepenses, icon: TrendingDown, color: 'text-red-400' },
    { label: 'Bénéfice net', value: benefice, icon: DollarSign, color: benefice >= 0 ? 'text-green-400' : 'text-red-400' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-bg-card border border-bg-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-muted text-sm">{label}</span>
            <Icon size={18} className={color} />
          </div>
          <p className={`text-2xl font-bold tabular-nums ${color}`}>
            {value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
      ))}
    </div>
  )
}
