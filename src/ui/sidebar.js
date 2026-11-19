// Affiche la liste des notes dans la barre latérale.
import { sortByTitle } from '../core/notes.js';

export function renderNoteList(listEl, notes, currentId) {
  listEl.replaceChildren(
    ...sortByTitle(notes).map((note) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#/n/${note.id}`;
      a.textContent = note.title;
      if (note.id === currentId) a.classList.add('active');
      li.append(a);
      return li;
    }),
  );
}
