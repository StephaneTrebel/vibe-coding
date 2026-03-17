# Transformation : Fix 404 sur Rafraîchissement GitHub Pages

## Contexte

**Problème** : Quand on visite directement une route (ex: `/vibe-coding/budget`) ou qu'on rafraîchit la page, GitHub Pages renvoie une **404 Not Found**.

**Cause** : GitHub Pages cherche un fichier physique à ce chemin. Comme c'est une SPA (Single Page Application) avec routing client-side, le fichier n'existe pas.

**Capture du problème** : Rafraîchir `/vibe-coding/budget` → 404

---

## Objectif

Permettre les visites directes et rafraîchissements sur toutes les routes de l'application SPA en configurant GitHub Pages pour servir `index.html` comme fallback.

---

## Solution Implémentée : Option 2

### Approche

1. **`.nojekyll`** : Désactive le processing Jekyll de GitHub Pages
   - Permet de servir les dossiers commençant par `_` (comme `_app/`)
   - Fichier vide dans `frontend/static/.nojekyll`

2. **`404.html`** : Fallback automatique pour routes non trouvées
   - GitHub Pages sert automatiquement `404.html` pour toute route inexistante
   - Copie de `index.html` pour permettre le routing SPA côté client

### Workflow

```
User visite /vibe-coding/budget
  ↓
GitHub Pages cherche /vibe-coding/budget/index.html
  ↓
Pas trouvé → sert 404.html (= copie de index.html)
  ↓
SvelteKit charge et route vers /budget
  ↓
✅ Page Budget s'affiche correctement
```

---

## Implémentation

### 1. Fichier `.nojekyll`

**Fichier** : `frontend/static/.nojekyll`  
**Contenu** : Fichier vide (0 bytes)  
**Effet** : Copié automatiquement vers `build/.nojekyll` par SvelteKit

### 2. Script de Copie 404

**Fichier** : `frontend/scripts/copy-404.js`

```javascript
import { copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildDir = join(__dirname, '../build');
const indexPath = join(buildDir, 'index.html');
const notFoundPath = join(buildDir, '404.html');

try {
	copyFileSync(indexPath, notFoundPath);
	console.log('✓ Copied index.html to 404.html for GitHub Pages SPA routing');
} catch (error) {
	console.error('✗ Failed to copy 404.html:', error.message);
	process.exit(1);
}
```

### 3. Hook `postbuild` dans `package.json`

**Fichier** : `frontend/package.json`

```json
{
  "scripts": {
    "prebuild": "node scripts/generate-manifest.js",
    "build": "vite build",
    "postbuild": "node scripts/copy-404.js"
  }
}
```

**Séquence d'exécution** :
1. `prebuild` → Génère `manifest.json` avec `BASE_PATH`
2. `build` → Compile SvelteKit → `/build`
3. `postbuild` → Copie `index.html` → `404.html`

---

## Résultat

### Avant

```
Visite /vibe-coding/budget directement
  → GitHub Pages cherche budget/index.html
  → ❌ 404 Not Found
```

### Après

```
Visite /vibe-coding/budget directement
  → GitHub Pages cherche budget/index.html
  → Pas trouvé → sert 404.html (= index.html)
  → SvelteKit charge et route vers /budget
  → ✅ Page Budget affichée
```

### Fichiers Générés dans `/build`

```
frontend/build/
  ├── index.html        # Route principale
  ├── 404.html          # ← Copie de index.html pour fallback
  ├── .nojekyll         # ← Désactive Jekyll
  ├── _app/             # ← Servi correctement grâce à .nojekyll
  ├── service-worker.js
  └── ...
```

---

## Tests

### Build Local

```bash
cd frontend
npm run build

# Vérifier les fichiers créés
ls -la build/.nojekyll    # Doit exister (0 bytes)
ls -la build/404.html     # Doit exister et être identique à index.html
diff build/index.html build/404.html  # Pas de différence

# Tester
npm run preview
# Visiter http://localhost:4173/budget
# Rafraîchir → devrait fonctionner ✅
```

### Production (GitHub Pages)

```bash
# Après push et déploiement
# Visiter https://stephanetrebel.github.io/vibe-coding/budget
# Rafraîchir la page → devrait fonctionner ✅
```

---

## Considérations

### Avantages

- ✅ **Standard** : Solution officielle recommandée par GitHub Pages
- ✅ **Transparent** : Pas de flash de redirection, expérience fluide
- ✅ **Automatique** : Fonctionne en local et CI sans config supplémentaire
- ✅ **Simple** : 3 fichiers modifiés, 18 lignes de code
- ✅ **Compatible** : Tous navigateurs et appareils

### Limitations

- ⚠️ **Code HTTP** : GitHub Pages renvoie toujours un code 404 (mais la page charge)
  - Pas un problème pour une PWA personnelle (pas de SEO)
  - Pour SEO → considérer Vercel/Netlify (redirection 200)
- ⚠️ **Analytics** : Les visites directes peuvent apparaître comme "404"
  - Pas un problème (pas d'analytics configuré dans ce projet)

### Alternatives Non Retenues

- ❌ **Juste 404.html sans `.nojekyll`** : Risque que `_app/` soit ignoré par Jekyll
- ❌ **Script JS de redirection** : Flash visible, mauvaise UX
- ❌ **Vercel/Netlify** : Overkill pour ce projet (GitHub Pages gratuit suffit)

---

## Références

- [GitHub Pages SPA Documentation](https://github.com/rafgraph/spa-github-pages)
- [SvelteKit Static Adapter](https://kit.svelte.dev/docs/adapter-static)
- [Jekyll `.nojekyll` File](https://github.blog/2009-12-29-bypassing-jekyll-on-github-pages/)

---

## Fichiers Modifiés

- ✨ `frontend/static/.nojekyll` (créé)
- ✨ `frontend/scripts/copy-404.js` (créé)
- ✏️ `frontend/package.json` (modifié : ajout `postbuild`)
- ✨ `transformations/fix-github-pages-404.md` (documentation)

**Date** : 2026-02-10  
**Commit** : À déterminer après push
