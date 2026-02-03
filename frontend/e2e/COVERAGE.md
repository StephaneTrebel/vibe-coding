# Couverture E2E - Mon Budget

## Tests existants (16)

### Dashboard (4 tests)

| Test | Scénario |
|------|----------|
| `display-total-stats` | Crée 1 revenu et 1 dépense, vérifie l'historique total |
| `display-recent-transactions` | Crée 2 transactions, vérifie leur affichage dans les transactions récentes |
| `empty-state` | Vérifie le message "Aucune transaction" sans données |
| `link-to-transactions` | Clique "Voir tout", vérifie la navigation vers /transactions |

### Transactions (2 tests)

| Test | Scénario |
|------|----------|
| `display-empty-state` | Vérifie le message "Aucune transaction" sans données |
| `categories-change-with-type` | Vérifie que les catégories changent entre dépense et revenu |

### Budget (7 tests)

| Test | Scénario |
|------|----------|
| `display-current-month` | Vérifie l'affichage du mois courant en français |
| `set-budget` | Définit un budget et vérifie l'affichage |
| `display-spent-amount` | Budget + 2 dépenses, vérifie le montant dépensé |
| `display-remaining` | Budget + 1 dépense, vérifie le montant restant |
| `progress-bar-normal` | Dépense à 50%, vérifie l'absence de warning/danger |
| `progress-bar-warning` | Dépense à 80%, vérifie la classe warning et le message d'alerte |
| `progress-bar-danger` | Dépense à 120%, vérifie le message de dépassement |

### Goals (1 test)

| Test | Scénario |
|------|----------|
| `display-empty-state` | Vérifie le message "Aucun objectif d'épargne" sans données |

### Integration (2 tests)

| Test | Scénario |
|------|----------|
| `expense-affects-budget` | Budget + dépense, vérifie la propagation vers la page budget |
| `multiple-transactions-cumulative` | 4 transactions mixtes, vérifie le solde et les totaux sur le dashboard |

---

## Tests manquants

### Transactions - CRUD

| Scénario | Description |
|----------|-------------|
| Créer une dépense | Remplir le formulaire (type=expense), soumettre. Vérifier le badge "depense", le montant avec préfixe "-", le style rouge, la catégorie et la date formatée. |
| Créer un revenu | Remplir le formulaire (type=income), soumettre. Vérifier le badge "revenu", le montant avec préfixe "+", le style vert. |
| Créer avec description | Ajouter une transaction avec description. Vérifier que le texte de description apparaît. |
| Créer sans description | Ajouter une transaction sans description. Vérifier qu'aucun élément `.tx-description` n'est rendu. |
| Modifier une transaction (pré-remplissage) | Créer une transaction, cliquer "Modifier". Vérifier le pré-remplissage du formulaire, le titre "Modifier la transaction" et le bouton "Modifier". |
| Modifier une transaction (soumission) | Modifier le montant et la catégorie, soumettre. Vérifier la mise à jour dans la liste. |
| Annuler une modification | Cliquer "Modifier" puis "Annuler". Vérifier que le formulaire se ferme et la transaction est inchangée. |
| Supprimer une transaction | Cliquer "Supprimer", accepter la confirmation. Vérifier la disparition. Si dernière transaction, vérifier le retour à l'état vide. |
| Toggle du formulaire | Cliquer "Ajouter" pour ouvrir, vérifier l'apparition. Cliquer "Annuler" pour fermer, vérifier la disparition. |
| Reset du formulaire après soumission | Soumettre une transaction, vérifier que le formulaire se ferme et les champs reviennent aux valeurs par défaut. |
| Affichage de plusieurs transactions | Créer 3+ transactions, vérifier que toutes apparaissent avec les bonnes infos. |

### Goals - CRUD et progression

