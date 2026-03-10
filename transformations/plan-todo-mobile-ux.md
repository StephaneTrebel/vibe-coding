# Plan — UX Mobile

> v4 — validé par @project-manager, @user-experience, @tech-lead.

---

## 1. Fix préalable : migration Svelte 5 des composants chart

**Priorité :** haute (débloque toutes les étapes suivantes)

**Fichiers :** `src/lib/LineChart.svelte`, `src/lib/BarChart.svelte`, `src/lib/PieChart.svelte`

**Changements :**
- Remplacer `export let` → `let { ... } = $props()`
- Remplacer `$:` → `$derived()` (attention : `$derived` est lazy — vérifier les cas `data = []`)
- Remplacer `on:click` → `onclick` (fix bug connu sur `LineChart`)

**Critères :** plus aucun warning de dépréciation, toggle 6/12 mois fonctionnel, `charts.spec.ts` passe sans régression sur les cas de données vides.

---

## 2. Swipe pour changer de mois (page Budget)

**Priorité :** moyenne

**Description :** Sur mobile, swipe horizontal sur la barre de navigation mensuelle pour passer d'un mois à l'autre, en complément des boutons ← / →.

### 2a. `src/lib/swipe.js` (à créer)

```javascript
export function createSwipeHandler({ onSwipeLeft, onSwipeRight, threshold = 50 }) {
  let touchStartX
  let touchStartY

  return {
    handleTouchStart(e) {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    },
    handleTouchMove(e) {
      // Retourne deltaX pour le retour visuel, null si scroll vertical dominant
      if (touchStartX === undefined) return null
      const deltaX = e.touches[0].clientX - touchStartX
      const deltaY = e.touches[0].clientY - touchStartY
      if (Math.abs(deltaX) < Math.abs(deltaY) * 0.5) return null
      return deltaX
    },
    handleTouchEnd(e) {
      if (touchStartX === undefined) return
      const deltaX = e.changedTouches[0].clientX - touchStartX
      const deltaY = e.changedTouches[0].clientY - touchStartY
      touchStartX = undefined
      touchStartY = undefined
      if (Math.abs(deltaX) < Math.abs(deltaY) * 0.5) return // scroll prioritaire
      if (deltaX < -threshold) onSwipeLeft?.()
      else if (deltaX > threshold) onSwipeRight?.()
    },
    handleTouchCancel() {
      // Reset si interruption OS (appel entrant, notification)
      touchStartX = undefined
      touchStartY = undefined
    }
  }
}
```

**Notes :**
- Ratio `0.5` : swipe ignoré si l'angle est à plus de ~27° de l'horizontal (scroll prioritaire)
- `handleTouchMove` retourne `deltaX` ou `null` pour permettre le retour visuel en temps réel
- `handleTouchCancel` évite un delta corrompu au touch suivant

### 2b. Intégration dans `budget/+page.svelte`

**Cible du retour visuel : `.month-nav` uniquement** (décision UX — évite de déplacer les inputs du formulaire budget)

**Pattern d'enregistrement :** `addEventListener` dans `onMount` avec `{ passive: true }` + cleanup (obligatoire pour pouvoir passer `passive: true`, non configurable via attributs Svelte)

```javascript
import { onMount } from 'svelte'
import { createSwipeHandler } from '$lib/swipe.js'

let monthNavEl  // bind:this={monthNavEl} sur .month-nav
let dragOffset = 0

onMount(() => {
  const handler = createSwipeHandler({
    onSwipeLeft() {
      if (loading) return  // guard : pas de swipe concurrent pendant le chargement
      changeMonth(1)
      if (navigator.vibrate) navigator.vibrate(10)
    },
    onSwipeRight() {
      if (loading) return
      changeMonth(-1)
      if (navigator.vibrate) navigator.vibrate(10)
    }
  })

  const onMove = (e) => {
    const dx = handler.handleTouchMove(e)
    dragOffset = dx ?? 0
  }
  const onEnd = (e) => {
    dragOffset = 0
    handler.handleTouchEnd(e)
  }
  const onCancel = () => {
    dragOffset = 0
    handler.handleTouchCancel()
  }

  monthNavEl.addEventListener('touchstart', handler.handleTouchStart, { passive: true })
  monthNavEl.addEventListener('touchmove', onMove, { passive: true })
  monthNavEl.addEventListener('touchend', onEnd, { passive: true })
  monthNavEl.addEventListener('touchcancel', onCancel, { passive: true })

  return () => {
    monthNavEl.removeEventListener('touchstart', handler.handleTouchStart)
    monthNavEl.removeEventListener('touchmove', onMove)
    monthNavEl.removeEventListener('touchend', onEnd)
    monthNavEl.removeEventListener('touchcancel', onCancel)
  }
})
```

