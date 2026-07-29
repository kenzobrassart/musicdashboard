import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, Timestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Concert } from '@/lib/types'

const COL = 'concerts'

export function subscribeConcerts(
  uid: string,
  cb: (concerts: Concert[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users', uid, COL),
    orderBy('date', 'desc')
  )
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Concert)))
  })
}

export async function addConcert(uid: string, data: Omit<Concert, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'users', uid, COL), {
    ...data,
    createdAt: Timestamp.now(),
  })
}

export async function updateConcert(uid: string, id: string, data: Partial<Concert>) {
  return updateDoc(doc(db, 'users', uid, COL, id), data)
}

export async function deleteConcert(uid: string, id: string) {
  return deleteDoc(doc(db, 'users', uid, COL, id))
}
