// Point d'entrée UNIQUE pour lire et écrire les notes.
// Le reste de l'appli ne sait pas où sont rangées les notes : il appelle
// seulement store.list / store.put / store.remove.
//
// Pour la synchro (v2) : on écrira un autre fichier (ex. storage/sync-github.js)
// qui propose les mêmes fonctions, et on le branchera ici. Chaque note a déjà
// un `id` stable et une date `updatedAt` pour savoir quelle version est la plus récente.
import * as local from './local.js';

const backend = local;

export const store = {
  /** Toutes les notes : [{ id, title, content, updatedAt }] */
  list: () => backend.list(),

  /** Enregistre (crée ou met à jour) une note et met sa date à jour. */
  async put(note) {
    note.updatedAt = Date.now();
    await backend.put(note);
    return note;
  },

  /** Supprime une note. */
  remove: (id) => backend.remove(id),
};

/** Demande au navigateur de ne pas effacer nos données quand il manque de place. */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    /* pas grave si le navigateur ne le permet pas */
  }
}
