# Exigences non fonctionnelles - Mon Budget

## Offline

| Exigence | Description | Testable E2E |
|----------|-------------|:------------:|
| Fonctionnement hors-ligne | L'application est utilisable sans connexion réseau après la première visite | Oui |
| Service worker actif | Le service worker est enregistré et sert les assets depuis le cache | Oui |
| Cache des assets | Tous les fichiers JS, CSS et statiques sont mis en cache au premier chargement | Oui |
| Mise à jour silencieuse | Une nouvelle version de l'app remplace l'ancienne sans intervention utilisateur | Oui |
| Nettoyage des anciens caches | Les caches des versions précédentes sont supprimés à l'activation | Oui |

## Persistance des données

| Exigence | Description | Testable E2E |
|----------|-------------|:------------:|
| Survie au rechargement | Les données (transactions, budgets, objectifs) persistent après un rechargement de page | Oui |
| Survie à la fermeture | Les données persistent après fermeture et réouverture du navigateur | Difficile |
| Indépendance des données | Chaque utilisateur/navigateur a ses propres données isolées | Implicite |
| Intégrité des données | Pas de corruption après des opérations CRUD rapides successives | Oui |

## PWA / Installabilité

| Exigence | Description | Testable E2E |
|----------|-------------|:------------:|
| Manifest valide | Le fichier manifest.json est présent, avec nom, icônes, couleurs et display:standalone | Oui |
| Icônes PWA | Les icônes 192x192 et 512x512 sont présentes et accessibles | Oui |
| Meta tags | theme-color, apple-mobile-web-app-capable et apple-touch-icon sont définis dans le HTML | Oui |
| Installabilité | L'application remplit les critères d'installation PWA (manifest + service worker + HTTPS) | Manuel |

## Performance

| Exigence | Description | Testable E2E |
|----------|-------------|:------------:|
| Chargement initial | La page se charge en moins de 3 secondes sur une connexion standard | Oui |
| Réactivité UI | Les interactions (ajout, modification, suppression) répondent en moins de 500ms | Oui |
| Taille du bundle | Le bundle JS total reste sous un seuil raisonnable (< 500 Ko gzippé) | Build |
| Pas de requête réseau pour les données | Aucun appel réseau n'est effectué pour lire ou écrire des données (tout est IndexedDB) | Oui |

## Responsive / Mobile

| Exigence | Description | Testable E2E |
|----------|-------------|:------------:|
| Lisibilité mobile | L'interface est lisible et utilisable sur un écran 375px de large (iPhone SE) | Oui |
| Navigation mobile | La navbar est accessible et fonctionnelle sur mobile | Oui |
| Formulaires utilisables sur mobile | Les formulaires sont remplissables sans scroll horizontal | Oui |
| Touch targets | Les boutons et liens ont une taille suffisante pour le tactile (min 44x44px) | Oui |

## Accessibilité

| Exigence | Description | Testable E2E |
|----------|-------------|:------------:|
| Labels de formulaires | Tous les champs de formulaire ont un label associé (attribut `for`/`id`) | Oui |
| Navigation clavier | Toutes les fonctionnalités sont accessibles au clavier (tab, entrée) | Oui |
| Contraste des couleurs | Le texte respecte un ratio de contraste suffisant (WCAG AA : 4.5:1) | Oui (axe) |
| Langue de la page | L'attribut `lang="fr"` est défini sur la balise `<html>` | Oui |
| Structure sémantique | Utilisation correcte des balises `<nav>`, `<main>`, `<h1>`-`<h3>`, `<button>` | Oui |
| Textes alternatifs | Les éléments visuels significatifs (icônes, graphiques) ont un texte alternatif | Oui |

## Localisation

| Exigence | Description | Testable E2E |
|----------|-------------|:------------:|
| Interface en français | Tous les textes de l'interface sont en français | Oui |
| Formatage des montants | Les montants sont affichés au format français : 1 234,50 € | Oui |
| Formatage des dates | Les dates sont affichées au format français : 15/03/2024 | Oui |
| Noms des mois | Les mois sont affichés en français : janvier, février, etc. | Oui |
| Pas de texte anglais résiduel | Aucun texte en anglais ne doit apparaître dans l'interface utilisateur | Oui |

## Résilience

| Exigence | Description | Testable E2E |
|----------|-------------|:------------:|
| IndexedDB indisponible | Un message explicite est affiché si IndexedDB n'est pas disponible (navigation privée sur certains navigateurs) | Difficile |
| Erreurs gracieuses | Les erreurs d'accès aux données affichent un message compréhensible, pas un crash | Oui |
| Données volumineuses | L'application reste performante avec 500+ transactions | Oui |
| Entrées invalides | Les formulaires rejettent les entrées invalides (montants négatifs, champs vides) avec des messages clairs | Oui |
