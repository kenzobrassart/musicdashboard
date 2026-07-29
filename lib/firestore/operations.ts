import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, Timestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Operation } from '@/lib/types'

const COL = 'operations'

export function subscribeOperations(uid: string, cb: (operations: Operation[]) => void): Unsubscribe {
  const q = query(collection(db, 'users', uid, COL), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Operation)))
  })
}

export async function addOperation(uid: string, data: Omit<Operation, 'id' | 'createdAt' | 'updatedAt'>) {
  return addDoc(collection(db, 'users', uid, COL), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
}

export async function updateOperation(uid: string, id: string, data: Partial<Operation>) {
  return updateDoc(doc(db, 'users', uid, COL, id), { ...data, updatedAt: Timestamp.now() })
}

export async function deleteOperation(uid: string, id: string) {
  return deleteDoc(doc(db, 'users', uid, COL, id))
}
