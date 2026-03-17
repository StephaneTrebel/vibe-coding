# Plan de tests — Export/Import JSON (A1-A3)

## 1. Fichiers de tests à créer/modifier

### Nouveau fichier : `frontend/e2e/export-import.spec.ts`
Fichier principal dédié à la fonctionnalité export/import. Couvre les cas nominaux, limites et erreurs.

### Fichier à modifier : `frontend/e2e/accessibility.spec.ts`
Ajouter les scans axe-core pour la modale d'export/import (états ouvert vide, ouvert avec données, après import).

### Fichier à modifier : `frontend/e2e/integration.spec.ts`
Ajouter un test cross-page vérifiant que l'import met à jour toutes les pages (dashboard, budget, goals).

---

## 2. Helpers nécessaires

Tous dans `export-import.spec.ts` (fonctions locales au fichier, comme les patterns existants dans `integration.spec.ts` et `dashboard.spec.ts`) :

```typescript
// Helper : créer une transaction via l'UI
async function addTransaction(page: Page, type: 'income' | 'expense', amount: string, category: string, date: string)

// Helper : créer un objectif via l'UI
async function addGoal(page: Page, name: string, target: string)

// Helper : définir un budget via l'UI
async function setBudget(page: Page, amount: string)

// Helper : ouvrir la modale d'export/import
async function openExportImportModal(page: Page)

// Helper : lire le contenu du fichier JSON téléchargé (via Playwright download API)
async function getDownloadedJSON(download: Download): Promise<object>

// Helper : injecter un fichier JSON pour l'import (via page.setInputFiles ou page.evaluate pour FileReader)
async function importJSONFile(page: Page, content: object | string, filename?: string)
```

---

## 3. `data-testid` requis

Les composants d'export/import devront exposer ces `data-testid` :

| `data-testid` | Élément | Usage |
|---|---|---|
| `export-import-button` | Bouton d'ouverture de la modale (navbar/settings) | Point d'entrée |
| `export-import-modal` | Conteneur de la modale | Vérification visible/invisible |
| `export-button` | Bouton "Exporter" dans la modale | Déclenche le téléchargement |
| `import-file-input` | Input file (type=file, accept=.json) | Sélection du fichier |
| `import-mode-merge` | Radio/bouton "Fusionner" | Mode fusion |
| `import-mode-replace` | Radio/bouton "Remplacer" | Mode remplacement |
| `import-button` | Bouton "Importer" | Déclenche l'import |
| `import-close-button` | Bouton de fermeture de la modale | Fermeture |
| `import-error` | Zone d'affichage des erreurs | Messages d'erreur |
| `import-success` | Zone de confirmation succès | Message de succès |
| `import-preview` | Zone de preview avant confirmation | Résumé des données à importer |

---

## 4. Structure des tests

### 4.1 — Cas nominaux

```
describe('Export/Import')
  describe('Export')
    test('export-opens-download')
      → Créer des données (3 transactions, 1 budget, 1 goal)
      → Ouvrir la modale, cliquer "Exporter"
      → Intercepter le download via page.waitForEvent('download')
      → Vérifier que le fichier JSON contient les 3 stores
      → Vérifier la structure : { version, exportedAt, data: { transactions, budgets, goals } }
      → Vérifier le nombre d'entrées (3 tx, 1 budget, 1 goal)

    test('export-empty-database')
      → Base vide, pas de données
      → Exporter → fichier valide avec tableaux vides
      → Vérifier : { data: { transactions: [], budgets: [], goals: [] } }

    test('export-filename-format')
      → Vérifier que le nom du fichier suit le pattern : mon-budget-export-YYYY-MM-DD.json

  describe('Import - Base vide')
    test('import-on-empty-db')
      → Préparer un fichier JSON valide avec 2 tx, 1 budget, 1 goal
      → Importer sur base vide
      → Vérifier que toutes les données apparaissent dans l'UI
        - /transactions affiche les 2 transactions
        - /budget affiche le budget importé
        - /goals affiche l'objectif importé

  describe('Import - Fusion (merge)')
    test('import-merge-adds-new-data')
      → Créer 1 transaction existante via l'UI
      → Importer un fichier avec 2 nouvelles transactions (mode "Fusionner")
      → Vérifier que la page transactions affiche 3 transactions au total

    test('import-merge-preserves-existing')
      → Créer 1 budget (mois courant = 500€) et 1 goal via l'UI
      → Importer un fichier avec 1 budget (mois différent = 300€) et 1 goal différent
      → Vérifier : les 2 budgets existent (mois courant = 500€ inchangé), les 2 goals existent

    test('import-merge-duplicate-budget-month')
      → Créer un budget de 500€ pour le mois courant
      → Importer un fichier avec un budget de 800€ pour le même mois (mode fusion)
      → Définir le comportement attendu : le budget existant est conservé OU écrasé
      → (À clarifier avec l'architecte — ce test documente le comportement choisi)

  describe('Import - Remplacement (replace)')
    test('import-replace-clears-existing')
      → Créer 3 transactions, 1 budget, 2 goals via l'UI
      → Importer un fichier avec 1 transaction, 1 budget, 0 goals (mode "Remplacer")
      → Vérifier : 1 seule transaction, 1 budget, 0 goals
      → Vérifier que les anciennes données ont bien disparu

    test('import-replace-confirmation-dialog')
      → Avant le remplacement, un dialog/confirmation apparaît
      → Texte : avertissement de perte de données
      → Annuler → données inchangées
      → Confirmer → remplacement effectif
```

