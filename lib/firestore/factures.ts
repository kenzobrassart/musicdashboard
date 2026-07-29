import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, Timestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Facture } from '@/lib/types'

const COL = 'factures'

export function subscribeFactures(
  uid: string,
  cb: (factures: Facture[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users', uid, COL),
    orderBy('dateEmission', 'desc')
  )
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Facture)))
  })
}

export async function addFacture(uid: string, data: Omit<Facture, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'users', uid, COL), {
    ...data,
    createdAt: Timestamp.now(),
  })
}

export async function updateFacture(uid: string, id: string, data: Partial<Facture>) {
  return updateDoc(doc(db, 'users', uid, COL, id), data)
}

export async function deleteFacture(uid: string, id: string) {
  return deleteDoc(doc(db, 'users', uid, COL, id))
}
