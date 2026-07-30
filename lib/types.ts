// ─── Cachet (placement de prod) ───────────────────────────
export type StatutDate = 'ok' | 'approx' | 'manquante'

export interface Cachet {
  id: string
  date: string // ISO date de sortie, peut être vide
  artiste: string
  son: string
  quantite: number
  montant: number // cachet brut total (avant partage coprod)
  nbComp: number // nombre de compositeurs / coprods
  maPart: number | null // override manuel de ma part, sinon montant*quantite/nbComp
  paye: boolean
  datePaiement: string // 'YYYY-MM'
  dateStatut: StatutDate
  exclu: boolean // exclu des statistiques (toujours compté en fiscalité/synthèse)
  factureId?: string // facture liée si créée depuis l'outil de facturation
  clientId?: string
  createdAt: Date
  updatedAt: Date
}

// ─── Opération diverse (revenu / dépense hors cachet) ─────
export type TypeOperation = 'revenu' | 'depense'

export interface Operation {
  id: string
  date: string // ISO
  type: TypeOperation
  categorie: string
  description: string
  montant: number
  exclu: boolean
  factureId?: string
  clientId?: string
  createdAt: Date
  updatedAt: Date
}

// ─── Document ──────────────────────────────────────────────
export type TypeDocument = 'Facture' | 'Contrat' | 'Bon de commande' | 'Autre'
export type LienKind = 'cachet' | 'operation'

export interface LienDocument {
  kind: LienKind
  ref: string // id du cachet ou de l'opération
}

export interface DocumentFichier {
  id: string
  nom: string
  type: TypeDocument
  taille: number
  fileUrl: string // Firebase Storage download URL
  storagePath: string
  lien: LienDocument | null
  factureId?: string
  createdAt: Date
}

// ─── Client (répertoire pour la facturation) ──────────────
export interface Client {
  id: string
  nom: string // nom / raison sociale
  contact?: string
  email?: string
  telephone?: string
  adresse?: string
  siret?: string
  tvaIntracom?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// ─── Facture ───────────────────────────────────────────────
export type StatutFacture = 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee'
export type NatureFacture = 'cachet' | 'autre'

export interface LigneFacture {
  description: string
  quantite: number
  prixUnitaire: number
}

export interface Facture {
  id: string
  numero: string
  clientId: string
  clientNom: string // dénormalisé pour affichage rapide
  nature: NatureFacture // 'cachet' => crée/maj un placement, 'autre' => crée/maj une opération
  son?: string // requis si nature = 'cachet'
  nbComp?: number
  categorie?: string // requis si nature = 'autre'
  lignes: LigneFacture[]
  montantHT: number
  tva: number
  montantTTC: number
  mentionTva: boolean // true = TVA applicable, false = "TVA non applicable, art. 293B du CGI"
  statut: StatutFacture
  dateEmission: string // ISO
  dateEcheance: string // ISO
  datePaiement?: string // ISO, renseignée au passage en "payée"
  notes?: string
  cachetId?: string // lien vers le placement généré
  operationId?: string // lien vers l'opération générée
  documentId?: string
  createdAt: Date
  updatedAt: Date
}

// ─── Profil émetteur (mes informations pour les factures) ─
export interface ProfilEmetteur {
  nom: string
  adresse: string
  siret: string
  email: string
  telephone?: string
  iban?: string
  bic?: string
  mentionTvaDefaut: boolean
}

// ─── Fiscalité (paramètres URSSAF) ─────────────────────────
export interface FiscaSettings {
  regime: '25.6' | '21.2' | '23.2' | '12.3'
  taux: number
  cfp: number // contribution formation professionnelle (%)
  vl: number // versement libératoire IR (%), 0 si non opté
  acre: number // 1 = taux plein, 0.5 = abattement ACRE (approx.)
  annee: string // filtre année sélectionnée, '' = toutes
}

export const TAUX_URSSAF: Record<FiscaSettings['regime'], number> = {
  '25.6': 25.6,
  '21.2': 21.2,
  '23.2': 23.2,
  '12.3': 12.3,
}

export interface LigneFiscale {
  ca: number
  cot: number
  cfp: number
  vl: number
  du: number
  net: number
}
