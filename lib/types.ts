// ─── Cachet (placement de prod) ───────────────────────────
export type StatutDate = 'ok' | 'approx' | 'manquante'

export interface Cachet {
  id: string
  date: string // ISO date de sortie, peut être vide
  artiste: string
  son: string
  quantite: number
  montant: number // cachet brut total (avant partage coprod)
  coauteurs: string[] // noms des autres compositeurs (moi exclu) — nbComp = coauteurs.length + 1
  maPart: number | null // override manuel de ma part, sinon montant*quantite/(coauteurs.length+1)
  paye: boolean
  datePaiement: string // 'YYYY-MM'
  dateStatut: StatutDate
  exclureStats: boolean // exclu des statistiques uniquement
  exclureFiscal: boolean // exclu du calcul des cotisations URSSAF uniquement
  factureId?: string // facture liée si créée depuis l'outil de facturation
  contactId?: string
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
  exclureStats: boolean // exclu des statistiques uniquement
  exclureFiscal: boolean // exclu du calcul des cotisations URSSAF uniquement
  factureId?: string
  contactId?: string
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

// ─── Contact (répertoire — artistes, labels, clients) ─────
// S'enrichit progressivement : un nouveau nom saisi dans un cachet ou une
// facture crée automatiquement sa fiche contact s'il n'existe pas déjà.
export interface Contact {
  id: string
  nom: string // nom / raison sociale / nom d'artiste
  interlocuteur?: string // personne à contacter, si différente du nom
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
  contactId: string
  contactNom: string // dénormalisé pour affichage rapide
  nature: NatureFacture // 'cachet' => crée/maj un placement, 'autre' => crée/maj une opération
  son?: string // requis si nature = 'cachet'
  coauteurs?: string[] // requis si nature = 'cachet'
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
