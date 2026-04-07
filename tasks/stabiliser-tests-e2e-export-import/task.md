---
title: Stabiliser les tests E2E export/import
type: task
status: done
tags:
  - obsidian
  - task
  - tests
  - playwright
  - export-import
created: 2026-04-07
updated: 2026-04-07
---

# Stabiliser les tests E2E export/import

## Résumé

Cette tâche vise à rendre la suite E2E export/import fiable, compréhensible et exploitable au quotidien. Le sujet concerne autant la robustesse fonctionnelle de l'interface que la compatibilité entre les mécanismes navigateur utilisés par l'application et les mécanismes de simulation utilisés par Playwright.

## Pourquoi cette tâche existe

L'export/import est une fonctionnalité sensible parce qu'elle protège les données locales de l'utilisateur. Si les tests autour de ce flux sont instables ou partiellement cassés, on perd à la fois un filet de sécurité technique et de la confiance dans une fonctionnalité critique.

Les notes précédentes font apparaître deux zones de fragilité principales :

- la sélection de fichier à l'import dans un contexte Svelte 5 et Playwright
- le téléchargement du fichier d'export, piloté côté navigateur sans événement facilement interceptable par les tests

## Contexte technique

Le projet est une PWA locale, sans backend, avec stockage IndexedDB. Le flux export/import touche donc directement :

- l'interface du dashboard
- la lecture et la validation des fichiers
- la récupération de données depuis IndexedDB
- les comportements navigateur liés aux inputs de type fichier et aux téléchargements

Le point délicat n'est pas seulement la logique métier. Il faut aussi que la stratégie de test reflète correctement la manière dont le navigateur et Playwright interagissent réellement avec l'application.

## Objectif

Obtenir une base de tests E2E export/import stable, maintenable et représentative du comportement utilisateur réel, avec un diagnostic clair en cas de régression.

## Résultat attendu

À la fin de cette tâche, on doit disposer de :

- tests d'import fiables
- tests d'export fiables
- suppression des artefacts de debug qui ne servent plus
- compréhension claire des limites éventuelles de la stratégie de test
- confiance suffisante pour relancer ce périmètre dans les validations courantes

## Périmètre

Cette tâche couvre :

- la stabilisation du flux d'import JSON
- la stabilisation du flux d'export JSON
- l'ajustement éventuel de la stratégie de test Playwright
- le nettoyage des fichiers de diagnostic temporaires liés à ce sujet

Cette tâche ne couvre pas :

- l'ajout d'un support OFX
- l'évolution UX du flux export/import
- l'élargissement du périmètre à d'autres familles de tests non liées à export/import

## Points d'attention

- les tests doivent vérifier le comportement utile, pas seulement des détails d'implémentation
- la stratégie retenue doit rester lisible pour une future relecture
- il faut éviter de construire une solution de test trop couplée à une implémentation fragile
- les messages d'échec doivent aider à distinguer un vrai bug produit d'une limite de simulation Playwright

## Risques

- conserver des tests verts mais peu représentatifs du comportement utilisateur réel
- introduire une stratégie d'export testable mais trop éloignée du flux navigateur réel
- laisser en place des fichiers de debug qui brouillent la lecture du dépôt
- corriger un problème localement sans stabiliser l'ensemble du parcours export/import

## Critères de sortie

- la carte kanban peut passer en `Done` uniquement si les vérifications export/import jugées nécessaires sont identifiées puis exécutées avec succès
- le périmètre export/import ne dépend plus de fichiers de diagnostic ad hoc
- la note de tâche reste suffisante pour comprendre l'enjeu sans relire l'ancien historique dispersé

## Diagnostic retenu

- le périmètre export/import n'avait plus un problème global : le spec ciblé échouait sur un seul test réel
- l'échec initial portait sur `merge-upserts-budgets`
- la cause confirmée n'était ni un bug produit du merge, ni une limite Playwright sur l'import
- la cause racine était un test dépendant implicitement du mois courant, alors que la fixture importait un budget sur un autre mois
- un second point a été confirmé pendant la correction : le test devait attendre un signal fonctionnel de fin de fusion avant de quitter la page

## Résolution

- le test a été réaligné sur la fixture `valid-full.json`
- le mois cible est désormais lu depuis la fixture au lieu d'être supposé
- la navigation du test vers la page budget cible explicitement le mois porté par la fixture
- le test attend le message de succès d'import avant l'assertion finale
- le helper de lecture de fixtures a été scindé entre contenu brut et JSON valide pour préserver les cas invalides comme `corrupted-json`

## Vérifications exécutées

- `npx playwright test e2e/export-import.spec.ts -g "merge-upserts-budgets" --reporter=line`
- `npx playwright test e2e/export-import.spec.ts --reporter=line`

## Résultat

- le test ciblé passe
- le spec `export-import` passe entièrement
- le sujet est considéré clos pour cette unité de travail

## Liens utiles

- [[plan]]
- [[research]]
- [[kanban]]
