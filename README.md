# Mon Budget

Application PWA de gestion de budget pour adolescents, fonctionnant 100% hors-ligne.

## Architecture

- **Frontend** : SvelteKit 5 avec adapter-static
- **Stockage** : IndexedDB (local au navigateur)
- **Mode** : PWA offline-first avec Service Worker
- **Locale** : Français (fr-FR)

## Développement

### Prérequis

- Node.js 20+
- npm

### Installation

```bash
cd frontend
npm install
```

### Lancement

```bash
npm run dev
```

L'application sera accessible sur http://localhost:5173

### Build

```bash
npm run build
```

Les fichiers statiques seront générés dans `frontend/build/`

## Tests

### Tests E2E (Playwright)

```bash
# Tous les tests
npm run test:e2e

# Test spécifique
npx playwright test e2e/transactions.spec.ts

# Mode interactif
npm run test:e2e:ui

# Avec navigateur visible
npm run test:e2e:headed
```

## Déploiement

L'application est une PWA statique qui peut être déployée sur n'importe quel hébergement statique.

### GitHub Pages

1. Créer un repository GitHub
2. Activer GitHub Pages dans les settings (source: GitHub Actions)
3. Créer `.github/workflows/deploy.yml` :

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      - name: Build
        working-directory: ./frontend
        run: npm run build
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/build
```

## Installation PWA

### Sur mobile (Android/iOS)

1. Ouvrir l'application dans le navigateur
2. Android : Appuyer sur le menu ⋮ → "Installer l'application" ou "Ajouter à l'écran d'accueil"
3. iOS : Appuyer sur le bouton Partager → "Sur l'écran d'accueil"

### Sur desktop (Chrome/Edge)

1. Ouvrir l'application dans le navigateur
2. Cliquer sur l'icône d'installation dans la barre d'adresse
3. Ou Menu → "Installer Mon Budget"

## Données

Les données sont stockées localement dans IndexedDB :
- **Base** : `mon-budget`
- **Stores** : `transactions`, `budgets`, `goals`

⚠️ **Important** : Les données sont stockées dans le navigateur. Si le cache est vidé, les données seront perdues. Une fonctionnalité d'export/import est recommandée pour sauvegarder les données.

## Backend (optionnel)

Un backend Rust/Axum est disponible dans `/backend` pour référence. Il n'est pas utilisé dans la version PWA actuelle mais pourrait servir pour :
- Synchronisation multi-appareils
- Backup cloud
- Authentification multi-utilisateurs

Pour le lancer :

```bash
cd backend
cargo run
```

## Structure du projet

```
├── frontend/
│   ├── src/
│   │   ├── routes/          # Pages SvelteKit
│   │   ├── lib/
│   │   │   └── db.js        # Couche d'accès IndexedDB
│   │   ├── service-worker.js
│   │   └── app.css
│   ├── static/
│   │   ├── manifest.json    # Manifeste PWA
│   │   └── icons/
│   └── e2e/                 # Tests Playwright
├── backend/                 # Backend Rust (non utilisé)
└── transformations/         # Plans de transformation
```

## License

MIT
