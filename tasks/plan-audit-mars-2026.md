# Audit & Plan d'action — Mon Budget (mars 2026)

**Date** : 2026-03-24
**Branche** : `trunk`
**Statut** : 51 commits, 8 semaines de développement

---

## 1. Bilan de santé du projet

### 1.1 Points forts

| Domaine | Constat |
|---------|---------|
| **Zéro dépendance runtime** | Bundle minimal, aucun risque supply chain |
| **Tests E2E** | 130 tests, 10 fichiers spec, 14 fixtures JSON |
| **Accessibilité** | axe-core sur toutes les pages, `aria-*`, `role`, `data-testid` |
| **db.js** | Implémentation IndexedDB professionnelle (Promises, atomicité, validation) |
| **Imports** | 100% consistant (`$lib`, Svelte imports en premier) |
| **TODO/FIXME/HACK** | 0 dans le code source |
| **Structure** | Pattern identique sur les 4 routes (script → template → style) |
| **Error handling** | `try/catch/finally` uniforme partout |

### 1.2 Dette technique identifiée

| Priorité | Problème | Impact | Localisation |
|----------|----------|--------|-------------|
| **P0** | `transactions/+page.svelte` en Svelte 4 (`let` + `$:`) | Deprecation warnings, incohérence | `src/routes/transactions/+page.svelte:5-19` |
| **P0** | `+page.svelte` (dashboard) en Svelte 4 | Même problème, migration tentée puis revertée | `src/routes/+page.svelte` |
| **P1** | Couleurs hardcodées dans les charts SVG | Pas de theming possible | `BarChart.svelte:61,90,95`, `LineChart.svelte:62,91,96`, `PieChart.svelte:92` |
| **P1** | Couleurs RGBA hardcodées pour overlays | Incohérence CSS | `+page.svelte:442`, `budget/+page.svelte:406`, `goals/+page.svelte:251` |
| **P2** | Pas de `data-testid` sur items transactions/goals | Sélecteurs fragiles dans les tests | `transactions/+page.svelte`, `goals/+page.svelte` |
| **P2** | `theme-color` hardcodé dans `app.html` | Pas lié aux CSS variables | `src/app.html:8` |

### 1.3 Travail non committé (en cours)

Les fichiers suivants sont en staging ou untracked — feature export/import :

- `src/lib/export.js` (4.9 KB) — logique export/import + validation
- `src/lib/mon-budget-export.schema.json` (6.0 KB) — schéma JSON
- `e2e/export-import.spec.ts` (21.8 KB, 45 tests)
- `e2e/debug-export.spec.ts` (1 test)
- `e2e/fixtures/` — 14 fichiers de test (valid-*, corrupted, wrong-*, bad-*, etc.)
- Modifications dans `src/app.css`, `src/lib/db.js`, `src/routes/+page.svelte`, `src/routes/transactions/+page.svelte`

---

## 2. Plan d'action

### Phase 1 — Stabilisation (priorité haute)

#### 1A. Committer la feature export/import
- [ ] Vérifier que les 130 tests passent (`npm run test:e2e`)
- [ ] Vérifier le build (`npm run build`)
- [ ] Committer les fichiers export/import en un ou plusieurs commits logiques
- [ ] Valider que le déploiement GitHub Pages fonctionne

#### 1B. Migration Svelte 5 — `transactions/+page.svelte`
- [ ] Remplacer `let transactions = []` par `let transactions = $state([])`
- [ ] Remplacer `$: filteredCategories` par `let filteredCategories = $derived(...)`
- [ ] Remplacer toutes les réassignations `let` par `$state()` (form, editing, error, loading)
- [ ] Valider : `npm run build` sans warning `non_reactive_update`
- [ ] Valider : tests E2E transactions (13 tests) passent

#### 1C. Migration Svelte 5 — `+page.svelte` (dashboard)
- [ ] Déclarer toutes les variables réactives avec `$state()` : `dashboard`, `loading`, `error`, `barData`, `importError`, `importSuccess`, `exportSuccess`, `showImportModal`, `pendingImportData`, `pendingComparison`, `replaceCountdown`
- [ ] Remplacer `$:` par `$derived` (ex: `hasBarData`)
- [ ] Migrer **page par page** — ne pas tout faire d'un coup (leçon du revert précédent)
- [ ] Valider après chaque variable : tests E2E dashboard (10 tests) + integration (6 tests)

**Règle** : migrer une variable à la fois, lancer les tests entre chaque changement.

---

### Phase 2 — Qualité CSS (priorité moyenne)

#### 2A. Extraire les couleurs hardcodées des charts
- [ ] Ajouter dans `app.css` les variables manquantes :
  ```css
  --text-on-light: #1e293b;
  --chart-axis: var(--text-muted);    /* #a8b8cc */
  --chart-grid: var(--border);         /* #475569 */
  ```
- [ ] Remplacer dans `BarChart.svelte` : `fill="#a8b8cc"` → `fill="var(--chart-axis)"`, `stroke="#475569"` → `stroke="var(--chart-grid)"`
- [ ] Idem `LineChart.svelte` et `PieChart.svelte`
- [ ] Valider : tests charts (9 tests) passent, rendu visuel inchangé

