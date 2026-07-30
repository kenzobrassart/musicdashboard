import { create } from 'zustand'

export type QuickActionType = 'cachet' | 'operation' | 'facture' | 'document'

interface QuickActionState {
  pending: QuickActionType | null
  trigger: (type: QuickActionType) => void
  consume: () => void
}

// Le bouton d'action rapide pose une intention ("ouvre le formulaire cachet"),
// et la page cible la consomme au montage pour ouvrir son propre formulaire —
// évite de dupliquer chaque formulaire dans une modale globale séparée.
export const useQuickActionStore = create<QuickActionState>((set) => ({
  pending: null,
  trigger: (type) => set({ pending: type }),
  consume: () => set({ pending: null }),
}))
