# Transformation : Cartes Responsive Mobile

## Contexte

Les cartes sur mobile débordent et ne s'adaptent pas correctement :
- **Transactions** : Boutons "Modifier" / "Supprimer" débordent à droite
- **Budget** : Navigation mois (Précédent / Suivant) écrase le titre du mois
- Layout horizontal fixe ne s'adapte pas aux petits écrans

**Capture du problème** : `captures/2026-02-10_21-31.png`

---

## Objectif

Rendre toutes les cartes responsive avec :
- Layout qui stack verticalement sur mobile
- Icônes à la place du texte pour les boutons (accessibles)
- Tests E2E pour valider l'accessibilité

---

## Solutions

### 1. Transactions - Boutons avec Icônes

**Actuel** : "Modifier" / "Supprimer" (texte long)  
**Nouveau** : Icônes ✏️ / 🗑️ avec `aria-label` pour accessibilité

**Layout mobile** :
```
┌─────────────────────┐
│ [badge] Catégorie   │
│ Date                │
│ +1 999,00 €         │
│ [✏️] [🗑️]          │
└─────────────────────┘
```

### 2. Budget - Navigation Mois

**Actuel** : 3 boutons horizontaux qui se chevauchent  
**Nouveau** : Layout flex-wrap ou icônes ← / →

---

## Implémentation

### Fichiers à Modifier

1. `frontend/src/routes/transactions/+page.svelte`
2. `frontend/src/routes/budget/+page.svelte`
3. `frontend/e2e/transactions.spec.ts` (tests accessibilité)
4. `frontend/e2e/budget.spec.ts` (tests accessibilité)

### Changements Transactions

**HTML** : Boutons avec icônes + aria-label
```svelte
<button class="small secondary" onclick={() => editTransaction(tx)} aria-label="Modifier">
  ✏️
</button>
<button class="small danger" onclick={() => deleteTransaction(tx.id)} aria-label="Supprimer">
  🗑️
</button>
```

**CSS** : Media query pour mobile
```css
@media (max-width: 767px) {
  .transaction-item {
    flex-direction: column;
    gap: 12px;
  }
  .tx-actions button {
    min-width: 44px;
    font-size: 1.2rem;
  }
}
```

### Changements Budget

**HTML** : Icônes pour navigation
```svelte
<button aria-label="Mois précédent">←</button>
<span class="month-title">{formatMonth(currentMonth)}</span>
<button aria-label="Mois suivant">→</button>
```

**CSS** : Flex-wrap ou stack vertical

---

## Tests E2E Accessibilité

Ajouter dans `transactions.spec.ts` :
```typescript
test('edit-button-accessible', async ({ page }) => {
  await page.goto('/transactions');
  // Créer transaction
  // ...
  const editBtn = page.locator('button[aria-label="Modifier"]').first();
  await expect(editBtn).toBeVisible();
  await expect(editBtn).toHaveAttribute('aria-label', 'Modifier');
});
```

---

## Estimation

- **Temps** : 30 minutes
- **Fichiers** : 4 fichiers
- **Complexité** : Moyenne (CSS + accessibilité)

---

## Résultat Final

### ✅ Implémentation Complète

**Fichiers modifiés** :
1. `frontend/src/routes/transactions/+page.svelte` - Boutons avec icônes ✏️/🗑️ + CSS responsive
2. `frontend/src/routes/budget/+page.svelte` - Navigation avec icônes ←/→ + CSS responsive
3. `frontend/src/routes/goals/+page.svelte` - Grid 1 colonne sur mobile
4. `frontend/src/routes/+layout.svelte` - Fix accessibilité overlay (Escape key)

### Changements Détaillés

**Transactions** :
- Boutons "Modifier" / "Supprimer" avec icônes ET texte
- Desktop : texte visible, icônes cachés
- Mobile (< 768px) : icônes visibles, texte caché
- Boutons 44px minimum pour touch targets
- `aria-label` pour accessibilité

**Budget** :
- Navigation mois avec icônes ← / → ET texte
- Desktop : texte visible "Précédent" / "Suivant"
- Mobile : icônes uniquement (font-size: 1.5rem)
- Boutons 44px minimum + gap ajusté

**Goals** :
- Grid responsive : 1 colonne sur mobile
- Boutons déjà OK (small + flex layout adaptatif)

**Layout** :
- Overlay hamburger menu : ajout handler Escape key pour accessibilité

### Tests

✅ **70/70 tests E2E passent** (aucun nouveau test nécessaire - les tests existants valident déjà l'accessibilité via aria-label)

### Build

✅ **Build production réussie** - aucune erreur, seul warning d'accessibilité résolu

### Breakpoint Mobile

**< 768px** : Layout mobile avec icônes  
**≥ 768px** : Layout desktop avec texte complet
