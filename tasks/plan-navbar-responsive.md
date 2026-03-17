# Transformation : Navbar Responsive avec Menu Hamburger

## Contexte

L'application "Mon Budget" fonctionne correctement sur desktop mais présente des problèmes d'affichage sur mobile :
- Le logo "Mon Budget" et le lien "Tableau de bord" se chevauchent
- Le menu déborde à droite (scrolling horizontal nécessaire)
- Le lien "Objectifs" est hors écran sur mobile

**Capture du problème** : `captures/2026-02-10_21-16.png`

---

## Objectif

Implémenter un menu hamburger responsive pour une meilleure expérience mobile :
- **Mobile (< 768px)** : Menu hamburger avec overlay
- **Desktop (≥ 768px)** : Navbar horizontale actuelle (inchangée)

---

## Décisions Techniques

### Approche : Menu Hamburger avec Overlay

**Pourquoi ?**
- UX mobile standard (pattern universel)
- Extensible (supporte l'ajout de liens futurs)
- Propre et professionnel
- Ne change rien sur desktop

### Spécifications UX

**Mobile (< 768px)** : Hamburger + overlay slide-in depuis le haut  
**Desktop (≥ 768px)** : Navbar horizontale classique

### Comportements

1. Clic hamburger → ouvre menu avec animation
2. Clic overlay → ferme menu
3. Clic lien → navigation + fermeture auto
4. Animation : slide-in `0.3s ease-in-out`

---

## Plan d'Implémentation

**Fichier** : `frontend/src/routes/+layout.svelte`

### 1. Script
```svelte
let menuOpen = false;
function toggleMenu() { menuOpen = !menuOpen; }
```

### 2. HTML
- Bouton hamburger (3 spans)
- `class:open={menuOpen}` sur menu et hamburger
- `on:click={toggleMenu}` sur liens et overlay
- Overlay conditionnel `{#if menuOpen}`

### 3. CSS
- Base (desktop) : inchangé
- Hamburger : `display: none` par défaut, 3 barres → X animé
- Media query `@media (max-width: 767px)` :
  - Hamburger : `display: flex`
  - Menu : `position: fixed`, vertical, slide-in
  - Overlay : `rgba(0,0,0,0.5)`, full-screen

---

## Tests

**Breakpoints** : 320px, 375px, 414px, 768px, 1024px, 1280px

**Checklist** :
- [ ] Desktop : navbar horizontale, pas de hamburger
- [ ] Mobile : hamburger visible, menu fermé par défaut
- [ ] Clic hamburger : menu s'ouvre avec animation
- [ ] Hamburger devient X quand ouvert
- [ ] Clic overlay : ferme menu
- [ ] Clic lien : navigation + fermeture
- [ ] Pas de scroll horizontal

---

## Commit

```
feat: add responsive hamburger menu for mobile

- Add hamburger button (mobile only, < 768px)
- Implement overlay menu with slide-in animation
- Menu auto-closes on link click
- Desktop layout unchanged (≥ 768px)
- Fixes mobile navigation overflow issue
```

---

## Estimation

- **~70 lignes** (5 JS, 15 HTML, 50 CSS)
- **15-20 minutes**
- **Complexité** : Faible

---

## Statut

- [x] Plan écrit
- [ ] Implémentation
- [ ] Tests manuels
- [ ] Commit & push
- [ ] Vérifié sur GitHub Pages

**Date** : 10 février 2025  
**Priorité** : Haute (UX mobile cassée)
