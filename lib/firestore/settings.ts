import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { FiscaSettings, ProfilEmetteur } from '@/lib/types'

const META = 'meta'

export const FISCA_DEFAULT: FiscaSettings = {
  regime: '25.6', taux: 25.6, cfp: 0.2, vl: 0, acre: 1, annee: '',
}

export const PROFIL_DEFAULT: ProfilEmetteur = {
  nom: '', adresse: '', siret: '', email: '', telephone: '', iban: '', bic: '',
  numeroSacem: '', autreIdentifiant: '', mentionTvaDefaut: false,
}

export function subscribeFisca(uid: string, cb: (fx: FiscaSettings) => void, onError?: (e: Error) => void): Unsubscribe {
  return onSnapshot(doc(db, 'users', uid, META, 'fisca'), (snap) => {
    cb(snap.exists() ? ({ ...FISCA_DEFAULT, ...snap.data() } as FiscaSettings) : FISCA_DEFAULT)
  }, (err) => onError?.(err))
}

export async function saveFisca(uid: string, data: Partial<FiscaSettings>) {
  const ref = doc(db, 'users', uid, META, 'fisca')
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data() as FiscaSettings) : FISCA_DEFAULT
  return setDoc(ref, { ...current, ...data })
}

export function subscribeProfil(uid: string, cb: (profil: ProfilEmetteur) => void, onError?: (e: Error) => void): Unsubscribe {
  return onSnapshot(doc(db, 'users', uid, META, 'profil'), (snap) => {
    cb(snap.exists() ? ({ ...PROFIL_DEFAULT, ...snap.data() } as ProfilEmetteur) : PROFIL_DEFAULT)
  }, (err) => onError?.(err))
}

export async function saveProfil(uid: string, data: Partial<ProfilEmetteur>) {
  const ref = doc(db, 'users', uid, META, 'profil')
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data() as ProfilEmetteur) : PROFIL_DEFAULT
  return setDoc(ref, { ...current, ...data })
}
