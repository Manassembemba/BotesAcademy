# Résumé Global du Projet : Botes Academy

Ce document décrit l'architecture et le fonctionnement de l'application web Botes Academy à date.

## 1. Architecture & Technologies

L'application est une "Single Page Application" (SPA) moderne construite sur un ensemble de technologies robustes et performantes.

- **Framework Frontend** : **React** avec **Vite** comme outil de build, offrant un développement rapide et des performances optimisées.
- **Langage** : **TypeScript** pour la sécurité des types et une meilleure maintenabilité du code.
- **Style & UI** : L'interface est gérée par **Tailwind CSS** (utility-first) et enrichie par **shadcn-ui**, qui fournit une collection de composants accessibles et personnalisables (boutons, cartes, etc.) basés sur Radix UI.
- **Routage** : La navigation entre les pages est gérée par **`react-router-dom`**.
- **Gestion de l'état** :
  - **État du serveur** : **TanStack React Query** est utilisé pour toutes les interactions avec la base de données (fetching, caching, mutations). Cela simplifie la gestion des états de chargement, d'erreur et la mise à jour de l'UI.
  - **État d'authentification** : Un Contexte React (`AuthContext`) centralise les informations de l'utilisateur connecté sur l'ensemble de l'application.
- **Backend & Base de Données** : Le projet utilise **Supabase** comme solution "Backend-as-a-Service", qui fournit :
  - Une base de données **PostgreSQL**.
  - Un service d'**Authentification** complet.
  - La possibilité de créer des **fonctions de base de données** personnalisées (`plpgsql`).

## 2. Structure de la Base de Données (Supabase)

La structure des données est organisée en plusieurs tables clés, sécurisées par des politiques de **Row Level Security (RLS)** qui garantissent que les utilisateurs ne peuvent accéder qu'aux données qui leur sont autorisées.

- `profiles` : Contient les informations publiques des utilisateurs (nom, etc.), liées à la table `auth.users`.
- `user_roles` : Associe des rôles (ex: 'admin', 'student') aux utilisateurs.
- `courses` & `lessons` : Définissent les formations et leurs leçons respectives.
- `purchases` : Table de liaison qui enregistre l'inscription d'un `user_id` à un `course_id`.
- `indicators` & `indicator_purchases` : Gèrent les outils techniques du Marketplace.
- `course_vacations` : Définit les créneaux horaires (Matin, Midi, Soir) par formation.
- `attendance` : Enregistre le pointage quotidien des élèves (Présent, Absent, Retard).
- `payment_proofs` : Centralise les reçus de paiement et sert de base à la comptabilité.

Un trigger `handle_new_user` est en place pour créer automatiquement un profil et assigner le rôle 'student' à chaque nouvel inscrit.

## 3. Fonctionnalités Clés et Flux de Données

### Authentification & Création de Compte
- Un utilisateur peut s'inscrire lui-même ou être créé manuellement par un administrateur.
- **Nouveauté :** Le module Admin permet de créer un compte Auth Supabase avec mot de passe généré et d'envoyer automatiquement les identifiants par email via Resend.

### Inscription aux Cours & Vacations
1.  Sur la page `/formations`, l'utilisateur sélectionne son cours.
2.  Pour le présentiel, il choisit une **Vacation** spécifique (créneau horaire).
3.  Le paiement s'effectue par upload de reçu (processus manuel) ou par inscription directe côté Admin.
4.  L'inscription débloque l'accès au contenu et aux leçons.

### Marketplace "Gold"
1.  La page `/marketplace` a été refondue avec un design "Premium" (glassmorphism).
2.  Elle propose des stratégies et indicateurs professionnels.
3.  L'accès est instantané après validation du paiement par l'administration.

### Suivi de la Progression & Certification
1.  Le système de `lesson_completions` suit la progression réelle.
2.  **Célébration :** À 100% de complétion, un effet de confettis se déclenche.
3.  **Certification :** Un certificat de réussite officiel (PDF) est généré dynamiquement avec le nom de l'élève et le sceau de l'académie.

### Gestion Administrative (ERP)
- **Tableau de Bord :** Statistiques en temps réel sur les inscrits et les revenus.
- **Comptabilité :** Suivi détaillé des entrées d'argent avec filtres temporels (Aujourd'hui, Hier, Mois, etc.).
- **Émargement :** Module de pointage quotidien pour le réceptionniste (gestion des présences physiques).

## 4. Structure du Code Frontend

Le code source est organisé de manière logique :

- `src/pages/` : Chaque fichier correspond à une page (une route) de l'application.
- `src/components/` : Contient les composants réutilisables (`Navbar`, `CourseCard`, `ProductCard`, etc.).
  - `src/components/ui/` : Contient les composants de base fournis par `shadcn-ui`.
- `src/contexts/` : Contient les fournisseurs de contexte, comme `AuthContext`.
- `src/integrations/supabase/` : Centralise la configuration du client Supabase.
- `supabase/migrations/` : Contient l'historique de toutes les modifications de la base de données (création de tables, de fonctions, etc.), ce qui garantit la cohérence et le versionnage de la BDD.
