# Dashboard — Beatmaker

Dashboard de comptabilité pour activité de beatmaker : suivi des cachets/placements,
revenus & dépenses divers, documents, fiscalité URSSAF, statistiques et facturation.

## Stack

- **Framework** : Next.js 14 (App Router + TypeScript)
- **Styles** : Tailwind CSS
- **Base de données** : Firebase Firestore (temps réel) + Firebase Storage (fichiers)
- **Auth** : Firebase Authentication (email/mot de passe)
- **PDF** : @react-pdf/renderer (génération de factures)
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
lib/          → Firebase init + helpers Firestore + calculs + génération PDF
styles/       → CSS global + Tailwind
public/       → Manifest PWA + icônes
```

## Modules

- **Cachets** (`/cachets`) — chaque prod placée : date de sortie, artiste, son, cachet
  brut, co-auteurs nommés (coprod), ma part calculée automatiquement (`brut / nb auteurs`,
  ou valeur manuelle), statut de paiement et mois d'encaissement.
- **Revenus & dépenses** (`/operations`) — avances, achats de matériel, sync, etc.
  hors cachets.
- **Documents** (`/documents`) — factures, contrats, bons de commande, uploadés dans
  Firebase Storage et rattachés à un cachet ou une opération.
- **Fiscalité** (`/fiscalite`) — cotisations URSSAF dues par mois, calculées sur les
  encaissements réels (régime micro-entrepreneur, CFP, versement libératoire, ACRE).
- **Statistiques** (`/statistiques`) — performance par artiste, taux de partage,
  taux d'encaissement, encaissements mensuels.
- **Contacts** (`/contacts`) — répertoire (artistes, labels, clients) utilisé par
  l'outil de facturation. S'enrichit automatiquement : tout nom saisi dans un cachet
  ou une facture qui n'existe pas encore y crée sa fiche.
- **Factures** (`/factures`) — création de factures à partir d'un contact du
  répertoire (ou d'un nouveau nom, ajouté à la volée), génération PDF, numérotation
  automatique. La création d'une facture crée automatiquement le cachet (ou
  l'opération) correspondant dans le suivi, et le document PDF est rattaché
  automatiquement — tout reste synchronisé (solde, fiscalité, statistiques).

## Firestore

Structure des collections : `/users/{uid}/cachets`, `/users/{uid}/operations`,
`/users/{uid}/documents`, `/users/{uid}/contacts`, `/users/{uid}/factures`,
`/users/{uid}/meta/fisca`, `/users/{uid}/meta/profil`.

Règles de sécurité : `firestore.rules` (Firestore) et `storage.rules` (Storage) —
chaque utilisateur ne peut lire/écrire que ses propres données.

## Variables d'environnement

Copier `.env.local.example` → `.env.local` et renseigner les clés Firebase (Auth,
Firestore et Storage doivent être activés dans la console Firebase — Authentication
avec le fournisseur Email/Password activé).
Ajouter les mêmes variables dans Vercel → Settings → Environment Variables.
