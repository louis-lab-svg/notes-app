// Liens entre notes, façon Obsidian :
//   [[Nom de la note]]
//   [[Nom de la note|texte affiché]]
//   [[Nom de la note#Section]]   (la section est ignorée en v1)
// Les liens écrits dans du code (`...` ou blocs ```) ne comptent pas.
import { titleKey } from './notes.js';

const LINK = /(!?)\[\[([^[\]\n]+?)\]\]/g;
// Un bloc de code ``` ou ~~~ (de la ligne d'ouverture à la ligne de fermeture), ou du `code` en ligne.
const CODE = /^[ \t]*(```|~~~)[^\n]*\n[\s\S]*?^[ \t]*\1[^\n]*$|`[^`\n]*`/gm;

/** Applique `fn` à tout le texte SAUF le code, qui est laissé tel quel. */
function mapOutsideCode(markdown, fn) {
  let out = '';
  let last = 0;
  for (const m of markdown.matchAll(CODE)) {
    out += fn(markdown.slice(last, m.index)) + m[0];
    last = m.index + m[0].length;
  }
  return out + fn(markdown.slice(last));
}

/** Découpe l'intérieur d'un lien « Note#Section|texte » → { target, heading, alias }. */
export function parseLinkInner(inner) {
  const [targetPart, ...aliasParts] = inner.split('|');
  const [target, ...headingParts] = targetPart.split('#');
  if (!target.trim()) return null;
  return {
    target: target.trim(),
    heading: headingParts.length ? headingParts.join('#').trim() : null,
    alias: aliasParts.length ? aliasParts.join('|').trim() : null,
  };
}

/** Tous les liens d'un texte, dans l'ordre : [{ target, heading, alias }]. */
export function parseLinks(markdown) {
  const links = [];
  mapOutsideCode(markdown, (text) => {
    for (const m of text.matchAll(LINK)) {
      const link = parseLinkInner(m[2]);
      if (link) links.push(link);
    }
    return text;
  });
  return links;
}

/** Les notes visées par un texte, sans doublon (comparaison insensible à la casse). */
export function linkTargets(markdown) {
  const seen = new Map();
  for (const { target } of parseLinks(markdown)) {
    const key = titleKey(target);
    if (!seen.has(key)) seen.set(key, target);
  }
  return [...seen.values()];
}

/** Les backlinks d'une note : les AUTRES notes qui contiennent un lien vers elle. */
export function getBacklinks(notes, note) {
  const key = titleKey(note.title);
  return notes.filter(
    (other) => other.id !== note.id && linkTargets(other.content).some((t) => titleKey(t) === key),
  );
}

/**
 * Données pour la vue graphe.
 * nodes : une entrée par note, plus une entrée « fantôme » (missing: true) pour
 *         chaque lien vers une note qui n'existe pas encore.
 * links : un trait par paire de notes reliées (sans doublon, sans lien vers soi-même).
 */
export function buildGraph(notes) {
  const byKey = new Map(notes.map((n) => [titleKey(n.title), n]));
  const nodes = notes.map((n) => ({ id: n.id, name: n.title, missing: false }));
  const missing = new Map();
  const links = [];
  const seenPairs = new Set();

  for (const note of notes) {
    for (const target of linkTargets(note.content)) {
      const key = titleKey(target);
      let targetId;
      if (byKey.has(key)) {
        targetId = byKey.get(key).id;
      } else {
        targetId = `missing:${key}`;
        if (!missing.has(key)) missing.set(key, { id: targetId, name: target, missing: true });
      }
      if (targetId === note.id) continue;
      const pair = [note.id, targetId].sort().join('→');
      if (seenPairs.has(pair)) continue;
      seenPairs.add(pair);
      links.push({ source: note.id, target: targetId });
    }
  }
  return { nodes: [...nodes, ...missing.values()], links };
}

/** Remplace, dans un texte, les liens vers `oldTitle` par des liens vers `newTitle`
 *  (en gardant la section et le texte affiché). */
export function renameLinks(markdown, oldTitle, newTitle) {
  const oldKey = titleKey(oldTitle);
  return mapOutsideCode(markdown, (text) =>
    text.replace(LINK, (whole, bang, inner) => {
      const link = parseLinkInner(inner);
      if (!link || titleKey(link.target) !== oldKey) return whole;
      const heading = link.heading !== null ? `#${link.heading}` : '';
      const alias = link.alias !== null ? `|${link.alias}` : '';
      return `${bang}[[${newTitle}${heading}${alias}]]`;
    }),
  );
}
