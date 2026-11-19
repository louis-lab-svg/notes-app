// Cases à cocher : « - [ ] tâche » / « - [x] tâche ».

const FENCE = /^\s*(```|~~~)/;
const TASK = /^(\s*(?:>\s*)*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\](?:\s|$))/;

/**
 * Coche ou décoche la case numéro `index` (0 = la première de la note)
 * et renvoie le nouveau texte. Les cases dans les blocs de code sont ignorées.
 */
export function toggleTask(markdown, index) {
  const lines = markdown.split('\n');
  let fence = null;
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const f = line.match(FENCE);
    if (f) {
      if (!fence) fence = f[1];
      else if (f[1] === fence) fence = null;
      continue;
    }
    if (fence) continue;
    const m = line.match(TASK);
    if (!m) continue;
    if (count === index) {
      const mark = m[2] === ' ' ? 'x' : ' ';
      lines[i] = m[1] + mark + line.slice(m[1].length + 1);
      return lines.join('\n');
    }
    count++;
  }
  return markdown;
}
