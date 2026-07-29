import type { Cachet, Operation, FiscaSettings, LigneFiscale } from './types'

const MOIS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export function fmt(n: number) {
  const v = Math.round(n * 100) / 100
  const dec = Math.abs(v - Math.round(v)) < 0.005 ? 0 : 2
  return v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + ' €'
}

export function fmtSize(b: number) {
  if (!b) return '—'
  if (b < 1024) return b + ' o'
  if (b < 1048576) return Math.round(b / 1024) + ' Ko'
  return (b / 1048576).toFixed(1) + ' Mo'
}

export function fmtMois(m: string) {
  if (!m) return ''
  const p = m.split('-')
  const i = parseInt(p[1], 10) - 1
  return i >= 0 && i < 12 ? MOIS_FR[i] + ' ' + p[0] : m
}

export function qte(c: Pick<Cachet, 'quantite'>) {
  const q = Math.floor(c.quantite)
  return isNaN(q) || q < 1 ? 1 : q
}

export function nbComp(c: Pick<Cachet, 'nbComp'>) {
  const n = Math.floor(c.nbComp)
  return isNaN(n) || n < 1 ? 1 : n
}

export function brut(c: Pick<Cachet, 'montant' | 'quantite'>) {
  return c.montant * qte(c)
}

// Ma part = valeur manuelle si renseignée, sinon brut / nombre de coprods
export function part(c: Pick<Cachet, 'montant' | 'quantite' | 'nbComp' | 'maPart'>) {
  const p = c.maPart
  if (p !== null && p !== undefined && !isNaN(p)) return p
  return brut(c) / nbComp(c)
}

export function ligneFiscale(ca: number, fx: FiscaSettings): LigneFiscale {
  const cot = ca * (fx.taux / 100) * fx.acre
  const cfp = ca * (fx.cfp / 100)
  const vl = ca * (fx.vl / 100)
  const du = cot + cfp + vl
  return { ca, cot, cfp, vl, du, net: ca - du }
}

// Regroupe les encaissements par mois (YYYY-MM) : cachets payés par datePaiement,
// autres revenus par leur date. pourStats=true exclut les lignes marquées "exclu".
export function encaissementsParMois(
  cachets: Cachet[],
  operations: Operation[],
  pourStats: boolean
): Record<string, { cachets: number; autres: number }> {
  const map: Record<string, { cachets: number; autres: number }> = {}
  const add = (m: string, champ: 'cachets' | 'autres', v: number) => {
    if (!map[m]) map[m] = { cachets: 0, autres: 0 }
    map[m][champ] += v
  }
  const cs = pourStats ? cachets.filter((c) => !c.exclu) : cachets
  const os = pourStats ? operations.filter((o) => !o.exclu) : operations
  cs.forEach((c) => {
    if (c.paye && c.datePaiement) add(c.datePaiement, 'cachets', part(c))
  })
  os.forEach((o) => {
    if (o.type === 'revenu' && o.date) add(o.date.slice(0, 7), 'autres', o.montant)
  })
  return map
}
