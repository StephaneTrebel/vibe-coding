# TODO

## En attente

### Migrer les pages de Svelte 4 legacy vers Svelte 5 runes

**Contexte** : lors de l'implémentation de l'export/import JSON (mars 2026), le code-reviewer a signalé que `src/routes/+page.svelte` utilise encore la syntaxe Svelte 4 (`$:`, `let` sans `$state`). La tentative de migration partielle (`$derived` sur `hasBarData` seul) a cassé la réactivité et fait passer les tests de 84 → 69. Revert effectué.

**Travail à faire** :
- [ ] `src/routes/+page.svelte` — déclarer toutes les variables réactives avec `$state()` (`dashboard`, `loading`, `error`, `barData`, `importError`, `importSuccess`, `exportSuccess`, `showImportModal`, `pendingImportData`, `pendingComparison`, `replaceCountdown`) et remplacer `$:` par `$derived`
- [ ] Auditer les autres pages (`transactions`, `budget`, `goals`) pour le même problème
- [ ] Valider : `npm run build` sans warning `non_reactive_update` + `npm run test:e2e` 84/84

**Règle** : migrer page par page, valider les tests après chaque page.

---

## Fonctionnalités à implémenter (backlog)

Voir inventaire complet dans `tasks/plan-features-export-charts-swipe.md`.

- [ ] Export/Import OFX (A4-A5)
- [ ] UI Export/Import OFX dans le Dashboard (A6)
- [ ] Graphiques agrandissables fullscreen — PieChart + LineChart (B1-B2)
- [ ] Tests E2E fullscreen charts (B4)
- [ ] BarChart dashboard cliquable → lien vers `/budget` (B3)
- [ ] Hint animation swipe (nudge au premier chargement budget) (C1)
- [ ] Mettre à jour `CLAUDE.md` : retirer le Known Issue D1 (LineChart `on:click`) — déjà corrigé
