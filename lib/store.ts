import { create } from 'zustand'

export type QuickActionType = 'cachet' | 'operation' | 'facture' | 'document'

export interface FactureDraft {
  contactNom: string
  son: string
  coauteurs: string[]
  quantite: number
  prixUnitaire: number
  cachetId: string
}

interface QuickActionState {
  pending: QuickActionType | null
  factureDraft: FactureDraft | null
  trigger: (type: QuickActionType) => void
  consume: () => void
  triggerFactureFromCachet: (draft: FactureDraft) => void
  consumeFactureDraft: () => void
}

// Le bouton d'action rapide pose une intention ("ouvre le formulaire cachet"),
// et la page cible la consomme au montage pour ouvrir son propre formulaire —
// évite de dupliquer chaque formulaire dans une modale globale séparée.
export const useQuickActionStore = create<QuickActionState>((set) => ({
  pending: null,
  factureDraft: null,
  trigger: (type) => set({ pending: type }),
  consume: () => set({ pending: null }),
  triggerFactureFromCachet: (draft) => set({ pending: 'facture', factureDraft: draft }),
  consumeFactureDraft: () => set({ factureDraft: null }),
}))
