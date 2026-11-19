// Transforme le texte Markdown en HTML affichable, puis le nettoie avec
// DOMPurify pour qu'une note (importée par exemple) ne puisse pas exécuter de code.
import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import { parseLinkInner } from './links.js';

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Fonction « cette note existe-t-elle ? », fournie à chaque rendu.
let noteExists = () => true;

const md = new Marked({ gfm: true, breaks: true });

// Extension : [[Note]] et [[Note|texte]] deviennent des liens cliquables.
md.use({
  extensions: [
    {
      name: 'wikilink',
      level: 'inline',
      start(src) {
        const i = src.indexOf('[[');
        return i < 0 ? undefined : i;
      },
      tokenizer(src) {
        const m = /^!?\[\[([^[\]\n]+?)\]\]/.exec(src);
        const link = m && parseLinkInner(m[1]);
        if (!link) return undefined;
        return { type: 'wikilink', raw: m[0], target: link.target, text: link.alias || link.target };
      },
      renderer(token) {
        const cls = noteExists(token.target) ? 'wikilink' : 'wikilink missing';
        return `<a href="#" class="${cls}" data-target="${escapeHtml(token.target)}">${escapeHtml(token.text)}</a>`;
      },
    },
  ],
});

/** @param exists (titre) => booléen, pour griser les liens vers des notes inexistantes */
export function renderMarkdown(source, exists = () => true) {
  noteExists = exists;
  return DOMPurify.sanitize(md.parse(source));
}
