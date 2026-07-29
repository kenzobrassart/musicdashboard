// ─── Artiste ───────────────────────────────────────────────
export interface Artiste {
  id: string
  nom: string
  prenom: string
  email?: string
  telephone?: string
  genre?: string
  createdAt: Date
  updatedAt: Date
}

// ─── Revenu ────────────────────────────────────────────────
export type TypeRevenu = 'concert' | 'streaming' | 'droits_auteur' | 'sync' | 'autre'

export interface Revenu {
  id: string
  artisteId: string
  montant: number
  type: TypeRevenu
  description?: string
  date: Date
  createdAt: Date
}

// ─── Dépense ───────────────────────────────────────────────
export type TypeDepense = 'studio' | 'marketing' | 'transport' | 'materiel' | 'cachet' | 'autre'

export interface Depense {
  id: string
  artisteId?: string
  montant: number
  type: TypeDepense
  description?: string
  date: Date
  createdAt: Date
}

// ─── Concert ───────────────────────────────────────────────
export type StatutConcert = 'confirme' | 'en_attente' | 'annule'

export interface Concert {
  id: string
  artisteId: string
  lieu: string
  ville: string
  date: Date
  cachet: number
  statut: StatutConcert
  notes?: string
  createdAt: Date
}

// ─── Stats Dashboard ───────────────────────────────────────
export interface DashboardStats {
  totalRevenus: number
  totalDepenses: number
  beneficeNet: number
  nbConcerts: number
  nbArtistes: number
}
