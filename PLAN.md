# PLAN — appli « Notes » (v1)

## Avancement
- [x] 0. Mise en place (git, Vite, Vitest, dépendances)
- [x] 1. Notes + éditeur (créer, ouvrir, renommer, supprimer, Édition/Lecture, sauvegarde auto)
- [x] 2. Liens [[ ]] + backlinks (+ tests)
- [x] 3. Vue graphe
- [x] 4. Mobile / PWA (hors connexion, écran d'accueil)
- [x] 5. Export / import .md (zip)
- [x] 6. Mise en ligne (GitHub Pages) + README

---


## Contexte
Tu veux une appli de prise de notes inspirée d'Obsidian, utilisable sur ton Mac et ton **iPhone**, gratuite, simple à maintenir pour un débutant. Le dossier `~/Documents/notes-app` est vide. Node.js (v24) et git sont déjà installés sur ton Mac. Tes réponses : iPhone, tu as déjà un compte GitHub, bouton **Édition / Lecture** (comme Obsidian), nom de l'appli : **Notes**.

## Technologies choisies (une phrase chacune)
- **HTML + CSS + JavaScript « simple » (sans framework type React)** : moins de choses à apprendre et à casser, largement suffisant pour cette taille d'appli.
- **Vite** (outil de dév) : lance l'appli en local avec rechargement automatique et prépare la version en ligne en une commande.
- **marked** : transforme le Markdown en page formatée (titres, gras, listes, cases à cocher) ; c'est la bibliothèque la plus utilisée pour ça.
- **DOMPurify** : nettoie le HTML produit pour qu'une note importée ne puisse pas exécuter de code piégé.
- **idb-keyval** : minuscule outil pour enregistrer les notes dans IndexedDB, la « base de données » du navigateur (plus fiable et plus grande que localStorage, surtout sur iPhone).
- **force-graph** : dessine le graphe (points + traits) avec zoom, déplacement et clic déjà intégrés — c'est le même style de rendu que le graphe d'Obsidian.
- **fflate** : crée et lit les fichiers .zip pour exporter/importer toutes les notes d'un coup.
- **vite-plugin-pwa** : génère automatiquement ce qu'il faut pour que l'appli marche hors connexion et s'installe sur l'écran d'accueil.
- **Vitest** : lance les tests automatiques (détection des liens, backlinks).
- **GitHub Pages + GitHub Actions** : hébergement gratuit ; à chaque envoi du code sur GitHub, l'appli se met à jour en ligne toute seule.
- L'éditeur est une simple zone de texte (`<textarea>`) : c'est ce qui marche le mieux au clavier de l'iPhone.

**Avant chaque installation je te dirai en une phrase ce que c'est.** Installations prévues : les paquets npm ci-dessus (dans le dossier du projet uniquement, rien de global), et l'outil **GitHub CLI (`gh`)** au moment de la mise en ligne, pour te connecter à GitHub via ton navigateur sans manipuler de mot de passe/jeton à la main.

## Fonctionnement (choix faits à ta place)
- Une note = `{ id, titre, contenu, modifiéLe }`. Le titre sert de nom de fichier à l'export (`Titre.md`), comme dans Obsidian.
- Liens `[[Note]]`, `[[Note|texte]]`, `[[Note#section]]` (la section est ignorée en v1). Correspondance insensible à la casse, comme Obsidian. Les liens dans les blocs de code ne comptent pas.
- Cliquer un lien vers une note absente → la note est créée et ouverte. Dans le graphe, les notes absentes apparaissent en gris.
- **Renommer** une note met à jour automatiquement les `[[liens]]` qui pointaient vers elle.
- Supprimer demande une confirmation.
- Les cases à cocher sont cliquables en mode Lecture (ça modifie le texte de la note).
- Sauvegarde automatique ~0,5 s après la dernière frappe.
- Navigation par adresse (`#/note/Nom`, `#/graphe`) : le bouton « retour » du téléphone marche.
- Sur téléphone : la liste des notes devient un menu qui glisse, boutons assez grands pour le doigt.
- Sur iPhone, je demande au navigateur de garder les données de façon « persistante ». ⚠️ Safari peut effacer les données d'un site non installé après 7 jours sans visite : **installe l'appli sur l'écran d'accueil** et fais des exports réguliers (je l'écrirai dans le README).

## Structure des fichiers
```
notes-app/
├── index.html              page unique de l'appli
├── package.json            liste des dépendances et commandes (dev, build, test)
├── vite.config.js          réglages Vite + PWA (nom, icônes, hors connexion)
├── PLAN.md  README.md
├── public/                 icônes (iPhone + Android), générées par un petit script
├── scripts/make-icons.mjs  script qui fabrique les icônes PNG
├── src/
│   ├── main.js             démarrage + navigation entre les écrans
│   ├── style.css
│   ├── core/               logique pure, sans affichage → facile à tester
│   │   ├── links.js        trouve les [[liens]], calcule backlinks et graphe
│   │   ├── markdown.js     Markdown → HTML (marked + liens + DOMPurify)
│   │   └── notes.js        créer / renommer (avec mise à jour des liens) / supprimer
│   ├── storage/            ← le seul endroit qui sait OÙ sont rangées les notes
│   │   ├── store.js        interface commune : list, get, put, remove, onChange
│   │   └── local.js        implémentation IndexedDB (idb-keyval)
│   ├── io/zip.js           export .zip / import .md ou .zip
│   └── ui/                 sidebar.js, editor.js, backlinks.js, graph.js
├── tests/                  links.test.js, notes.test.js, zip.test.js
└── .github/workflows/deploy.yml   mise en ligne automatique
```
**Pourquoi c'est prêt pour la synchro :** tout le reste de l'appli passe par `storage/store.js`. Pour la v2, on ajoutera un `storage/sync-xxx.js` sans toucher à l'éditeur ni au graphe. Chaque note a déjà un `id` stable et une date `modifiéLe`, indispensables pour savoir quelle version est la plus récente.

## Étapes (un commit git à chaque étape)
0. `git init`, `package.json`, Vite, Vitest, `.gitignore`, `PLAN.md` → commit
1. **Notes + éditeur** : liste, créer, ouvrir, renommer, supprimer, Édition/Lecture, sauvegarde auto → commit
2. **Liens + backlinks** : `core/links.js` + tests, liens cliquables, création au clic, panneau « Mentions liées », renommage qui suit → commit
3. **Vue graphe** : force-graph, zoom/déplacement/clic → commit
4. **Mobile / PWA** : mise en page téléphone, icônes, manifest, hors connexion → commit
5. **Export / import** : bouton Exporter (.zip de fichiers .md) et Importer (.md multiples ou .zip ; en cas de titre déjà existant, la note importée remplace l'ancienne après confirmation) → commit
6. **Mise en ligne** : workflow GitHub Pages, installation de `gh`, création du dépôt (public — obligatoire pour Pages gratuit ; **seul le code est public, tes notes restent sur tes appareils**), README → commit + push

Je coche chaque étape dans `PLAN.md` au fur et à mesure.

## Vérification (à chaque étape)
- **Tests** (`npm test`) sur : lien simple, lien avec `|`, plusieurs liens dans une note, lien vers une note inexistante, note sans lien, + backlinks, casse, doublons, liens dans du code, renommage. Je corrige jusqu'à 100 % vert et je te montre le résultat.
- **Build** (`npm run build`) sans erreur.
- **Captures d'écran** : j'ai un outil de pilotage de Chrome (Chrome DevTools) ; j'ouvre l'appli, je fais des captures en taille PC (1280×800) et iPhone (390×844), je clique dans l'appli (créer note, lien, graphe), et je corrige ce qui s'affiche mal. Je vérifie aussi le mode hors connexion en coupant le réseau dans l'outil. Si l'outil ne marche pas, je te le dis et je te donne la liste à vérifier toi-même.
- **Limite honnête** : je ne peux pas tester sur un vrai iPhone/Safari. Je te donnerai une courte liste à vérifier sur ton téléphone après la mise en ligne (installation, hors connexion, export).

## Synchro (v2) — options gratuites, non codées
| Option | Principe | ✅ Avantages | ❌ Inconvénients |
|---|---|---|---|
| **A. Dépôt GitHub privé** (recommandé) | L'appli lit/écrit tes notes comme fichiers `.md` dans un dépôt GitHub privé via l'API | Gratuit, historique de toutes les versions, les fichiers s'ouvrent directement dans le vrai Obsidian, pas de nouveau compte | Il faut coller un « jeton » GitHub dans l'appli sur chaque appareil ; synchro « à la demande » (pas instantanée) ; conflits à gérer si on modifie la même note sur 2 appareils hors ligne |
| **B. Supabase** | Base de données en ligne + connexion par e-mail | Vraie connexion utilisateur, synchro quasi instantanée, offre gratuite généreuse | Nouveau compte et nouvel outil à apprendre ; le projet gratuit se met en pause après 1 semaine sans utilisation ; notes stockées en base, pas en fichiers .md |
| **C. Firebase (Firestore)** | Base de données Google avec mode hors ligne intégré | La synchro et le hors-ligne sont gérés pour toi, très peu de code | Dépendance à Google ; données pas en fichiers .md ; règles de sécurité à bien configurer |

Mon conseil pour plus tard : **A**, parce que tes notes restent de simples fichiers compatibles Obsidian et que tu as déjà un compte GitHub.

## Ce qui sera hors périmètre en v1
Synchro, comptes, recherche, tags, plugins, thèmes, sections `#titre` dans les liens (ignorées), images/pièces jointes.
