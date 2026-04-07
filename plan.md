---
id: plan
aliases: []
tags:
  - obsidian
  - plan
  - mon-budget
created: "2026-04-07"
status: active
title: Plan
type: plan
updated: "2026-04-07"
---

# Plan

## Objectif de ce document

Ce document contient uniquement les actions restantes à exécuter. Les analyses et l'historique ont été déplacés dans `research.md`.

## En cours

### Stabiliser complètement les tests E2E export/import

- [ ] finaliser la stratégie de test export compatible Playwright
- [ ] terminer le chantier de séparation payload / téléchargement si ce n'est pas déjà clos dans le code
- [ ] supprimer les fichiers de diagnostic devenus inutiles
- [ ] relancer les vérifications ciblées export/import

## Phase 3 — Testabilité et couverture

### 3A. Renforcer les sélecteurs E2E

- [ ] ajouter `data-testid="transaction-item"` sur les lignes de transactions
- [ ] ajouter `data-testid="goal-card"` sur les cartes objectifs
- [ ] mettre à jour les specs existantes pour utiliser ces sélecteurs

### 3B. Vérifier la persistance après rechargement

- [ ] ajouter un test d'intégration qui valide la persistance IndexedDB après `reload`

### 3C. Évaluer le support multi-navigateurs

- [ ] ajouter Firefox et WebKit dans `playwright.config.ts`
- [ ] exécuter la suite sur 3 navigateurs
- [ ] décider si Chromium reste seul en CI

### 3D. Ajouter un smoke test du site déployé

- [ ] définir un scénario Playwright léger contre l'URL GitHub Pages publiée
- [ ] vérifier au minimum l'accueil, la navigation, le rechargement d'une route profonde et un flux export/import minimal
- [ ] décider si ce smoke test reste manuel ou rejoint le workflow de déploiement

### 3E. Tester le swipe sur la page budget

- [ ] ajouter un test E2E de swipe gauche/droite sur `/budget`

## Backlog produit

### Export / import avancé

- [ ] export OFX
- [ ] import OFX
- [ ] UI dashboard pour OFX

### UX budget et graphiques

- [ ] fullscreen pour PieChart et LineChart sur la page budget
- [ ] tests E2E du fullscreen
- [ ] rendre le BarChart du dashboard cliquable vers `/budget`
- [ ] ajouter un hint d'animation pour faire découvrir le swipe budget

## Règles de pilotage

- travailler par unités courtes et vérifiables
- privilégier les validations Playwright ciblées avant la suite complète
- mettre à jour `kanban.md` dès qu'une unité change d'état
