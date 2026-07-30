import { initializeApp, getApps } from 'firebase/app'
import { initializeFirestore, getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const alreadyInitialized = getApps().length > 0
const app = alreadyInitialized ? getApps()[0] : initializeApp(firebaseConfig)

// ignoreUndefinedProperties : plusieurs formulaires écrivent des champs optionnels
// à `undefined` selon le contexte (ex. `son`/`categorie` d'une facture selon sa
// nature) — sans ce réglage, Firestore rejette l'écriture entière au lieu
// d'omettre simplement le champ. initializeFirestore() ne peut être appelé
// qu'une fois par instance d'app, d'où la réutilisation via getFirestore()
// si l'app existait déjà (hot-reload en dev).
export const db = alreadyInitialized
  ? getFirestore(app)
  : initializeFirestore(app, { ignoreUndefinedProperties: true })
export const auth = getAuth(app)
export const storage = getStorage(app)
export default app