**Retour visuel sur `.month-nav` :**
```svelte
<div class="month-nav card" bind:this={monthNavEl}
  style="transform: translateX({dragOffset}px) rotate({dragOffset * 0.05}deg);
         opacity: {Math.abs(dragOffset) > 10 ? 0.85 : 1};
         transition: {dragOffset === 0 ? 'transform 0.2s ease, opacity 0.2s ease' : 'none'}">
```
La légère rotation (`dragOffset * 0.05deg`) donne une sensation de "page qui se tourne" sans restructurer le DOM.

**Affordance de découverte :**
- Déclenchée **après** `loading === false` au premier chargement
- Animation CSS keyframe : glisse 12px vers la droite puis revient
- Mémorisée via `localStorage` — guard SSR obligatoire :
  ```javascript
  if (typeof localStorage !== 'undefined' && !localStorage.getItem('budget-swipe-hint-shown')) {
    localStorage.setItem('budget-swipe-hint-shown', '1')
    // déclencher animation
  }
  ```

---

## 3. Graphiques agrandissables (bouton ⛶ explicite)

**Priorité :** moyenne

**Périmètre : page Budget uniquement** (`PieChart` + `LineChart`) — le `BarChart` du dashboard est exclu (vue résumé, redirige vers `/budget`).

**Alternative dashboard :** rendre la card `BarChart` cliquable (lien vers `/budget`) avec un label "Voir le budget →".

### 3a. Composants chart — prop `fullscreen`

Après migration Svelte 5 (étape 1), ajouter :

```svelte
<script>
  let { data, fullscreen = false, onclose, period = 6 } = $props()
  // $derived() pour les calculs réactifs
</script>

<div
  class="chart-wrapper"
  class:fullscreen
  role={fullscreen ? 'dialog' : undefined}
  aria-modal={fullscreen ? 'true' : undefined}
  aria-label={fullscreen ? 'Graphique en plein écran' : undefined}
>
  {#if fullscreen}
    <button class="close-btn" onclick={onclose} aria-label="Fermer">✕</button>
  {/if}
  <!-- SVG inchangé -->
</div>

<style>
  .chart-wrapper.fullscreen {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  /* PieChart : lever le max-width en fullscreen */
  .chart-wrapper.fullscreen :global(svg) {
    max-width: none;
    width: 100%;
  }
  .close-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: var(--radius);
    padding: 8px 12px;
    cursor: pointer;
    font-size: 1rem;
  }
</style>
```

### 3b. `budget/+page.svelte` — état fullscreen

```javascript
let fullscreenChart = $state(null) // 'pie' | 'line' | null

$effect(() => {
  // Bloquer le scroll du body en fullscreen (iOS Safari)
  document.body.style.overflow = fullscreenChart ? 'hidden' : ''
  return () => { document.body.style.overflow = '' }
})

$effect(() => {
  // Fermeture via Escape (accessibilité clavier, tablettes)
  if (!fullscreenChart) return
  const onKey = (e) => { if (e.key === 'Escape') fullscreenChart = null }
  document.addEventListener('keydown', onKey)
  return () => document.removeEventListener('keydown', onKey)
})
```

```svelte
<!-- Bouton ⛶ mobile uniquement, sur chaque card graphique -->
<div class="card">
  <button class="expand-btn" onclick={() => fullscreenChart = 'pie'} aria-label="Agrandir le graphique">⛶</button>
  <PieChart {data} fullscreen={fullscreenChart === 'pie'} onclose={() => fullscreenChart = null} />
</div>

<style>
  .expand-btn { display: none }
  @media (max-width: 767px) {
    .expand-btn { display: block; /* ... */ }
  }
</style>
```

