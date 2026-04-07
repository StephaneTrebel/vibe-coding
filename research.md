---
title: Research
type: research
status: active
tags:
  - obsidian
  - research
  - mon-budget
created: 2026-04-07
updated: 2026-04-07
---

# Research

## Objectif de ce document

Ce document centralise l'historique utile, les constats, les décisions techniques et les pistes produit du dépôt. Il remplace les anciens fichiers Markdown de `tasks/` et `docs/superpowers/plans/`, dont le détail reste consultable dans l'historique Git.

## Historique du projet

### Origine du produit

- Le projet a d'abord été imaginé comme une application web "Teen Budget App" avec backend Rust/Axum, SQLite et Docker Compose.
- Cette architecture a été abandonnée au profit d'une PWA locale, statique et offline-first.
- L'état cible retenu est désormais celui décrit dans `AGENTS.md` : SvelteKit 5, IndexedDB, déploiement GitHub Pages, locale `fr-FR`.

### Pivot vers la PWA locale

Décisions structurantes conservées :

- suppression de la dépendance à un backend pour un usage personnel et hors-ligne
- stockage local dans IndexedDB (`transactions`, `budgets`, `goals`)
- suppression des besoins d'authentification
- distribution via hébergement statique et installation PWA

Conséquences produit :

- coût d'hébergement minimal
- confidentialité renforcée
- absence de synchronisation multi-appareils native
- besoin explicite d'export/import pour limiter le risque de perte de données

## Transformations déjà réalisées

### Navigation et responsive

- navigation mobile passée d'un menu hamburger à une bottom navigation dédiée
- corrections responsive sur les cartes transactions, budget et objectifs
- prise en compte systématique du `BASE_PATH` GitHub Pages via `$app/paths`

### Déploiement GitHub Pages

Décisions stabilisées :

- génération du `manifest.json` à partir d'un template pendant le build
- copie de `index.html` vers `404.html` pour supporter les routes SPA au refresh
- ajout de `.nojekyll` pour éviter les problèmes de publication sur GitHub Pages

### Export / import JSON

Décisions et comportements déjà établis :

- export/import JSON comme mécanisme principal de sauvegarde locale
- validation de structure côté import
- comparaison et confirmation avant remplacement des données
- prise en compte du `BASE_PATH` jusque dans les flux liés au build et au déploiement

### Migrations Svelte 5 et nettoyage UI

Travaux déjà documentés comme terminés :

- migration de `transactions/+page.svelte` vers les runes Svelte 5
- migration du dashboard `src/routes/+page.svelte` vers les runes Svelte 5
- extraction des couleurs hardcodées des charts vers des variables CSS
- normalisation des overlays et états RGBA dans les pages principales

## État technique de référence

### Forces observées lors de l'audit de mars 2026

- zéro dépendance runtime côté application
- bonne couverture E2E Playwright
- contrôle d'accessibilité avec `axe-core`
- couche IndexedDB jugée propre et cohérente
- structure homogène des routes Svelte
- peu de dette "visible" de type TODO/FIXME/HACK dans le code source

### Dette technique encore pertinente

Cette dette reste utile comme mémoire, même si une partie a déjà été traitée :

- renforcer la testabilité des listes via `data-testid`
- compléter la couverture de persistance après rechargement
- évaluer un support multi-navigateurs Playwright
- compléter les tests tactiles sur la navigation par swipe

## Sujet récemment refermé

Le chantier de stabilisation des tests E2E export/import est désormais refermé.

Constat final conservé :

- l'échec réel restant ne venait pas d'un bug produit du merge, mais d'un test couplé au mois courant
- la correction retenue a consisté à réaligner le test sur la fixture utilisée
- le test concerné attend désormais un signal fonctionnel de fin de fusion avant d'asserter
- le spec `export-import` passe intégralement après cette correction

Trace documentaire :

- [[tasks/stabiliser-tests-e2e-export-import/task]]

## Décisions produit et UX à conserver

### Mobile / interactions

- bottom nav mobile avec navigation principale fixe
- swipe horizontal prévu sur la page budget pour changer de mois
- affordance légère au premier chargement envisagée pour faire découvrir le geste

### Visualisations

- conserver des graphiques SVG maison
- réserver le fullscreen aux graphiques de la page budget
- rendre la carte BarChart du dashboard cliquable vers `/budget` plutôt que fullscreen

### Exports futurs

- l'export/import JSON est la base fonctionnelle
- le support OFX reste une extension produit distincte

## Backlog produit issu des anciennes notes

Pistes encore pertinentes :

- export OFX pour GnuCash
- import OFX
- UI dashboard pour OFX
- fullscreen sur PieChart et LineChart
- tests E2E du fullscreen
- BarChart du dashboard cliquable vers `/budget`
- hint d'onboarding pour le swipe budget

## Références techniques à garder en tête

- toujours utiliser `$app/paths` `base` pour les liens internes
- GitHub Pages nécessite `404.html` et `.nojekyll` pour un comportement SPA robuste
- le `manifest.json` est généré, pas édité directement
- la source d'instructions projet reste `AGENTS.md`
