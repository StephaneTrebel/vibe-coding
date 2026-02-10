# Guide de Déploiement - Mon Budget

## Déploiement sur GitHub Pages

### Étape 1 : Créer le repository GitHub

Si ce n'est pas déjà fait :

```bash
# Créer un nouveau repo sur GitHub (via l'interface web)
# Puis configurer le remote local :
git remote add origin https://github.com/VOTRE-USERNAME/vibe-coding.git
```

### Étape 2 : Activer GitHub Pages

1. Aller dans **Settings** du repository
2. Dans le menu de gauche, cliquer sur **Pages**
3. Dans **Source**, sélectionner **GitHub Actions**

![GitHub Pages Settings](https://docs.github.com/assets/cb-47267/images/help/pages/publishing-source-drop-down.png)

### Étape 3 : Pousser le code

```bash
git push -u origin trunk
```

Le workflow GitHub Actions se lancera automatiquement et déploiera l'application.

### Étape 4 : Vérifier le déploiement

1. Aller dans l'onglet **Actions** du repository
2. Vérifier que le workflow "Deploy to GitHub Pages" s'est exécuté avec succès
3. L'application sera disponible sur : `https://VOTRE-USERNAME.github.io/vibe-coding/`

⏱️ Le premier déploiement peut prendre 2-3 minutes.

## Configuration avancée

### Changer le nom du repository

Si vous renommez le repository, le base path changera automatiquement car il utilise `${{ github.event.repository.name }}`.

### Repository personnel (username.github.io)

Si vous utilisez un repository nommé `username.github.io`, l'URL sera `https://username.github.io/` sans base path.

Pour supprimer le base path, modifiez `.github/workflows/deploy.yml` :

```yaml
- name: Build
  working-directory: ./frontend
  # Supprimer ou commenter la ligne env:
  # env:
  #   BASE_PATH: /${{ github.event.repository.name }}
  run: npm run build
```

### Domaine personnalisé

1. Dans **Settings → Pages**, entrer votre domaine dans **Custom domain**
2. Configurer un enregistrement DNS CNAME pointant vers `username.github.io`
3. Supprimer le BASE_PATH dans le workflow (comme ci-dessus)

### Hébergement statique générique

1. Build l'application :
   ```bash
   cd frontend
   npm run build
   ```

2. Déployer le contenu du dossier `frontend/build/` sur votre hébergeur

## Mise à jour

Chaque push sur la branche `trunk` déclenchera automatiquement un nouveau déploiement.

```bash
git add .
git commit -m "Update application"
git push origin trunk
```

## Dépannage

### Le workflow échoue

Vérifier les logs dans l'onglet Actions. Problèmes courants :
- Permissions insuffisantes : vérifier que **Settings → Actions → General → Workflow permissions** est configuré sur "Read and write permissions"
- Erreur de build : tester localement avec `npm run build`

### Page 404 après déploiement

- Vérifier que GitHub Pages est activé dans les settings
- Attendre quelques minutes (propagation DNS)
- Vérifier l'URL dans **Settings → Pages**

### Les ressources ne se chargent pas

Si les ressources (CSS, JS) ne se chargent pas :
- Vérifier que le BASE_PATH correspond au nom du repository
- Tester le build localement : `BASE_PATH=/nom-du-repo npm run build`

### Service Worker ne fonctionne pas

Le Service Worker nécessite HTTPS. GitHub Pages fournit automatiquement HTTPS, donc il devrait fonctionner. Pour tester localement :

```bash
npm run preview
```

Puis ouvrir les DevTools → Application → Service Workers pour vérifier.
