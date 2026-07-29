import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, Timestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Cachet } from '@/lib/types'

const COL = 'cachets'

export function subscribeCachets(uid: string, cb: (cachets: Cachet[]) => void): Unsubscribe {
  const q = query(collection(db, 'users', uid, COL), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Cachet)))
  })
}

export async function addCachet(uid: string, data: Omit<Cachet, 'id' | 'createdAt' | 'updatedAt'>) {
  return addDoc(collection(db, 'users', uid, COL), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
}

export async function updateCachet(uid: string, id: string, data: Partial<Cachet>) {
  return updateDoc(doc(db, 'users', uid, COL, id), { ...data, updatedAt: Timestamp.now() })
}

export async function deleteCachet(uid: string, id: string) {
  return deleteDoc(doc(db, 'users', uid, COL, id))
}
