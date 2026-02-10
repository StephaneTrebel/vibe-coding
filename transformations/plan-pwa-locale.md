# Transformation : PWA Locale (Offline-First)

## Contexte

L'application actuelle fonctionne en mode client/serveur (SvelteKit + Rust/Axum + PostgreSQL). Cette transformation vise à convertir l'application en PWA autonome fonctionnant entièrement en local sur le smartphone, sans backend.

---

## Comparaison des architectures

| Critère | Client/Serveur (actuel) | PWA Locale (cible) |
|---------|------------------------|---------------------------|
| **Hébergement** | VPS requis (~5-15€/mois) | Hébergement statique gratuit (GitHub Pages, Netlify) |
| **Maintenance** | Serveur, SSL, backups, DB | Quasi nulle |
| **Disponibilité** | Dépend du serveur et de la connexion | 100% hors-ligne après installation |
| **Données** | PostgreSQL centralisé | IndexedDB local au navigateur |
| **Perte de données** | Backup serveur possible | Perte si cache navigateur vidé ou données effacées |
| **Sync multi-appareils** | Native (même compte) | Pas de sync (ou export/import manuel JSON) |
| **Confidentialité** | Données sur serveur | Données jamais transmises |
| **Sécurité** | Surface d'attaque serveur | Aucune exposition réseau |
| **Distribution** | URL web | Même URL, "Ajouter à l'écran d'accueil" |
| **Authentification** | JWT, comptes utilisateurs | Inutile (données locales = privées par défaut) |

---

## Impact sur le code

### Composants conservés

| Composant | Modifications |
|-----------|---------------|
| Frontend SvelteKit | Adapté pour mode statique |
| Structure des routes | Conservée |
| CSS / UI | Conservé intégralement |
| Composants Svelte | Conservés, logique API remplacée |

### Composants supprimés

| Composant | Raison |
|-----------|--------|
| `backend/` (Rust/Axum) | Plus de serveur |
| `docker-compose.yml` | Plus besoin d'orchestration |
| `backend/Dockerfile` | Plus de backend |
| PostgreSQL | Remplacé par IndexedDB |
| `frontend/src/lib/stores/auth.js` | Plus d'authentification |
| Pages `/login` et `/register` | Plus d'authentification |

### Composants à créer/réécrire

| Composant | Description |
|-----------|-------------|
| `frontend/src/lib/db.js` | Couche d'accès IndexedDB (remplace `api.js`) |
| `frontend/src/service-worker.js` | Cache offline et stratégie de mise à jour |
| `frontend/static/manifest.json` | Manifeste PWA (icônes, nom, thème) |
| `frontend/static/icons/` | Icônes PWA (192x192, 512x512) |

---

## Schéma IndexedDB

```javascript
// Base de données : "mon-budget"
// Version : 1

// Object Stores :

transactions: {
  keyPath: "id",
  autoIncrement: true,
  indexes: [
    { name: "date", keyPath: "date" },
    { name: "type", keyPath: "type" },
    { name: "category", keyPath: "category" }
  ]
}
// Structure : { id, type, amount, category, description, date, createdAt }

budgets: {
  keyPath: "month"  // Format: "YYYY-MM"
}
// Structure : { month, amount }

goals: {
  keyPath: "id",
  autoIncrement: true
}
// Structure : { id, name, targetAmount, currentAmount, achieved, createdAt }
```

---

## Architecture cible

```
┌─────────────────────────────────────────────────────────┐
│                      Navigateur                          │
│  ┌─────────────────────┐    ┌─────────────────────────┐ │
│  │   SvelteKit SSG     │    │   Service Worker        │ │
│  │   (pages statiques) │◄──▶│   (cache offline)       │ │
│  └─────────┬───────────┘    └─────────────────────────┘ │
│            │                                             │
│            ▼                                             │
│  ┌─────────────────────────────────────────────────────┐│
│  │                    IndexedDB                         ││
│  │  ┌─────────────┐ ┌──────────┐ ┌──────────────────┐  ││
│  │  │transactions │ │ budgets  │ │      goals       │  ││
│  │  └─────────────┘ └──────────┘ └──────────────────┘  ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Structure projet cible

```
teen-budget-app/
├── frontend/
│   ├── package.json
│   ├── svelte.config.js        # Adapter static
│   ├── vite.config.js
│   ├── static/
│   │   ├── manifest.json
│   │   ├── favicon.png
│   │   └── icons/
│   │       ├── icon-192.png
│   │       └── icon-512.png
│   └── src/
│       ├── service-worker.js
│       ├── routes/
│       │   ├── +page.svelte        # Dashboard
│       │   ├── +layout.svelte      # App shell (sans auth)
│       │   ├── transactions/
│       │   ├── budget/
│       │   └── goals/
│       ├── lib/
│       │   ├── db.js               # IndexedDB (remplace api.js)
│       │   └── components/
│       └── app.css
└── transformations/
    ├── plan-initial.md
    └── plan-pwa-locale.md
