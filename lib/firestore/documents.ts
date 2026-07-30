import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, Timestamp,
  type Unsubscribe
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import type { DocumentFichier } from '@/lib/types'

const COL = 'documents'

export function subscribeDocuments(uid: string, cb: (documents: DocumentFichier[]) => void, onError?: (e: Error) => void): Unsubscribe {
  const q = query(collection(db, 'users', uid, COL), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DocumentFichier)))
  }, (err) => onError?.(err))
}

export async function uploadDocumentFile(uid: string, file: File | Blob, fileName: string) {
  const storagePath = `users/${uid}/documents/${Date.now()}-${fileName}`
  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, file)
  const fileUrl = await getDownloadURL(storageRef)
  return { fileUrl, storagePath }
}

export async function addDocument(uid: string, data: Omit<DocumentFichier, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'users', uid, COL), {
    ...data,
    createdAt: Timestamp.now(),
  })
}

export async function updateDocument(uid: string, id: string, data: Partial<DocumentFichier>) {
  return updateDoc(doc(db, 'users', uid, COL, id), data)
}

export async function deleteDocument(uid: string, id: string, storagePath?: string) {
  if (storagePath) {
    try { await deleteObject(ref(storage, storagePath)) } catch { /* fichier déjà absent */ }
  }
  return deleteDoc(doc(db, 'users', uid, COL, id))
}