**Note accessibilité :** `role="dialog"` + `aria-modal` est suffisant pour axe-core. Un focus trap complet est hors scope v1. Les tests `accessibility.spec.ts` scannent les pages en état normal (fullscreen fermé) — pas de régression attendue.

---

## 4. Tests E2E

### 4a. Tests swipe : pas de test E2E dédié

**Décision (tech-lead) :** Le swipe appelle la même fonction `changeMonth()` que les boutons ← →, déjà couverte par `budget.spec.ts`. Un test E2E du swipe via CDPSession serait fragile et couplé à l'implémentation interne. ROI insuffisant.

**Couverture indirecte :** Les tests boutons existants couvrent la logique. Le swipe est un alias gestuel non critique à tester en E2E.

### 4b. Tests fullscreen (`e2e/charts.spec.ts`)

```typescript
test.describe('Charts - Fullscreen', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('pie-chart-expand-and-close', async ({ page }) => {
    // Setup : créer une dépense pour avoir des données PieChart
    await page.goto('/budget')
    await page.click('[aria-label="Agrandir le graphique"]') // bouton ⛶ PieChart
    await expect(page.locator('[data-testid="pie-chart"][role="dialog"]')).toBeVisible()
    await page.click('[aria-label="Fermer"]')
    await expect(page.locator('[data-testid="pie-chart"][role="dialog"]')).not.toBeVisible()
  })

  test('line-chart-expand-and-close', async ({ page }) => {
    // Setup : définir un budget pour avoir des données LineChart
    await page.goto('/budget')
    await page.click('[aria-label="Agrandir le graphique"]') // bouton ⛶ LineChart
    await expect(page.locator('[data-testid="line-chart"][role="dialog"]')).toBeVisible()
    await page.keyboard.press('Escape') // fermeture via Escape
    await expect(page.locator('[data-testid="line-chart"][role="dialog"]')).not.toBeVisible()
  })
})
```

---

## Ordre d'exécution

```
Étape 1 : Migration Svelte 5 des 3 composants chart (LineChart, BarChart, PieChart)
    ↓
Étape 2 : Créer src/lib/swipe.js
    ↓
Étape 3 : Intégrer swipe dans budget/+page.svelte (sur .month-nav)
    ↓
Étape 4 : Ajouter prop fullscreen aux composants PieChart et LineChart
    ↓
Étape 5 : Intégrer boutons ⛶/✕ + état fullscreen dans budget/+page.svelte
    ↓
Étape 6 : Rendre la card BarChart du dashboard cliquable (lien vers /budget)
    ↓
Étape 7 : Tests E2E fullscreen dans charts.spec.ts
```

---

## Récapitulatif des décisions

| Sujet | Décision | Justifié par |
|-------|----------|--------------|
| ⛶ sur BarChart dashboard | ❌ Non — lien vers /budget à la place | UX : dashboard = vue résumé |
| Cible translateX swipe | `.month-nav` + `rotate(0.05deg)` | UX : évite les inputs ; feedback suffisant avec rotation |
| Ratio scroll vs swipe | `\|deltaX\| < \|deltaY\| * 0.5` (angle < 27°) | Tech-lead : plus strict que 0.8 |
| touchcancel | Géré — reset touchStartX/Y | Tech-lead : appel entrant |
| passive: true | Via `addEventListener` dans `onMount` | Tech-lead : perf scroll |
| retour visuel drag | `handleTouchMove` → `dragOffset` state | Tech-lead : nécessaire pour translateX temps réel |
| overflow: hidden fullscreen | `$effect` sur `document.body.style.overflow` | Tech-lead : iOS Safari |
| Escape key fullscreen | `$effect` + `keydown` listener | Tech-lead : accessibilité |
| role="dialog" fullscreen | Oui | Tech-lead : axe-core |
| Migration Svelte 5 charts | Complète (`$props`, `$derived`) | Tech-lead : cohérence, évite mélange syntaxes |
| Tests swipe E2E | ❌ Pas de test dédié | Tech-lead : logique déjà couverte, CDPSession fragile |
| Tests fullscreen E2E | ✅ Via click bouton + Escape | Tech-lead + PM |
| Guard loading swipe | `if (loading) return` | PM : évite appels concurrents |
| Guard localStorage | `typeof localStorage !== 'undefined'` | Tech-lead : SSR safety |
