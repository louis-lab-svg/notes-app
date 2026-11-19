// Export et import des notes en fichiers .md (compatibles Obsidian).
// Export : un .zip qui contient un fichier « Titre.md » par note.
// Import : des fichiers .md, ou un .zip (par exemple un coffre Obsidian zippé).
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { cleanTitle, titleKey, findByTitle } from '../core/notes.js';

/** Fabrique le contenu du .zip (Uint8Array) à partir des notes. */
export function buildZip(notes) {
  const files = {};
  for (const note of notes) {
    files[`${note.title}.md`] = [strToU8(note.content), { mtime: new Date(note.updatedAt || Date.now()) }];
  }
  return zipSync(files);
}

/** « dossier/Ma note.md » → « Ma note » (null si ce n'est pas une note .md à importer). */
function titleFromPath(path) {
  const parts = path.split('/');
  const name = parts.pop();
  // On ignore les fichiers cachés, les dossiers système (.obsidian, .trash) et ceux ajoutés par macOS.
  if (parts.some((p) => p.startsWith('.') || p === '__MACOSX') || name.startsWith('.')) return null;
  const m = name.match(/^(.+)\.(md|markdown)$/i);
  return m ? cleanTitle(m[1].normalize('NFC')) || null : null;
}

const decode = (bytes) => strFromU8(bytes).replace(/^﻿/, ''); // retire l'éventuel « BOM » invisible

/**
 * Lit des fichiers choisis par l'utilisateur.
 * @param files [{ name, bytes: Uint8Array }]
 * @returns { notes: [{ title, content }], ignored: [noms de fichiers non importés] }
 */
export function readFiles(files) {
  const found = [];
  const ignored = [];
  const add = (path, bytes) => {
    const title = titleFromPath(path);
    if (title) found.push({ title, content: decode(bytes) });
    else if (!path.endsWith('/')) ignored.push(path);
  };
  for (const { name, bytes } of files) {
    if (/\.zip$/i.test(name)) {
      for (const [path, data] of Object.entries(unzipSync(bytes))) add(path, data);
    } else {
      add(name, bytes);
    }
  }
  // Deux fichiers avec le même titre (dans deux dossiers différents) : on garde le premier.
  const seen = new Set();
  const notes = [];
  for (const n of found) {
    const key = titleKey(n.title);
    if (seen.has(key)) ignored.push(`${n.title}.md (en double)`);
    else {
      seen.add(key);
      notes.push(n);
    }
  }
  return { notes, ignored };
}

/** Sépare les notes importées en « nouvelles » et « déjà existantes » (même titre). */
export function planImport(existingNotes, imported) {
  const toCreate = [];
  const toReplace = [];
  for (const n of imported) {
    const existing = findByTitle(existingNotes, n.title);
    if (existing) toReplace.push({ existing, title: n.title, content: n.content });
    else toCreate.push(n);
  }
  return { toCreate, toReplace };
}

// ---------- Partie navigateur ----------

/** Propose le .zip à l'utilisateur : menu « Partager » sur téléphone, téléchargement sur ordinateur. */
export async function saveZip(bytes) {
  const date = new Date().toISOString().slice(0, 10);
  const file = new File([bytes], `notes-${date}.zip`, { type: 'application/zip' });
  const touch = matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return; // l'utilisateur a fermé le menu
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Lit les fichiers d'un <input type="file"> en mémoire. */
export async function loadFileList(fileList) {
  return Promise.all(
    [...fileList].map(async (f) => ({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })),
  );
}
