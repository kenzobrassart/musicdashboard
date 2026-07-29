import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, Timestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Depense } from '@/lib/types'

const COL = 'depenses'

export function subscribeDepenses(
  uid: string,
  cb: (depenses: Depense[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users', uid, COL),
    orderBy('date', 'desc')
  )
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Depense)))
  })
}

export async function addDepense(uid: string, data: Omit<Depense, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'users', uid, COL), {
    ...data,
    createdAt: Timestamp.now(),
  })
}

export async function deleteDepense(uid: string, id: string) {
  return deleteDoc(doc(db, 'users', uid, COL, id))
}
