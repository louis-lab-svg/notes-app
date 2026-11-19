# Notes — comment lancer l'appli

Une appli de prise de notes inspirée d'Obsidian : notes en Markdown, liens `[[entre notes]]`, mentions liées, vue graphe. Elle marche sur Mac et sur iPhone, même sans connexion.

**Adresse en ligne :** https://VOTRE-PSEUDO.github.io/notes-app/

---

## 1. Sur le Mac (le plus simple)

Ouvrez l'adresse en ligne dans Safari ou Chrome. C'est tout.

Pour l'avoir comme une vraie appli dans le Dock :
- **Safari** : menu *Fichier* → *Ajouter au Dock…*
- **Chrome** : icône d'installation (écran avec une flèche) à droite de la barre d'adresse.

## 2. Sur l'iPhone

1. Ouvrez l'adresse en ligne dans **Safari** (pas Chrome, l'installation ne marche qu'avec Safari sur iPhone).
2. Touchez le bouton **Partager** (carré avec une flèche vers le haut).
3. Faites défiler et touchez **« Sur l'écran d'accueil »**, puis **Ajouter**.
4. Ouvrez ensuite toujours l'appli depuis **son icône** sur l'écran d'accueil.

> ⚠️ **Important sur iPhone** : si vous utilisez l'appli dans Safari *sans* l'installer, iOS peut effacer vos notes après 7 jours sans visite. Installée sur l'écran d'accueil, ce n'est pas le cas. Dans tous les cas, **exportez vos notes de temps en temps** (voir plus bas).

## 3. Utiliser l'appli

| Je veux… | Je fais… |
|---|---|
| Créer une note | **+ Nouvelle note** (sur iPhone : bouton ☰ en haut à gauche pour ouvrir le menu) |
| Renommer | Je touche le titre en haut de la note et je le modifie. Les liens des autres notes suivent automatiquement. |
| Écrire / voir le résultat | Boutons **Édition** et **Lecture** |
| Lier deux notes | J'écris `[[Nom de la note]]` ou `[[Nom de la note\|texte affiché]]`. En mode **Lecture**, je touche le lien pour ouvrir la note (elle est créée si elle n'existe pas). |
| Voir qui pointe vers ma note | Section **Mentions liées** en bas de la note |
| Voir le graphe | Bouton **Graphe**. Pincer/molette pour zoomer, glisser pour se déplacer, toucher un point pour ouvrir la note. |
| Cocher une tâche | J'écris `- [ ] ma tâche`, puis en mode **Lecture** je touche la case. |
| Supprimer | Bouton **Supprimer** (une confirmation est demandée) |

**Sauvegarde :** automatique, sur l'appareil, à chaque frappe. Pas besoin de bouton « Enregistrer ».

**Chaque appareil a ses propres notes** (pas de synchronisation en v1). Pour passer des notes du Mac à l'iPhone : *Exporter* sur l'un, *Importer* sur l'autre.

## 4. Exporter / importer (sauvegarde, compatible Obsidian)

- **Exporter** (en bas du menu) : crée un fichier `notes-AAAA-MM-JJ.zip` qui contient un fichier `.md` par note.
  - Sur Mac : il arrive dans *Téléchargements*.
  - Sur iPhone : le menu Partager s'ouvre → *Enregistrer dans Fichiers* (ou AirDrop vers le Mac).
- **Importer** : choisissez un `.zip` (par ex. un coffre Obsidian zippé) ou plusieurs fichiers `.md`. Si une note du même nom existe déjà, l'appli vous demande s'il faut la remplacer.
- Pour ouvrir vos notes dans le vrai Obsidian : dézippez l'export et ouvrez le dossier comme « coffre » (vault).

---

## 5. Pour modifier l'appli (développeur débutant)

Il faut **Node.js** (déjà installé sur ce Mac). Dans le Terminal :

```bash
cd ~/Documents/notes-app
npm install        # télécharge les bibliothèques (une seule fois)
npm run dev        # lance l'appli sur http://localhost:5173 (Ctrl+C pour arrêter)
npm test           # lance les tests automatiques
npm run build      # prépare la version en ligne dans le dossier dist/
```

**Mettre en ligne une nouvelle version :**

```bash
git add -A
git commit -m "Ce que j'ai changé"
git push
```

GitHub lance alors les tests, construit l'appli et la publie (environ 1 minute ; suivi dans l'onglet **Actions** du dépôt). Sur l'iPhone, la nouvelle version s'installe toute seule à l'ouverture suivante (parfois il faut fermer et rouvrir l'appli deux fois).

**Où est quoi :**

```
src/main.js          démarrage, navigation, boutons
src/core/            logique pure (liens, notes, Markdown) — testée
src/storage/         le SEUL endroit qui sait où sont rangées les notes (pour la future synchro)
src/io/zip.js        export / import
src/ui/              liste des notes, mentions liées, graphe
tests/               tests automatiques
PLAN.md              le plan et l'avancement
```

## 6. Ce que l'appli ne fait pas encore

Synchronisation entre appareils, recherche, tags, images/pièces jointes, liens vers une section précise (`[[Note#Section]]` ouvre la note, pas la section). Les options pour la synchro sont décrites dans `PLAN.md`.
