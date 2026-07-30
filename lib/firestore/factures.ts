import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, Timestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Facture } from '@/lib/types'

const COL = 'factures'

export function subscribeFactures(uid: string, cb: (factures: Facture[]) => void, onError?: (e: Error) => void): Unsubscribe {
  const q = query(collection(db, 'users', uid, COL), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Facture)))
  }, (err) => onError?.(err))
}

export async function addFacture(uid: string, data: Omit<Facture, 'id' | 'createdAt' | 'updatedAt'>) {
  return addDoc(collection(db, 'users', uid, COL), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
}

export async function updateFacture(uid: string, id: string, data: Partial<Facture>) {
  return updateDoc(doc(db, 'users', uid, COL, id), { ...data, updatedAt: Timestamp.now() })
}

export async function deleteFacture(uid: string, id: string) {
  return deleteDoc(doc(db, 'users', uid, COL, id))
}

export function genNumeroFacture(factures: Pick<Facture, 'numero'>[]) {
  const year = new Date().getFullYear()
  const count = factures.filter((f) => f.numero.startsWith(`FAC-${year}`)).length + 1
  return `FAC-${year}-${String(count).padStart(3, '0')}`
}