| Scénario | Description |
|----------|-------------|
| Créer un objectif | Remplir nom et montant cible, soumettre. Vérifier la carte : nom, montant cible, montant courant à 0, barre à 0%, texte "0% atteint". |
| Toggle du formulaire | Cliquer "Nouvel objectif" / "Annuler", vérifier l'ouverture et la fermeture. |
| Reset du formulaire après création | Créer un objectif, rouvrir le formulaire. Vérifier que les champs sont vides. |
| Incrémenter +1 | Objectif cible 100, cliquer "+1". Vérifier montant courant à 1, barre à 1%. |
| Incrémenter +10 | Objectif cible 100, cliquer "+10". Vérifier montant courant à 10, barre à 10%. |
| Décrémenter -1 | Ajouter de la progression, cliquer "-1". Vérifier la diminution. |
| Décrémenter -10 | Ajouter de la progression, cliquer "-10". Vérifier la diminution. |
| Plancher à zéro | Montant courant à 0, cliquer "-1" ou "-10". Vérifier que ça reste à 0. |
| Atteindre un objectif | Objectif cible 10, cliquer "+10". Vérifier le badge "Atteint !", la bordure verte (`.achieved`), la barre verte (`.complete`). |
| Boutons masqués après atteinte | Atteindre un objectif. Vérifier que les boutons +1/+10/-1/-10 disparaissent. Le bouton "Supprimer" reste visible. |
| Supprimer un objectif | Cliquer "Supprimer", accepter. Vérifier la disparition. Si dernier objectif, vérifier le retour à l'état vide. |
| Plusieurs objectifs | Créer 2-3 objectifs, vérifier l'affichage indépendant de chacun. |
| Validation : nom vide | Soumettre sans nom. Vérifier le message d'erreur. |
| Validation : montant invalide | Soumettre avec montant vide, 0 ou négatif. Vérifier le message d'erreur. |

### Budget - Navigation et cas limites

| Scénario | Description |
|----------|-------------|
| Navigation mois précédent | Cliquer "Precedent". Vérifier le changement de mois affiché. |
| Navigation mois suivant | Cliquer "Suivant". Vérifier le changement de mois affiché. |
| Indépendance des budgets par mois | Définir un budget pour le mois courant, naviguer au mois précédent. Vérifier qu'aucun budget n'est défini ("Non defini"). Revenir, vérifier que le budget est toujours là. |
| État "Non défini" | Naviguer sur /budget sans budget. Vérifier l'affichage "Non defini" et l'absence de barre de progression. |
| Modifier un budget existant | Définir 500, puis changer à 800. Vérifier la mise à jour. |
| Les revenus ne comptent pas dans le dépensé | Budget + 1 revenu + 1 dépense. Vérifier que seule la dépense apparaît dans "Depense". |
| Dépenses d'autres mois non comptées | Budget pour le mois courant, dépense datée d'un autre mois. Vérifier que le dépensé reste à 0. |
| Budget sans dépenses | Définir un budget, pas de transactions. Vérifier dépensé = 0, restant = budget, barre à 0%. |

### Dashboard - Affichage et styles

| Scénario | Description |
|----------|-------------|
| Solde positif (style vert) | Revenus > dépenses. Vérifier la classe `.positive` sur le solde. |
| Solde négatif (style rouge) | Dépenses > revenus. Vérifier la classe `.negative` sur le solde. |
| Limite à 5 transactions récentes | Créer 7 transactions. Vérifier que seules 5 apparaissent dans "Transactions recentes". |
| Stats mensuelles isolées | Créer des transactions sur 2 mois différents. Vérifier que "Ce mois-ci" ne compte que le mois courant, tandis que "Historique" compte tout. |
| Préfixe "+" et style vert pour les revenus | Vérifier le formatage d'un revenu dans les transactions récentes. |
| Préfixe "-" et style rouge pour les dépenses | Vérifier le formatage d'une dépense dans les transactions récentes. |

### Integration - Propagation des modifications

| Scénario | Description |
|----------|-------------|
| Supprimer une transaction met à jour le dashboard | Créer une transaction, vérifier sur le dashboard. Supprimer, revenir au dashboard, vérifier la mise à jour. |
| Modifier une transaction met à jour le budget | Budget + dépense de 100. Modifier la dépense à 200. Vérifier la mise à jour du budget. |
| Supprimer une transaction met à jour le budget | Budget + dépense. Supprimer la dépense. Vérifier que le dépensé revient à 0. |
| Les revenus n'affectent pas le budget | Budget + revenu. Vérifier que le dépensé reste à 0. |

### Navigation

| Scénario | Description |
|----------|-------------|
| Navbar visible sur toutes les pages | Vérifier que la navbar avec les 4 liens est présente sur /, /transactions, /budget, /goals. |
| Navigation via la navbar | Depuis le dashboard, cliquer chaque lien de la navbar. Vérifier l'URL et le titre h1 de chaque page. |
