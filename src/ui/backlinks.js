// Panneau « Mentions liées » sous la note : les notes qui pointent vers elle.
import { sortByTitle } from '../core/notes.js';

export function renderBacklinks(container, backlinks) {
  const title = document.createElement('h2');
  title.textContent = `Mentions liées (${backlinks.length})`;
  const list = document.createElement('ul');
  for (const note of sortByTitle(backlinks)) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#/n/${note.id}`;
    a.textContent = note.title;
    li.append(a);
    list.append(li);
  }
  if (!backlinks.length) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'Aucune autre note ne pointe ici.';
    list.append(li);
  }
  container.replaceChildren(title, list);
}
