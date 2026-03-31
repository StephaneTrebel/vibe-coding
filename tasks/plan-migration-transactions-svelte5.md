# Plan de migration — `transactions/+page.svelte` vers Svelte 5

**Objectif** : migrer la page transactions de la syntaxe legacy Svelte 4 vers les runes Svelte 5 sans changer le comportement utilisateur.

## Périmètre

- Fichier principal : `frontend/src/routes/transactions/+page.svelte`
- Vérifications associées :
  - build frontend
  - tests E2E `transactions`
  - tests d'intégration dépendant des transactions

## Approche retenue

### 1. Garder un périmètre strict

- Ne toucher qu'à la page transactions
- Ne pas ajouter de fonctionnalité
- Ne pas modifier le design ou les textes
- Ne pas profiter de la migration pour faire du refactor transverse

### 2. Migrer l'état simple avant l'état complexe

- Convertir d'abord les états simples :
  - `transactions`
  - `loading`
  - `error`
  - `showForm`
  - `editingId`
- Vérifier ensuite que la page reste lisible et interactive

### 3. Migrer le formulaire dans un second temps

- Convertir `form` proprement en état Svelte 5
- Revalider les chemins suivants :
  - ouverture/fermeture du formulaire
  - création
  - édition
  - reset
- Surveiller particulièrement les `bind:value` et les réassignations de l'objet formulaire

### 4. Remplacer la réactivité legacy

- Remplacer la dérivation `$: categories = ...`
- Garder une dérivation minimale, limitée au type de transaction
- Éviter d'introduire des dérivations inutiles

### 5. Relire tous les points d'écriture de state

- Vérifier une par une les fonctions :
  - `loadTransactions`
  - `resetForm`
  - `handleSubmit`
  - `editTransaction`
  - `deleteTransaction`
- Confirmer qu'elles restent compatibles avec les runes et ne créent pas d'état partiellement réactif

### 6. Vérifier sans élargir le scope

- Vérifier d'abord le build et les warnings liés à cette page
- Vérifier ensuite les tests `transactions`
- Finir par les tests d'intégration qui dépendent des transactions

## Risques principaux

- Mauvaise migration de l'objet `form`
- Rupture de la dérivation `categories`
- Régression sur le préremplissage en édition
- Régression silencieuse malgré un rendu visuel correct

## Critères de sortie

- Comportement utilisateur inchangé
- Build frontend valide
- Tests E2E `transactions` verts
- Tests d'intégration liés aux transactions verts
- Plus de warning de migration spécifique à `transactions/+page.svelte`
