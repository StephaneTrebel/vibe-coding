# TODO — UX Mobile (à venir)

## 1. Swipe budget pour changer de mois

**Priorité :** moyenne

**Description :**  
Sur mobile, permettre de passer d'un mois à l'autre en swipant horizontalement sur la page Budget, en plus des boutons ← / →.

**Détails techniques :**
- Réutiliser (ou extraire depuis le Sprint 2) le pattern `touchstart` / `touchend` avec seuil de déclenchement (~50px)
- Swipe gauche → mois suivant, swipe droite → mois précédent
- Appliquer sur le conteneur principal de la page, pas uniquement sur la barre de navigation mensuelle
- Ajouter un retour visuel léger (légère translation CSS pendant le swipe ?)
- Créer `src/lib/swipe.js` si pas encore existant (prévu dans le Sprint 2 initial mais reporté)

**Tests E2E :**
- Simuler `touchstart` / `touchend` avec Playwright sur viewport mobile (375×667)
- Vérifier que le mois change après un swipe valide
- Vérifier qu'un swipe trop court (< seuil) ne change pas de mois

---

## 2. Graphiques en plein écran en mode paysage

**Priorité :** moyenne

**Description :**  
Quand l'utilisateur bascule en mode paysage sur mobile, les graphiques (BarChart, PieChart, LineChart) s'affichent en plein écran pour maximiser la lisibilité.

**Détails techniques :**
- Utiliser `@media (orientation: landscape) and (max-height: 500px)` pour cibler les mobiles en paysage (éviter de toucher les desktops en fenêtre large)
- Les cards contenant les graphiques passent en `position: fixed; inset: 0; z-index: 200` avec un fond `var(--bg)`
- Un bouton de fermeture (✕) permet de sortir du mode plein écran
- Alternative plus simple : Media query CSS pure sur les composants chart (`width: 100vw; height: 100vh`) sans JS
- Les SVG utilisent déjà `width="100%"` et un `viewBox` fixe — ils s'adapteront naturellement

**Tests E2E :**
- Tester avec un viewport paysage mobile (667×375) dans un groupe `test.use({ viewport: ... })`
- Vérifier que le conteneur du graphique occupe toute la largeur disponible
