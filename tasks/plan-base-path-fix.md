# Transformation : Correction du Base Path pour GitHub Pages

## Contexte

L'application PWA "Mon Budget" a été développée et fonctionne parfaitement en local. Cependant, lors du déploiement sur GitHub Pages à l'URL `https://username.github.io/vibe-coding/`, les liens de navigation ne fonctionnent pas car ils ne prennent pas en compte le base path `/vibe-coding`.

### Problème Identifié

Les liens dans l'application utilisent des chemins absolus simples (`href="/"`, `href="/transactions"`) qui pointent vers la racine du domaine au lieu du sous-répertoire du repository :

- ❌ `href="/"` → `https://username.github.io/` (racine du domaine)
- ❌ `href="/transactions"` → `https://username.github.io/transactions`

Au lieu de :

- ✅ `href="{base}/"` → `https://username.github.io/vibe-coding/`
- ✅ `href="{base}/transactions"` → `https://username.github.io/vibe-coding/transactions`

### Audit Complet

**Production Code** :
- 5 liens de navigation à corriger
- 1 manifest PWA à rendre dynamique
- Configuration déjà en place dans `svelte.config.js`

**Tests E2E** :
- 100+ instances de `page.goto()` dans 8 fichiers de test
- Solution : configurer `baseURL` dans `playwright.config.ts`

---

## Objectifs de la Transformation

1. ✅ Corriger tous les liens de navigation pour supporter le base path
2. ✅ Rendre le manifest PWA compatible avec le base path
3. ✅ Mettre à jour les tests E2E pour supporter le base path
4. ✅ Garantir compatibilité dev (sans base path) et prod (avec base path)
5. ✅ Documenter les changements pour référence future

---

## Décisions Techniques

### Architecture Choisie

**Option retenue** : Utilisation du store `base` de SvelteKit

- Import de `{ base } from '$app/paths'` dans les composants
- Utilisation de `{base}` dans les attributs `href`
- En dev : `base = ""` (chaîne vide)
- En prod avec `BASE_PATH=/vibe-coding` : `base = "/vibe-coding"`

**Alternatives écartées** :
- Chemins relatifs (`href="transactions"`) : ne fonctionnent pas pour routes imbriquées
- Hardcoder `/vibe-coding` : pas flexible, ne fonctionne pas en dev

### Manifest PWA

**Option retenue** : Build script avec template

- Template avec placeholders `${BASE_PATH}`
- Script Node.js générant le manifest final lors du build
- Ajout de `prebuild` script dans `package.json`
- Fichier généré ignoré dans `.gitignore`

**Alternatives écartées** :
- Endpoint SvelteKit : ne fonctionne pas bien avec `adapter-static`
- Hardcoder les chemins : pas flexible

### Tests E2E

**Option retenue** : Configuration de `baseURL` avec `BASE_PATH`

- Modification de `playwright.config.ts`
- `baseURL: \`http://localhost:4173${BASE_PATH}\``
- Aucun changement nécessaire dans les fichiers de test individuels

---

## Plan d'Exécution

### Phase 1 : CRITIQUE - Navigation Links (5 min)

**Objectif** : Débloquer l'application immédiatement

**Impact** : App totalement cassée → App fonctionnelle

#### Fichiers Modifiés

##### 1.1 - `frontend/src/routes/+layout.svelte`

**Ligne 2** : Ajouter l'import
```svelte
import { base } from '$app/paths';
```

**Lignes 8-11** : Modifier les liens
```svelte
<a href="{base}/">Tableau de bord</a>
<a href="{base}/transactions">Transactions</a>
<a href="{base}/budget">Budget</a>
<a href="{base}/goals">Objectifs</a>
```

##### 1.2 - `frontend/src/routes/+page.svelte`

**Ligne 3** : Ajouter l'import (après `onMount`)
```svelte
import { base } from '$app/paths';
```

**Ligne 84** : Modifier le lien
```svelte
<a href="{base}/transactions">Voir tout</a>
```

#### Tests de Validation

```bash
# Test 1 : Dev sans base path
cd frontend
npm run dev
# Manuel : vérifier navigation sur http://localhost:5173

# Test 2 : Build avec base path
BASE_PATH=/vibe-coding npm run build
grep -o 'href="[^"]*"' build/index.html | grep -E "(transactions|budget|goals)" | head -5
# Attendu : /vibe-coding/transactions, /vibe-coding/budget, etc.

# Test 3 : Preview avec base path
BASE_PATH=/vibe-coding npm run preview
# Manuel : tester navigation sur http://localhost:4173/vibe-coding/
```

