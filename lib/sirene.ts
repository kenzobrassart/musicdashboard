// Recherche d'entreprises françaises (nom, SIREN, SIRET...) via l'API publique
// et gratuite du gouvernement — aucune clé requise, CORS ouvert.
// https://recherche-entreprises.api.gouv.fr

export interface EntrepriseResult {
  nom: string
  siren: string
  siret: string
  adresse: string
  tvaIntracom: string
}

interface ApiSiege {
  siret?: string
  adresse?: string
  numero_voie?: string
  type_voie?: string
  libelle_voie?: string
  code_postal?: string
  libelle_commune?: string
}

interface ApiResult {
  siren?: string
  nom_complet?: string
  nom_raison_sociale?: string
  siege?: ApiSiege
}

// Clé de TVA intracommunautaire française — calculée à partir du SIREN,
// aucun appel réseau nécessaire (formule officielle : (12 + 3·SIREN mod 97) mod 97).
export function tvaFromSiren(siren: string): string {
  const n = parseInt(siren, 10)
  if (!siren || isNaN(n)) return ''
  const cle = (12 + 3 * (n % 97)) % 97
  return `FR${String(cle).padStart(2, '0')}${siren}`
}

function formatAdresse(siege: ApiSiege | undefined): string {
  if (!siege) return ''
  if (siege.adresse) return siege.adresse
  const voie = [siege.numero_voie, siege.type_voie, siege.libelle_voie].filter(Boolean).join(' ')
  const ville = [siege.code_postal, siege.libelle_commune].filter(Boolean).join(' ')
  return [voie, ville].filter(Boolean).join(', ')
}

export async function searchEntreprises(query: string): Promise<EntrepriseResult[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&per_page=6`)
  if (!res.ok) throw new Error('Recherche indisponible')
  const data = await res.json()
  const results: ApiResult[] = Array.isArray(data.results) ? data.results : []
  return results
    .map((r) => {
      const siren = r.siren || ''
      const siret = r.siege?.siret || ''
      return {
        nom: r.nom_complet || r.nom_raison_sociale || '',
        siren,
        siret,
        adresse: formatAdresse(r.siege),
        tvaIntracom: siren ? tvaFromSiren(siren) : '',
      }
    })
    .filter((r) => r.nom)
}
