import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, Timestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Revenu } from '@/lib/types'

const COL = 'revenus'

export function subscribeRevenus(
  uid: string,
  cb: (revenus: Revenu[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users', uid, COL),
    orderBy('date', 'desc')
  )
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Revenu)))
  })
}

export async function addRevenu(uid: string, data: Omit<Revenu, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'users', uid, COL), {
    ...data,
    createdAt: Timestamp.now(),
  })
}

export async function updateRevenu(uid: string, id: string, data: Partial<Revenu>) {
  return updateDoc(doc(db, 'users', uid, COL, id), data)
}

export async function deleteRevenu(uid: string, id: string) {
  return deleteDoc(doc(db, 'users', uid, COL, id))
}
