import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, Timestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Contact } from '@/lib/types'

const COL = 'contacts'

export function subscribeContacts(uid: string, cb: (contacts: Contact[]) => void, onError?: (e: Error) => void): Unsubscribe {
  const q = query(collection(db, 'users', uid, COL), orderBy('nom', 'asc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contact)))
  }, (err) => onError?.(err))
}

export async function addContact(uid: string, data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) {
  return addDoc(collection(db, 'users', uid, COL), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
}

export async function updateContact(uid: string, id: string, data: Partial<Contact>) {
  return updateDoc(doc(db, 'users', uid, COL, id), { ...data, updatedAt: Timestamp.now() })
}

export async function deleteContact(uid: string, id: string) {
  return deleteDoc(doc(db, 'users', uid, COL, id))
}

// Registre progressif : renvoie l'id du contact existant (comparaison insensible à la casse)
// ou en crée un nouveau à la volée si le nom n'est pas encore répertorié.
export async function ensureContact(uid: string, nom: string, existing: Contact[]): Promise<string> {
  const trimmed = nom.trim()
  const match = existing.find((c) => c.nom.trim().toLowerCase() === trimmed.toLowerCase())
  if (match) return match.id
  const ref = await addContact(uid, { nom: trimmed })
  return ref.id
}
