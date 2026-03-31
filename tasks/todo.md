# TODO

## En attente

### Phase 1 — Stabilisation

#### 1A. Finaliser export/import JSON et valider GitHub Pages

**Contexte** : la feature export/import JSON est maintenant commitée et la suite E2E passe. Il reste à fermer proprement la phase de stabilisation en validant le build de production et le comportement sur GitHub Pages.

**Travail à faire** :
- [x] Vérifier le build de prod (`npm run build`)
- [x] Pousser `trunk`
- [x] Vérifier le déploiement GitHub Pages en conditions réelles
- [x] Confirmer que l'export/import fonctionne avec `BASE_PATH`

#### 1B. Migrer `src/routes/transactions/+page.svelte` vers Svelte 5 runes

**Contexte** : `transactions/+page.svelte` reste en syntaxe legacy Svelte 4. C'est la première migration à faire avant de toucher le dashboard, car le périmètre est plus simple et le risque est plus faible.

**Plan** : voir [[plan-migration-transactions-svelte5]]

**Travail à faire** :
- [x] Remplacer les états legacy par des runes Svelte 5 (`$state`, `$derived` si nécessaire)
- [x] Éliminer les warnings de réactivité sur la page transactions
- [x] Valider : `npm run build`
- [x] Valider : tests E2E transactions

**Règle** : migrer par petits incréments, avec vérification après chaque sous-étape.

#### 1C. Migrer `src/routes/+page.svelte` (dashboard) vers Svelte 5 runes

**Contexte** : le dashboard est désormais déjà migré en runes Svelte 5 et les vérifications ciblées passent. Le sujet "migration dashboard" est considéré clôturé.

**Travail à faire** :
- [x] `src/routes/+page.svelte` — déclarer toutes les variables réactives avec `$state()` (`dashboard`, `loading`, `error`, `barData`, `importError`, `importSuccess`, `exportSuccess`, `showImportModal`, `pendingImportData`, `pendingComparison`, `replaceCountdown`) et remplacer `$:` par `$derived`
- [x] Valider après chaque étape : tests dashboard + integration
- [x] Valider en fin de migration : `npm run build` + `npm run test:e2e`

**Règle** : migrer page par page, valider les tests après chaque page.

---

### Phase 2 — Qualité CSS

#### 2A. Extraire les couleurs hardcodées des charts SVG

- [x] Ajouter les variables CSS manquantes dans `src/app.css`
- [x] Remplacer les couleurs hardcodées dans `BarChart.svelte`, `LineChart.svelte`, `PieChart.svelte`
- [x] Valider : build + tests charts

#### 2B. Normaliser les overlays et fonds RGBA

- [ ] Ajouter des variables CSS dédiées pour overlays/états
- [ ] Remplacer les valeurs RGBA hardcodées dans dashboard, budget, goals et transactions
- [ ] Valider : tests accessibilité

---

### Phase 3 — Testabilité et couverture

#### 3A. Renforcer les sélecteurs E2E

- [ ] Ajouter `data-testid="transaction-item"` sur les lignes de transactions
- [ ] Ajouter `data-testid="goal-card"` sur les cartes objectifs
- [ ] Mettre à jour les specs existantes pour utiliser ces sélecteurs

#### 3B. Ajouter un test de persistance après rechargement

- [ ] Créer un test d'intégration qui vérifie la persistance IndexedDB après reload

#### 3C. Évaluer le support multi-navigateurs

- [ ] Ajouter Firefox et WebKit dans `playwright.config.ts`
- [ ] Lancer la suite sur 3 navigateurs
- [ ] Décider si Chromium reste seul en CI

#### 3D. Ajouter un smoke test du site déployé

- [ ] Définir un scénario Playwright léger exécuté contre l'URL GitHub Pages publiée
- [ ] Vérifier au minimum : chargement de l'accueil, navigation entre pages, reload d'une route profonde, flux export/import minimal
- [ ] Décider si ce smoke test tourne à chaque déploiement Pages ou en vérification manuelle post-déploiement

#### 3E. Tester le swipe sur la page budget

- [ ] Ajouter un test E2E de swipe gauche/droite sur `/budget`

---

## Fonctionnalités à implémenter (backlog produit)

Voir inventaire complet dans `tasks/plan-features-export-charts-swipe.md`.

- [ ] Export/Import OFX (A4-A5)
- [ ] UI Export/Import OFX dans le Dashboard (A6)
- [ ] Graphiques agrandissables fullscreen — PieChart + LineChart (B1-B2)
- [ ] Tests E2E fullscreen charts (B4)
- [ ] BarChart dashboard cliquable → lien vers `/budget` (B3)
- [ ] Hint animation swipe (nudge au premier chargement budget) (C1)
- [x] Mettre à jour `CLAUDE.md` : retirer le Known Issue D1 (LineChart `on:click`) — déjà corrigé
