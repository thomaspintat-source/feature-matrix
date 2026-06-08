# SDK Feature Matrix — site auto-hébergé (Notion → GitHub Pages)

Page web du tableau de support des features du SDK Octopus.
**Source de vérité = Notion.** Un GitHub Action relit Notion chaque jour et republie les données ; la page hébergée se met à jour toute seule.

➡️ **Christophe n'a rien à faire.** Tout vit dans ce repo, côté Thomas.

## Contenu du repo

```
index.html            → la page (rendu final, charge octo-features.json)
octo-features.json    → les données (régénérées automatiquement depuis Notion)
sync/sync-notion.mjs  → script Node qui lit Notion et écrit le JSON (aucune dépendance)
.github/workflows/sync.yml → GitHub Action : cron quotidien + bouton "Run workflow"
.nojekyll             → sert les fichiers tels quels sur Pages
```

## Mise en ligne — étapes (une seule fois, ~10 min)

1. **Créer le repo** sur GitHub (ex. `sdk-feature-matrix`, privé ou public) et y pousser ces fichiers :
   ```bash
   git init && git add . && git commit -m "init SDK feature matrix site"
   git branch -M main
   git remote add origin git@github.com:<ton-org>/sdk-feature-matrix.git
   git push -u origin main
   ```

2. **Créer un token d'intégration Notion** (toi, dans Notion — pas Christophe) :
   - notion.so → réglages → **Connections / Integrations** → *New internal integration* → copier le **Internal Integration Secret**.
   - Ouvrir la page **« SDK Feature Matrix »** dans Notion → menu `•••` → **Connections** → ajouter ton intégration (ça partage la page **et** la base avec elle).

3. **Ajouter le token comme secret GitHub** :
   - Repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name : `NOTION_TOKEN` · Value : le secret copié à l'étape 2.

4. **Activer GitHub Pages** :
   - Repo → **Settings → Pages** → *Source* : **Deploy from a branch** → branche **main**, dossier **/ (root)** → Save.
   - GitHub affiche l'URL publique (ex. `https://<ton-org>.github.io/sdk-feature-matrix/`).

5. **Lancer une 1ʳᵉ sync** :
   - Repo → onglet **Actions** → workflow *« Sync SDK Feature Matrix from Notion »* → **Run workflow**.
   - Ça régénère `octo-features.json` depuis Notion. Ensuite c'est automatique tous les jours (06:00 UTC).

6. **Embarquer dans Notion** :
   - Copier l'URL Pages → dans la page Notion taper `/embed` → coller l'URL.

## Au quotidien

- Tu modifies la matrice **dans Notion** (la base + le callout « Platform versions » pour les versions/date).
- La page se met à jour seule sous 24 h. Pour forcer tout de suite : **Actions → Run workflow**.

## Notes

- Le token Notion ne quitte jamais GitHub (secret côté Action). La page publique ne sert que le JSON déjà transformé.
- En ouvrant `index.html` en local (`file://`), le `fetch` du JSON peut être bloqué par le navigateur : la page affiche alors les **données embarquées de secours**. En ligne (Pages) le fetch fonctionne normalement.
- IDs Notion utilisés par le script (modifiables via env `NOTION_DATABASE_ID` / `NOTION_PAGE_ID`) :
  - base : `56a05beab58345f180ab1b8c1497fe6e`
  - page : `2edd0ed811a9804894c5ce4fa4bcf367`
