# Compta Musique

Application de comptabilité musicale — Next.js 14, Firebase, Vercel, PWA.

## Stack

- **Framework** : Next.js 14 (App Router + TypeScript)
- **Styles** : Tailwind CSS
- **Base de données** : Firebase Firestore (temps réel)
- **Auth** : Firebase Authentication (Google)
- **Hébergement** : Vercel
- **PWA** : next-pwa (installable iOS/Android/Desktop)

## Démarrage

```bash
npm install
cp .env.local.example .env.local
# Renseigner les clés Firebase dans .env.local
npm run dev
```

## Structure

```
app/          → Pages Next.js (App Router)
components/   → Composants React (layout + modules)
hooks/        → Hooks Firebase custom
lib/          → Firebase init + helpers Firestore + types
styles/       → CSS global + Tailwind
public/       → Manifest PWA + icônes
```

## Firestore

Structure des collections : `/users/{uid}/artistes`, `/users/{uid}/revenus`, `/users/{uid}/depenses`, `/users/{uid}/concerts`

## Variables d'environnement

Copier `.env.local.example` → `.env.local` et renseigner les clés Firebase.
Ajouter les mêmes variables dans Vercel → Settings → Environment Variables.
