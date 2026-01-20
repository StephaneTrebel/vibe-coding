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

## Phases de transformation

### Phase 1 : Préparation
1. Configurer SvelteKit pour génération statique (`@sveltejs/adapter-static`)
2. Supprimer les dépendances backend inutiles
3. Créer le manifeste PWA et les icônes

### Phase 2 : IndexedDB
1. Créer `db.js` avec les opérations CRUD
2. Initialiser le schéma IndexedDB au premier lancement
3. Migrer les appels `api.*` vers `db.*` dans chaque page

### Phase 3 : Nettoyage authentification
1. Supprimer `auth.js` et les pages login/register
2. Simplifier `+layout.svelte` (toujours afficher la navbar)
3. Supprimer les guards d'authentification des pages

### Phase 4 : Service Worker
1. Implémenter le Service Worker pour le cache offline
2. Configurer la stratégie de mise à jour (stale-while-revalidate)
3. Enregistrer le Service Worker dans l'app

### Phase 5 : Finalisation
1. Supprimer le dossier `backend/`
2. Supprimer `docker-compose.yml`
3. Tester l'installation PWA sur mobile
4. Documenter le déploiement statique

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
