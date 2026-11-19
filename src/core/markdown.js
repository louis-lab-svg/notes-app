// Transforme le texte Markdown en HTML affichable, puis le nettoie avec
// DOMPurify pour qu'une note (importée par exemple) ne puisse pas exécuter de code.
import { Marked } from 'marked';
import DOMPurify from 'dompurify';

const md = new Marked({ gfm: true, breaks: true });

export function renderMarkdown(source) {
  return DOMPurify.sanitize(md.parse(source));
}
