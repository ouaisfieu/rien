# Rien (ou presque)

**De quoi la science est-elle sûre à 100 % ?** — site statique de vulgarisation scientifique, en français, pour le grand public.

Réponse courte : au sens strict, de presque rien d'empirique. Réponse utile : d'une quantité immense de choses, à un degré où douter devient déraisonnable. Le site explore cet écart à travers une **échelle de la certitude en neuf niveaux** (du démontré au fragile), et des pages consacrées aux mathématiques, à la physique, aux faits établis, au vivant, à la méthode, aux erreurs et aux frontières de la connaissance.

- En ligne : <https://ouaisfieu.github.io/rien/>
- Textes : rédigés par Claude (IA, Anthropic) pour un éditeur anonyme — voir la page « À propos ».
- Licence des textes : [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fr)

## Mise en ligne (GitHub Pages)

Le site généré est **déjà présent dans `docs/`**. Il suffit de :

1. pousser le dépôt sur `main` ;
2. dans GitHub : *Settings → Pages → Build and deployment → Source : Deploy from a branch*, branche `main`, dossier `/docs` ;
3. patienter une minute : le site est servi sur `https://ouaisfieu.github.io/rien/`.

Aucune étape de build n'est nécessaire côté GitHub (`docs/.nojekyll` désactive Jekyll).

## Modifier le contenu

Prérequis : Node.js ≥ 18. **Aucune dépendance** à installer pour construire le site.

```bash
npm run build     # régénère docs/ à partir de src/
npm run dev       # build + serveur local sur http://localhost:8080/rien/
```

| Où | Quoi |
| --- | --- |
| `src/site.json` | Nom, URL, chemin de base (`/rien/`), navigation, licence, signature |
| `src/pages/*.html` | Une page = un fichier. En tête, un bloc `---json … ---` (titre, description SEO, niveaux, sujets schema.org…) |
| `src/data/sources.json` | Bibliographie (auteurs, titre, revue, année, DOI/URL) |
| `src/data/glossaire.json` | Glossaire (génère la page et les infobulles) |
| `src/data/echelle.json` | Les neuf niveaux de l'échelle de la certitude |
| `src/assets/` | CSS, JS (amélioration progressive), icônes, images de partage |
| `src/lib/` | Gabarit HTML, JSON-LD, typographie |

### Raccourcis utilisables dans les pages

| Code | Effet |
| --- | --- |
| `{{cite:id}}` ou `{{cite:id1,id2}}` | Appel de note numéroté + liste « Sources de cette page » + `citation` en JSON-LD |
| `{{g:id}}` / `{{g:id\|texte}}` | Lien vers un terme du glossaire, avec définition en infobulle |
| `{{lvl:4}}` / `{{lvl:4\|texte}}` | Pastille de niveau renvoyant à l'échelle |
| `{{link:slug#ancre\|texte}}` | Lien interne vérifié au build (erreur si la page n'existe pas) |
| `{{echelle}}` / `{{echelle:mini}}` | Échelle complète / compacte |
| `{{sigma}}` | Tableau interactif des sigmas |
| `{{faq}}` | Questions fréquentes (depuis le champ `faq` du front matter, + `FAQPage` en JSON-LD) |
| `{{base}}` | Chemin de base du site |

Le build échoue explicitement si une source, un terme de glossaire ou une page interne est introuvable.

### Images de partage

Les images Open Graph (`src/assets/og-*.png`) et les icônes sont déjà générées. Pour les refaire après un changement de titre : `npm i -D playwright sharp && npm run images`.

### Nom de domaine personnalisé

Modifier `origin` et `base` dans `src/site.json` (par ex. `"origin": "https://exemple.org", "base": "/"`), créer un fichier `src/CNAME` contenant le domaine, puis `npm run build`.

## Ce qui est inclus

- **SEO** : titres et descriptions calibrés, URL canoniques, `sitemap.xml`, `robots.txt`, Open Graph et Twitter Cards avec image par page, flux Atom, `llms.txt`.
- **Web sémantique / schema.org** (JSON-LD, un graphe par page) : `WebSite`, `WebPage`, `Article` (auteur, dates, `about` et `mentions` reliés à Wikipédia, `citation` avec DOI), `BreadcrumbList`, `FAQPage`, `ItemList` (échelle), `DefinedTermSet` (glossaire), bibliographie.
- **HTML sémantique** : `header/nav/main/article/aside/footer`, `dfn`, `cite`, `time`, `figure`, fil d'Ariane, sommaire par page.
- **Accessibilité** : lien d'évitement, contrastes AA, navigation clavier, `prefers-reduced-motion`, fonctionne sans JavaScript.
- **Design** : sombre par défaut, vert tendre et lilas, thème clair disponible, polices système (aucune requête tierce).
- **Vie privée** : pas de cookie, pas de traceur, pas de CDN.
