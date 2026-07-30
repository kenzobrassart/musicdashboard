import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, Timestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Client } from '@/lib/types'

const COL = 'clients'

export function subscribeClients(uid: string, cb: (clients: Client[]) => void, onError?: (e: Error) => void): Unsubscribe {
  const q = query(collection(db, 'users', uid, COL), orderBy('nom', 'asc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Client)))
  }, (err) => onError?.(err))
}

export async function addClient(uid: string, data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
  return addDoc(collection(db, 'users', uid, COL), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
}

export async function updateClient(uid: string, id: string, data: Partial<Client>) {
  return updateDoc(doc(db, 'users', uid, COL, id), { ...data, updatedAt: Timestamp.now() })
}

export async function deleteClient(uid: string, id: string) {
  return deleteDoc(doc(db, 'users', uid, COL, id))
}