#### 2B. Normaliser les overlays RGBA
- [ ] Ajouter dans `app.css` :
  ```css
  --overlay-dark: rgba(0, 0, 0, 0.7);
  --danger-bg: rgba(239, 68, 68, 0.1);
  --success-bg: rgba(16, 185, 129, 0.2);
  ```
- [ ] Remplacer les RGBA hardcodées dans `+page.svelte`, `budget/+page.svelte`, `goals/+page.svelte`, `transactions/+page.svelte`
- [ ] Valider : tests accessibilité (9 tests) passent

---

### Phase 3 — Couverture des tests (priorité moyenne)

#### 3A. Ajouter `data-testid` sur les items listés
- [ ] `transactions/+page.svelte` : ajouter `data-testid="transaction-item"` sur chaque ligne
- [ ] `goals/+page.svelte` : ajouter `data-testid="goal-card"` sur chaque carte
- [ ] Mettre à jour les tests E2E existants pour utiliser ces sélecteurs

#### 3B. Test de persistance après rechargement
- [ ] Nouveau test dans `integration.spec.ts` :
  - Créer une transaction → recharger la page → vérifier qu'elle est toujours là
  - Vérifier que IndexedDB persiste entre les navigations

#### 3C. Multi-navigateurs
- [ ] Ajouter Firefox et WebKit dans `playwright.config.ts`
- [ ] Lancer les tests sur les 3 navigateurs, corriger les éventuelles régressions
- [ ] Décider si on garde les 3 en CI (temps de build) ou seulement en local

#### 3D. Test du swipe (gestes tactiles)
- [ ] Nouveau test dans `budget.spec.ts` :
  - Simuler un swipe gauche → mois suivant
  - Simuler un swipe droite → mois précédent
  - Utiliser `page.touchscreen` de Playwright

---

### Phase 4 — Backlog fonctionnel (priorité basse)

Issues existantes dans `tasks/todo.md` et `tasks/plan-features-export-charts-swipe.md` :

- [ ] **Export/Import OFX** (A4-A5-A6) — export vers GnuCash
- [ ] **Graphiques fullscreen** (B1-B2-B4) — PieChart + LineChart agrandissables
- [ ] **BarChart cliquable** (B3) — lien vers `/budget`
- [ ] **Hint animation swipe** (C1) — nudge au premier chargement budget
- [ ] **Mettre à jour CLAUDE.md** — retirer le Known Issue D1 (LineChart `on:click` déjà corrigé)

---

## 3. Métriques du projet

### Taille du code

| Composant | Fichiers | Lignes | Taille |
|-----------|----------|--------|--------|
| Routes (pages) | 4 (+1 layout) | ~1 505 | ~35 KB |
| Lib (db, export, charts, swipe) | 7 | ~700 | ~28 KB |
| Styles | 1 | 178 | 2.6 KB |
| Tests E2E | 10 | 2 484 | ~93 KB |
| Fixtures | 14 | — | ~6 KB |
| Scripts build | 2 | 41 | ~1 KB |
| **Total source** | **38** | **~4 900** | **~166 KB** |

### Tests

| Métrique | Valeur |
|----------|--------|
| Fichiers spec | 10 |
| Tests totaux | 130 |
| Tests skipped | 0 |
| Fixtures | 14 fichiers JSON |
| Navigateur | Chromium uniquement |
| Happy paths | ~40% |
| Edge cases | ~60% |
| Ratio test/code | 2 484 lignes tests / ~2 400 lignes source ≈ **1:1** |

### Historique git

| Métrique | Valeur |
|----------|--------|
| Commits | 51 |
| Période | 20 jan — 17 mars 2026 (8 semaines) |
| Contributeur | 1 (Stéphane Trébel) |
| Branches | 1 (`trunk`) |
| Tags | 0 |
| Pic d'activité | Semaine du 10 fév (12 commits) |

### Pages couvertes

| Page | Tests directs | Tests indirects | Swipe | Offline |
|------|:---:|:---:|:---:|:---:|
| Dashboard | 10 | 6 (integration) | — | Non |
| Transactions | 13 | 6 (integration) | — | Non |
| Budget | 15 | — | Non testé | Non |
| Goals | 15 | — | — | Non |
| Navigation | 7 | — | — | Non |

---

## 4. Ordre d'exécution recommandé

```
Phase 1A  ──→  Phase 1B  ──→  Phase 1C
(commit)       (svelte5       (svelte5
                transactions)   dashboard)
                    │
                    ▼
               Phase 2A  ──→  Phase 2B
               (charts CSS)    (overlays CSS)
                    │
                    ▼
               Phase 3A  ──→  Phase 3B  ──→  Phase 3C  ──→  Phase 3D
               (testids)      (persist)      (browsers)     (swipe)
                                                │
                                                ▼
                                           Phase 4
                                           (backlog)
```

**Estimation** : Phases 1-2 = ~4h de travail AI. Phase 3 = ~3h. Phase 4 = backlog continu.

---

## 5. Risques et points d'attention

| Risque | Mitigation |
|--------|-----------|
| Migration Svelte 5 casse la réactivité (déjà arrivé) | Migrer une variable à la fois, tester entre chaque |
| CSS variables dans SVG inline pas supporté partout | Tester sur Firefox/WebKit avant de valider |
| Tests multi-navigateurs rallongent la CI | Garder Chromium en CI, multi-browser en local |
| Travail non committé risque d'être perdu | Phase 1A en priorité absolue |
