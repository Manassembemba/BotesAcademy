# Botes Academy

Plateforme de gestion de formation et marketplace de trading d'élite.

## Technologies

Ce projet est construit avec :

- **Vite**
- **TypeScript**
- **React**
- **shadcn-ui**
- **Tailwind CSS**
- **Supabase** (Backend-as-a-Service)

## Développement Local

### Prérequis

- Node.js & npm (ou Bun) installés.

### Installation

```sh
# Installer les dépendances
npm install
# ou
bun install
```

### Lancement

```sh
# Lancer le serveur de développement
npm run dev
# ou
bun run dev
```

## Structure du Projet

- `src/components/` : Composants UI réutilisables.
- `src/pages/` : Pages de l'application (Routes).
- `src/contexts/` : Contextes React (Authentification, Paramètres du site).
- `src/integrations/supabase/` : Configuration du client Supabase.
- `supabase/migrations/` : Schéma de la base de données et politiques RLS.

## Déploiement

Le projet est optimisé pour être déployé sur Vercel ou Netlify. Assurez-vous de configurer les variables d'environnement Supabase.