```

---

## Phases de transformation (découpage détaillé)

### Phase 1 : Préparation

| Sous-phase | Description | Statut |
|------------|-------------|--------|
| 1.1 | Adapter-static : installer et configurer `@sveltejs/adapter-static` | Fait |
| 1.2 | Manifeste PWA : créer `static/manifest.json` et lien dans `app.html` | Fait |
| 1.3 | Icones PWA : créer `static/icons/icon-192.png` et `icon-512.png` | Fait |
| 1.4 | Meta tags PWA : ajouter theme-color, apple-touch-icon dans `app.html` | Fait |

---

### Phase 2 : IndexedDB

**Partie A : Création de db.js**

| Sous-phase | Description | Statut |
|------------|-------------|--------|
| 2.1 | Squelette IndexedDB : créer `db.js` avec initialisation et schéma (3 stores) | Fait |
| 2.2 | CRUD Transactions : `getTransactions`, `createTransaction`, `updateTransaction`, `deleteTransaction` | Fait |
| 2.3 | CRUD Budgets : `getBudget`, `setBudget` | Fait |
| 2.4 | CRUD Goals : `getGoals`, `createGoal`, `updateGoal`, `deleteGoal` | Fait |
| 2.5 | Dashboard : `getDashboard` (calcul local à partir des transactions) | Fait |

**Partie B : Migration des pages**

| Sous-phase | Description | Statut |
|------------|-------------|--------|
| 2.6 | Migrer `/transactions` : remplacer `api.*` par `db.*` | Fait |
| 2.7 | Migrer `/budget` : remplacer `api.*` par `db.*` | Fait |
| 2.8 | Migrer `/goals` : remplacer `api.*` par `db.*` | Fait |
| 2.9 | Migrer `/` (Dashboard) : remplacer `api.*` par `db.*` | Fait |

---

### Phase 3 : Nettoyage authentification

| Sous-phase | Description | Statut |
|------------|-------------|--------|
| 3.1 | Supprimer `auth.js` et les pages `/login` et `/register` | Fait |
| 3.2 | Simplifier `+layout.svelte` (toujours afficher la navbar) | Fait |
| 3.3 | Supprimer les guards d'authentification des pages | Fait |
| 3.4 | Supprimer les fonctions auth de `api.js` (ou supprimer `api.js` entièrement) | Fait |

---

### Phase 4 : Service Worker

| Sous-phase | Description | Statut |
|------------|-------------|--------|
| 4.1 | Créer `src/service-worker.js` avec stratégie cache-first | Fait |
| 4.2 | Enregistrer le Service Worker dans l'app | Fait |
| 4.3 | Configurer la stratégie de mise à jour (stale-while-revalidate) | Fait |

---

### Phase 5 : Finalisation

| Sous-phase | Description | Statut |
|------------|-------------|--------|
| 5.1 | Supprimer le dossier `backend/` | Annulé (conservé pour référence) |
| 5.2 | Supprimer `docker-compose.yml` | Fait |
| 5.3 | Nettoyer les dépendances inutiles dans `package.json` | Fait |
| 5.4 | Tester l'installation PWA sur mobile | À tester manuellement |
| 5.5 | Documenter le déploiement statique | Fait |

---

## Risques identifiés

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Perte de données si cache vidé | Élevé | Implémenter export/import JSON |
| IndexedDB non disponible (navigation privée) | Moyen | Afficher message d'avertissement |
| Pas de sync multi-appareils | Moyen | Accepté (hors scope) |
| Quota IndexedDB dépassé | Faible | Peu probable pour cette volumétrie |

---

## Décision

- [ ] Approuvé - Lancer la transformation
- [ ] Refusé - Conserver l'architecture client/serveur
- [ ] En attente - Questions à clarifier
