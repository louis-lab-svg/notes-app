// Logique des notes, sans rien d'affichage (donc facile à tester).

/** Identifiant unique pour une note. */
export function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  // Repli pour les navigateurs/contextes sans randomUUID (ex. http sur le réseau local)
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** Clé de comparaison d'un titre : insensible à la casse et aux espaces autour. */
export function titleKey(title) {
  return title.normalize('NFC').trim().toLowerCase();
}

/** Retire les caractères interdits dans un titre (ils cassent les liens ou les noms de fichiers). */
export function cleanTitle(raw) {
  return raw
    .replace(/[\\/:*?"<>|#^[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Trouve une note par son titre (sans tenir compte des majuscules). */
export function findByTitle(notes, title) {
  const key = titleKey(title);
  return notes.find((n) => titleKey(n.title) === key);
}

/** Propose un titre libre : « Sans titre », puis « Sans titre 1 », « Sans titre 2 »… */
export function uniqueTitle(notes, base = 'Sans titre') {
  let title = base;
  let i = 1;
  while (findByTitle(notes, title)) title = `${base} ${i++}`;
  return title;
}

/** Fabrique une nouvelle note (pas encore enregistrée). */
export function createNote(title, content = '') {
  return { id: newId(), title, content, updatedAt: Date.now() };
}

/** Notes triées par titre, dans l'ordre alphabétique français. */
export function sortByTitle(notes) {
  return [...notes].sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));
}
