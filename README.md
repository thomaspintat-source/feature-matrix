# SDK Feature Matrix — site (GitHub Pages)

Page web du tableau de support des features du SDK Octopus.

**Mode manuel** : les données vivent dans `octo-features.json`. Quand la matrice change, on régénère ce fichier puis on le pousse — la page hébergée se met à jour aussitôt. (Pas de sync auto : ça demanderait un token d'intégration Notion réservé aux owners du workspace.)

## Contenu du repo

```
index.html          → la page (rendu final, charge octo-features.json)
octo-features.json  → les données (features + versions + date)
.nojekyll           → sert les fichiers tels quels sur Pages
```

## Mise en ligne (une seule fois)

1. Pousser ce repo (déjà fait si tu lis ça depuis GitHub).
2. **Settings → Pages** → *Source* : **Deploy from a branch** → branche **main**, dossier **/ (root)** → Save.
3. GitHub affiche l'URL publique (ex. `https://thomaspintat-source.github.io/feature-matrix/`).
4. Dans Notion, taper `/embed` et coller cette URL pour afficher la page dans la doc.

## Mettre à jour la matrice

Deux façons :

**A. Via Claude (recommandé)** — tu dis ce qui change (« passe Fonts en ✅ sur Flutter », « Android passe en 1.13.0 », etc.), Claude régénère `octo-features.json`, puis :
```bash
git add octo-features.json && git commit -m "update matrix" && git push
```

**B. À la main** — `octo-features.json` est lisible : édite la valeur voulue puis commit/push.

### Format des données

```json
{
  "updatedAt": "2026-06-03",
  "versions": { "Android": "1.12.0", "iOS": "1.12.0", "React Native": "1.9.3", "Flutter": "1.11.0", "Unity 3D": "1.10.1" },
  "features": [
    {
      "category": "Core Capabilities",
      "feature": "SSO Authentication",
      "description": "Login, Signup, User Mgmt",
      "platforms": { "Android": "ok", "iOS": "ok", "React Native": "ok", "Flutter": "ok", "Unity 3D": "ok" },
      "note": ""
    }
  ]
}
```

- Statuts possibles : `"ok"` (✅ Supported), `"warn"` (⚠️ Partially), `"soon"` (🔵 Coming soon), `"no"` (❌ Not supported).
- Catégories (ordre d'affichage) : `Core Capabilities`, `Customization`, `Media`, `Data`, `Miscellaneous`.
- `note` optionnel : ajoute une pastille « i » avec tooltip (utilisée sur Posts with CTA / Unity).

## Note

Si un jour tu obtiens un token d'intégration Notion (rôle owner), on peut rebrancher une sync automatique Notion → JSON. Pour l'instant on reste en manuel, plus simple et sans dépendance.