#### Commit

```bash
git add frontend/src/routes/+layout.svelte frontend/src/routes/+page.svelte
git commit -m "fix: add base path support to navigation links

- Import and use {base} from \$app/paths in +layout.svelte (4 links)
- Import and use {base} from \$app/paths in +page.svelte (1 link)
- All navigation links now respect BASE_PATH environment variable
- Works in dev (base='') and prod (base='/vibe-coding')

Fixes navigation on GitHub Pages deployment"
```

---

### Phase 2 : HAUTE - Manifest PWA (15 min)

**Objectif** : Rétablir l'installation PWA

**Impact** : PWA non installable → PWA installable avec chemins corrects

#### Fichiers Créés/Modifiés

##### 2.1 - Renommer `frontend/static/manifest.json` → `manifest.json.template`

```bash
cd frontend/static
mv manifest.json manifest.json.template
```

**Contenu de `manifest.json.template`** :
```json
{
  "name": "Mon Budget",
  "short_name": "Budget",
  "description": "Application de gestion de budget pour jeunes adultes",
  "start_url": "${BASE_PATH}/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "${BASE_PATH}/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "${BASE_PATH}/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

##### 2.2 - Créer `frontend/scripts/generate-manifest.js`

```bash
mkdir -p frontend/scripts
```

**Contenu** :
```javascript
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const basePath = process.env.BASE_PATH || '';
const templatePath = join(__dirname, '../static/manifest.json.template');
const outputPath = join(__dirname, '../static/manifest.json');

