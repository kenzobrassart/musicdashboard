import {
  collection, doc, getDocs, addDoc, updateDoc,
  deleteDoc, onSnapshot, query, orderBy, Timestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Artiste } from '@/lib/types'

const COL = 'artistes'

export function subscribeArtistes(
  uid: string,
  cb: (artistes: Artiste[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'users', uid, COL),
    orderBy('nom', 'asc')
  )
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Artiste)))
  })
}

export async function addArtiste(uid: string, data: Omit<Artiste, 'id' | 'createdAt' | 'updatedAt'>) {
  return addDoc(collection(db, 'users', uid, COL), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
}

export async function updateArtiste(uid: string, id: string, data: Partial<Artiste>) {
  return updateDoc(doc(db, 'users', uid, COL, id), {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteArtiste(uid: string, id: string) {
  return deleteDoc(doc(db, 'users', uid, COL, id))
}