### 4.2 — Cas limites

```
  describe('Edge Cases')
    test('import-partial-data-transactions-only')
      → Importer un fichier contenant uniquement { data: { transactions: [...] } }
      → Vérifier : transactions importées, budgets et goals inchangés

    test('import-partial-data-goals-only')
      → Importer un fichier contenant uniquement { data: { goals: [...] } }
      → Vérifier : goals importés, transactions et budgets inchangés

    test('import-empty-arrays')
      → Importer un fichier avec { data: { transactions: [], budgets: [], goals: [] } }
      → Mode merge : données existantes inchangées
      → Mode replace : base vidée

    test('import-large-dataset')
      → Importer un fichier avec 100+ transactions
      → Vérifier que l'import réussit sans timeout
      → Vérifier que la page transactions affiche les données

    test('export-preserves-all-fields')
      → Créer une transaction avec description
      → Créer une transaction sans description
      → Créer un goal partiellement progressé (current_amount > 0)
      → Créer un goal atteint (achieved = true)
      → Exporter et vérifier que tous les champs sont présents et corrects dans le JSON

    test('import-version-incompatible')
      → Importer un fichier avec { version: 999, data: {...} }
      → Vérifier qu'un message d'erreur s'affiche (data-testid="import-error")
      → Vérifier que les données existantes sont inchangées

    test('roundtrip-export-then-import')
      → Créer un jeu de données complet (tx, budgets, goals)
      → Exporter
      → Vider la base (via replace avec fichier vide, ou navigation)
      → Réimporter le fichier exporté
      → Vérifier que toutes les données sont identiques (montants, catégories, dates, noms)
```

### 4.3 — Cas d'erreur

```
  describe('Error Handling')
    test('import-non-json-file')
      → Tenter d'importer un fichier .txt avec du contenu non-JSON
      → Vérifier le message d'erreur (data-testid="import-error")
      → Texte attendu : contient "format" ou "JSON" ou "invalide"
      → Données existantes inchangées

    test('import-corrupted-json')
      → Importer un fichier .json dont le contenu est du JSON tronqué : '{"data": {'
      → Vérifier le message d'erreur
      → Données existantes inchangées

    test('import-missing-data-key')
      → Importer un fichier JSON valide mais sans la clé "data" : { "version": 1 }
      → Vérifier le message d'erreur
      → Données existantes inchangées

    test('import-invalid-transaction-fields')
      → Importer un fichier avec une transaction ayant un type invalide (ni income ni expense)
      → Comportement attendu : erreur OU transaction ignorée (à clarifier)
      → Dans tous les cas, les autres données valides sont gérées correctement

    test('import-negative-amount')
      → Importer une transaction avec amount: -50
      → Comportement attendu : erreur OU valeur normalisée (à clarifier)

    test('import-malformed-date')
      → Importer une transaction avec date: "not-a-date"
      → Vérifier le comportement (erreur ou ignorée)

    test('import-cancel-preserves-data')
      → Ouvrir la modale, sélectionner un fichier
      → Fermer la modale sans cliquer "Importer"
      → Vérifier que rien n'a changé

    test('import-no-file-selected')
      → Ouvrir la modale, cliquer "Importer" sans fichier sélectionné
      → Vérifier le message d'erreur approprié
```

### 4.4 — Accessibilité (dans `accessibility.spec.ts`)

```
  test('axe-scan-export-import-modal-empty')
    → Ouvrir la modale sur base vide
    → Scan axe-core → 0 violations

  test('axe-scan-export-import-modal-with-data')
    → Créer des données, ouvrir la modale
    → Scan axe-core → 0 violations

  test('axe-scan-export-import-after-error')
    → Provoquer une erreur d'import (fichier corrompu)
    → Scan axe-core sur la modale avec erreur → 0 violations
```

### 4.5 — Accessibilité modale (dans `export-import.spec.ts`)