try {
  const template = readFileSync(templatePath, 'utf-8');
  const manifest = template.replace(/\$\{BASE_PATH\}/g, basePath);
  
  writeFileSync(outputPath, manifest);
  console.log(`✓ Generated manifest.json with BASE_PATH="${basePath}"`);
} catch (error) {
  console.error('✗ Failed to generate manifest.json:', error.message);
  process.exit(1);
}
```

##### 2.3 - Modifier `frontend/package.json`

**Ajouter dans `scripts`** :
```json
{
  "scripts": {
    "dev": "vite dev",
    "prebuild": "node scripts/generate-manifest.js",
    "build": "vite build",
    "preview": "vite preview",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

##### 2.4 - Créer/Modifier `frontend/.gitignore`

**Ajouter** :
```gitignore
# Build output
.DS_Store
node_modules
/.svelte-kit
/build
.env
.env.*
!.env.example
vite.config.js.timestamp-*
vite.config.ts.timestamp-*

# Generated files
static/manifest.json
```

#### Tests de Validation

```bash
cd frontend

# Test 1 : Script de génération
rm -f static/manifest.json
BASE_PATH=/vibe-coding node scripts/generate-manifest.js
# Attendu : ✓ Generated manifest.json with BASE_PATH="/vibe-coding"

# Test 2 : Contenu du manifest
cat static/manifest.json | grep -E '(start_url|src)'
# Attendu : chemins avec /vibe-coding

# Test 3 : Build complet avec prebuild
rm -f static/manifest.json
BASE_PATH=/vibe-coding npm run build
# Le prebuild doit générer manifest.json automatiquement
ls -la static/manifest.json
# Fichier doit exister

# Test 4 : PWA dans le navigateur
BASE_PATH=/vibe-coding npm run preview
# Manuel : DevTools → Application → Manifest
# Vérifier que tous les chemins incluent /vibe-coding
```

#### Commit

```bash
# Supprimer le manifest.json généré avant de commit
rm -f frontend/static/manifest.json

git add frontend/static/manifest.json.template \
        frontend/scripts/generate-manifest.js \
        frontend/package.json \
        frontend/.gitignore

git commit -m "feat: generate PWA manifest with dynamic base path

- Create manifest.json.template with \${BASE_PATH} placeholders
- Add scripts/generate-manifest.js to replace placeholders at build time
- Add prebuild script to package.json
- Ignore generated static/manifest.json in .gitignore
- Manifest now works with both dev (no base path) and prod (with base path)

Fixes PWA installation on GitHub Pages"
```

---

### Phase 3 : MOYENNE - Tests E2E (10 min)

**Objectif** : Valider le build de production avec les tests

**Impact** : Tests ne peuvent pas valider le build prod → Tests valident dev et prod

#### Fichiers Modifiés

##### 3.1 - Modifier `frontend/playwright.config.ts`

**Ajouter en haut du fichier** (après les imports) :
```typescript
const BASE_PATH = process.env.BASE_PATH || '';
```

**Modifier la section `use`** (environ ligne 15) :
```typescript
use: {
  baseURL: `http://localhost:4173${BASE_PATH}`,
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
},
```

**Fichier complet pour référence** :
```typescript
import { defineConfig, devices } from '@playwright/test';

const BASE_PATH = process.env.BASE_PATH || '';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:4173${BASE_PATH}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: `http://localhost:4173${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Tests de Validation

```bash
cd frontend

# Test 1 : E2E en dev (sans base path)
npm run build
npm run test:e2e
# Attendu : 70 tests passed

# Test 2 : E2E en prod (avec base path)
BASE_PATH=/vibe-coding npm run build
BASE_PATH=/vibe-coding npm run preview &
PREVIEW_PID=$!
sleep 3
BASE_PATH=/vibe-coding npm run test:e2e
kill $PREVIEW_PID
# Attendu : 70 tests passed

# Note : Les tests individuels n'ont pas besoin d'être modifiés
# car ils utilisent des chemins relatifs qui sont résolus via baseURL
```

#### Commit

```bash
git add frontend/playwright.config.ts
git commit -m "test: add base path support to e2e tests

- Configure baseURL with BASE_PATH environment variable
- Tests now work with both dev (no base path) and prod (with base path)
- No changes needed in individual test files
- Enables validation of production builds locally

All 70 E2E tests pass with and without BASE_PATH"
```

---

### Phase 4 : BASSE - Documentation (10 min)

**Objectif** : Documenter les changements pour référence future

#### Fichiers Modifiés

##### 4.1 - Mettre à jour `README.md`

**Ajouter dans la section "Développement"** (après "### Build") :

```markdown
### Build avec base path

Pour GitHub Pages et autres déploiements avec sous-répertoire :

\`\`\`bash
# Build avec base path
BASE_PATH=/vibe-coding npm run build

# Preview avec base path
BASE_PATH=/vibe-coding npm run preview
# Ouvrir http://localhost:4173/vibe-coding/

# Tests E2E avec base path
BASE_PATH=/vibe-coding npm run test:e2e
\`\`\`

Le base path est automatiquement géré :
- **Dev** (\`npm run dev\`) : pas de base path
- **Prod** avec \`BASE_PATH\` : liens et manifest incluent le base path
- **Manifest PWA** : généré automatiquement lors du build via \`prebuild\` script
```

##### 4.2 - Mettre à jour `DEPLOY.md`

**Ajouter une section "Architecture Base Path"** (après l'intro) :

```markdown
## Architecture Base Path

L'application supporte les déploiements avec base path (sous-répertoires) grâce à :

### 1. Configuration SvelteKit

\`svelte.config.js\` configure le base path :
\`\`\`javascript
paths: {
  base: dev ? '' : process.env.BASE_PATH || ''
}
\`\`\`

### 2. Navigation avec \`{base}\`

Tous les liens utilisent \`{base}\` de \`$app/paths\` :
\`\`\`svelte
<script>
  import { base } from '$app/paths';
</script>

<a href="{base}/">Accueil</a>
<a href="{base}/transactions">Transactions</a>
\`\`\`

### 3. Manifest PWA Dynamique

Le manifest PWA est généré lors du build :
- **Template** : \`static/manifest.json.template\` (commité)
- **Script** : \`scripts/generate-manifest.js\` (exécuté dans \`prebuild\`)
- **Généré** : \`static/manifest.json\` (ignoré par git)

Le workflow GitHub Actions passe automatiquement \`BASE_PATH=/${{ github.event.repository.name }}\`.

### 4. Tests E2E

Les tests supportent le base path via \`playwright.config.ts\` :
\`\`\`typescript
const BASE_PATH = process.env.BASE_PATH || '';
use: {
  baseURL: \`http://localhost:4173${BASE_PATH}\`
}
\`\`\`
```

**Modifier la section "Repository personnel"** pour clarifier :

```markdown
### Repository personnel (username.github.io)

Si votre repo s'appelle \`username.github.io\`, l'URL sera \`https://username.github.io/\` sans base path.

Pour supprimer le base path, modifiez \`.github/workflows/deploy.yml\` :

\`\`\`yaml
- name: Build
  working-directory: ./frontend
  # Commenter la variable d'environnement BASE_PATH :
  # env:
  #   BASE_PATH: /${{ github.event.repository.name }}
  run: npm run build
\`\`\`

**Note** : Le code supporte automatiquement l'absence de base path (valeur par défaut).
```

#### Commit

```bash
git add README.md DEPLOY.md
git commit -m "docs: update deployment documentation for base path

- Add base path build instructions to README.md
- Document base path architecture in DEPLOY.md
- Explain manifest generation process
- Clarify configuration for repositories without base path

Documentation now complete for GitHub Pages deployment"
```

---

## Validation Finale

### Checklist Avant Push GitHub

- [ ] Phase 1 : Navigation fonctionne en dev et prod
- [ ] Phase 2 : Manifest généré avec bons chemins
- [ ] Phase 3 : Tests E2E passent avec et sans base path
- [ ] Phase 4 : Documentation complète et à jour
- [ ] `frontend/static/manifest.json` dans `.gitignore`
- [ ] `frontend/static/manifest.json` n'est PAS commité
- [ ] `frontend/static/manifest.json.template` EST commité
- [ ] Build final réussit : `BASE_PATH=/vibe-coding npm run build`
- [ ] Preview final fonctionne : navigation complète sur `http://localhost:4173/vibe-coding/`

### Tests Locaux Complets

```bash
cd frontend

# 1. Clean build
rm -rf node_modules .svelte-kit build static/manifest.json
npm install

# 2. Dev mode (sans base path)
npm run dev &
DEV_PID=$!
sleep 3
curl http://localhost:5173/ | grep -o 'href="[^"]*"' | head -5
# Attendu : href="/", href="/transactions", etc. (sans base path)
kill $DEV_PID

# 3. Build prod (avec base path)
BASE_PATH=/vibe-coding npm run build
# Vérifier manifest généré
test -f static/manifest.json && echo "✓ Manifest generated" || echo "✗ Manifest missing"
cat static/manifest.json | grep start_url
# Attendu : "start_url": "/vibe-coding/",

# Vérifier liens dans HTML
grep -o 'href="[^"]*"' build/index.html | grep transactions
# Attendu : href="/vibe-coding/transactions"

# 4. Preview prod
BASE_PATH=/vibe-coding npm run preview &
PREVIEW_PID=$!
sleep 3
curl http://localhost:4173/vibe-coding/ | grep -o 'href="[^"]*"' | head -5
# Attendu : href="/vibe-coding/", href="/vibe-coding/transactions", etc.

# 5. Tests E2E
BASE_PATH=/vibe-coding npm run test:e2e
# Attendu : 70 tests passed

kill $PREVIEW_PID

echo "✓ All local validation tests passed!"
```

### Checklist Après Déploiement GitHub

- [ ] Workflow "Deploy to GitHub Pages" réussit (Actions tab)
- [ ] Page accessible sur `https://VOTRE-USERNAME.github.io/vibe-coding/`
- [ ] Navigation : tous les liens de navbar fonctionnent
- [ ] Navigation : lien "Voir tout" sur dashboard fonctionne
- [ ] Assets se chargent (CSS, JS, images, icônes)
- [ ] Console DevTools sans erreurs 404
- [ ] PWA : icône d'installation visible dans barre d'adresse
- [ ] PWA : installation fonctionne
- [ ] PWA : manifest visible dans DevTools → Application
- [ ] PWA : Service Worker actif dans DevTools → Application
- [ ] PWA : l'app fonctionne hors-ligne après installation

---

## Résumé des Changements

### Fichiers Modifiés (9 fichiers)

| Fichier | Action | Lignes modifiées |
|---------|--------|------------------|
| `frontend/src/routes/+layout.svelte` | Modifier | +1 import, 4 liens |
| `frontend/src/routes/+page.svelte` | Modifier | +1 import, 1 lien |
| `frontend/static/manifest.json` | Renommer → `.template` | Remplacer chemins par `${BASE_PATH}` |
| `frontend/scripts/generate-manifest.js` | Créer | Nouveau fichier (20 lignes) |
| `frontend/package.json` | Modifier | +1 ligne (prebuild script) |
| `frontend/.gitignore` | Créer/Modifier | +3 lignes |
| `frontend/playwright.config.ts` | Modifier | +2 lignes |
| `README.md` | Modifier | +section |
| `DEPLOY.md` | Modifier | +section |

### Commits (4 commits)

1. `fix: add base path support to navigation links`
2. `feat: generate PWA manifest with dynamic base path`
3. `test: add base path support to e2e tests`
4. `docs: update deployment documentation for base path`

### Impact sur le Code

- **Production** : 5 liens + 1 manifest = 6 éléments corrigés
- **Tests** : 1 fichier config modifié (pas de changement dans les 70 tests)
- **Build** : 1 script ajouté (exécution automatique via prebuild)
- **Documentation** : 2 fichiers mis à jour

---

## Points Techniques Importants

### Pourquoi `{base}` et pas d'autres solutions ?

1. **`{base}` de SvelteKit** : Solution officielle, automatiquement gérée
2. **Pas de chemins relatifs** : `href="transactions"` ne fonctionne pas pour routes imbriquées
3. **Pas de hardcoding** : `/vibe-coding` ne fonctionnerait pas en dev

### Pourquoi un build script pour le manifest ?

1. **JSON statique** : Pas de template literals dans JSON
2. **PWA requirement** : Le manifest doit être un vrai fichier JSON, pas un endpoint
3. **Adapter-static** : Les endpoints SvelteKit ne sont pas pré-rendus
4. **Solution simple** : Un script Node.js de 20 lignes résout le problème

### Pourquoi ne pas commiter manifest.json ?

1. **Fichier généré** : Comme `build/`, ne devrait pas être versionné
2. **Source de vérité** : Le template (`.template`) est la source
3. **Évite les conflits** : Différents devs avec différents `BASE_PATH`
4. **CI/CD** : Le workflow GitHub génère son propre manifest avec le bon base path

---

## Dépannage

### Problème : Les liens ne fonctionnent toujours pas

**Cause possible** : `{base}` n'est pas importé

**Solution** :
```svelte
<script>
  import { base } from '$app/paths';  // Vérifier cette ligne
</script>
```

### Problème : Manifest non généré

**Cause possible** : Le script prebuild ne s'exécute pas

**Solution** :
```bash
# Vérifier package.json
cat frontend/package.json | grep prebuild
# Doit afficher : "prebuild": "node scripts/generate-manifest.js"

# Tester le script manuellement
BASE_PATH=/vibe-coding node frontend/scripts/generate-manifest.js
```

### Problème : Tests E2E échouent avec BASE_PATH

**Cause possible** : `baseURL` pas correctement configuré

**Solution** :
```typescript
// Vérifier playwright.config.ts
const BASE_PATH = process.env.BASE_PATH || '';
use: {
  baseURL: `http://localhost:4173${BASE_PATH}`,  // Template literal
}
```

### Problème : 404 sur GitHub Pages

**Cause possible** : Workflow ne passe pas `BASE_PATH`

**Solution** :
```yaml
# Vérifier .github/workflows/deploy.yml
- name: Build
  working-directory: ./frontend
  env:
    BASE_PATH: /${{ github.event.repository.name }}  # Cette ligne est critique
  run: npm run build
```

---

## Références

- [SvelteKit Documentation - Path](https://kit.svelte.dev/docs/modules#$app-paths)
- [SvelteKit Configuration - paths.base](https://kit.svelte.dev/docs/configuration#paths)
- [PWA Manifest Specification](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Playwright Configuration](https://playwright.dev/docs/test-configuration)

---

## Statut

| Phase | Description | Statut | Commit |
|-------|-------------|--------|--------|
| 1 | Navigation Links | ⏳ À faire | - |
| 2 | Manifest PWA | ⏳ À faire | - |
| 3 | Tests E2E | ⏳ À faire | - |
| 4 | Documentation | ⏳ À faire | - |

**Date de création** : 10 février 2025  
**Repository** : `vibe-coding`  
**Base Path** : `/vibe-coding`  
**Statut global** : 🟡 En cours