```
  describe('Modal Accessibility')
    test('modal-focus-trap')
      → Ouvrir la modale
      → Tab à travers les éléments : focus reste dans la modale
      → Le premier élément focusable reçoit le focus à l'ouverture

    test('modal-escape-closes')
      → Ouvrir la modale
      → Appuyer sur Escape
      → La modale se ferme
      → Le focus revient au bouton d'ouverture

    test('modal-aria-attributes')
      → Vérifier : role="dialog", aria-modal="true", aria-labelledby pointe vers un titre
      → Vérifier que le bouton de fermeture a un aria-label

    test('modal-backdrop-click-closes')
      → Cliquer sur le backdrop (overlay derrière la modale)
      → La modale se ferme
```

### 4.6 — Intégration cross-page (dans `integration.spec.ts`)

```
  test('import-updates-all-pages')
    → Base vide
    → Importer un fichier avec : 2 transactions (1 income 500€, 1 expense 100€), 1 budget (mois courant, 300€), 1 goal ("Vélo", 200€)
    → Vérifier le dashboard : solde = 400€, transactions récentes affichées
    → Vérifier /budget : budget = 300€, dépensé = 100€
    → Vérifier /goals : "Vélo" affiché avec cible 200€
    → Vérifier /transactions : 2 transactions listées
```

---

## 5. Ordre d'exécution et dépendances

Chaque test Playwright démarre avec une base IndexedDB vide (isolation par défaut du navigateur Playwright). Donc **aucune dépendance d'état entre tests**.

### Ordre de développement recommandé (par priorité) :

| Phase | Tests | Justification |
|---|---|---|
| **1** | `export-opens-download`, `export-empty-database`, `export-filename-format` | L'export est le prérequis pour tester l'import roundtrip |
| **2** | `import-on-empty-db`, `import-merge-adds-new-data`, `import-replace-clears-existing` | Cas nominaux fondamentaux |
| **3** | `roundtrip-export-then-import` | Validation de bout en bout |
| **4** | `import-non-json-file`, `import-corrupted-json`, `import-missing-data-key` | Robustesse des erreurs |
| **5** | `import-partial-data-*`, `import-version-incompatible`, `import-large-dataset` | Cas limites |
| **6** | `modal-focus-trap`, `modal-escape-closes`, `modal-aria-attributes` | Accessibilité modale |
| **7** | `import-updates-all-pages`, scans axe-core | Intégration et a11y |

---

## 6. Détails techniques Playwright

### Gestion des téléchargements (export)

```typescript
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.locator('[data-testid="export-button"]').click()
]);
const content = await download.createReadStream();
// ... lire et parser le JSON
```

### Gestion des uploads (import)

```typescript
// Via setInputFiles sur l'input file
const fileContent = JSON.stringify(importData);
const buffer = Buffer.from(fileContent, 'utf-8');
await page.locator('[data-testid="import-file-input"]').setInputFiles({
  name: 'import.json',
  mimeType: 'application/json',
  buffer
});
```

### Assertions sur le contenu JSON exporté

```typescript
async function getDownloadedJSON(download: Download) {
  const path = await download.path();
  const content = fs.readFileSync(path!, 'utf-8');
  return JSON.parse(content);
}
```

---

## 7. Format JSON attendu (contrat d'interface)

```json
{
  "version": 1,
  "exportedAt": "2026-03-17T10:30:00.000Z",
  "data": {
    "transactions": [
      {
        "type": "expense",
        "amount": 42.50,
        "category": "Alimentation",
        "description": "Courses",
        "date": "2026-03-15",
        "createdAt": "2026-03-15T08:00:00.000Z"
      }
    ],
    "budgets": [
      { "month": "2026-03", "amount": 500 }
    ],
    "goals": [
      {
        "name": "Vélo",
        "target_amount": 300,
        "current_amount": 50,
        "achieved": false,
        "createdAt": "2026-03-01T10:00:00.000Z"
      }
    ]
  }
}
```

**Note** : les `id` (autoIncrement) ne sont PAS exportés — ils seront régénérés à l'import. Cela évite les conflits de clés primaires.

---

## 8. Points à clarifier avec l'architecte

1. **Conflit de budget en mode merge** : si le même mois existe, on écrase ou on garde l'existant ?
2. **Transactions invalides à l'import** : on rejette tout le fichier ou on ignore les entrées invalides ?
3. **Limite de taille de fichier** : faut-il une limite (ex: 5 Mo) ?
4. **Emplacement du bouton export/import** : dans la navbar ? Page settings dédiée ? Modale accessible depuis chaque page ?

---

## 9. Nombre total de tests

| Catégorie | Nombre |
|---|---|
| Export — cas nominaux | 3 |
| Import — base vide | 1 |
| Import — fusion | 3 |
| Import — remplacement | 2 |
| Cas limites | 7 |
| Erreurs | 8 |
| Accessibilité modale | 4 |
| Scans axe-core | 3 |
| Intégration cross-page | 1 |
| **Total** | **32** |
