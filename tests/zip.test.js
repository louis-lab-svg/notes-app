import { describe, it, expect } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { buildZip, readFiles, planImport } from '../src/io/zip.js';

const notes = [
  { id: '1', title: 'Accueil', content: '# Salut\n\nVoir [[Idées d’été]]', updatedAt: Date.now() },
  { id: '2', title: 'Idées d’été', content: 'Plage 🏖️', updatedAt: Date.now() },
];

describe('export / import', () => {
  it('aller-retour : export puis import redonne les mêmes notes', () => {
    const zip = buildZip(notes);
    const { notes: back, ignored } = readFiles([{ name: 'notes.zip', bytes: zip }]);
    expect(ignored).toEqual([]);
    expect(back).toEqual([
      { title: 'Accueil', content: notes[0].content },
      { title: 'Idées d’été', content: notes[1].content },
    ]);
  });

  it('importe un coffre Obsidian zippé (sous-dossiers, fichiers ignorés)', () => {
    const zip = zipSync({
      'Coffre/Projets/Plan.md': strToU8('plan'),
      'Coffre/Journal.markdown': strToU8('﻿journal'),
      'Coffre/.obsidian/app.json': strToU8('{}'),
      'Coffre/.obsidian/notes.md': strToU8('caché'),
      '__MACOSX/Coffre/._Plan.md': strToU8('x'),
      'Coffre/image.png': new Uint8Array([1, 2]),
      'Coffre/Autre/Plan.md': strToU8('doublon'),
    });
    const { notes: got, ignored } = readFiles([{ name: 'vault.zip', bytes: zip }]);
    expect(got).toEqual([
      { title: 'Plan', content: 'plan' },
      { title: 'Journal', content: 'journal' },
    ]);
    expect(ignored).toContain('Coffre/image.png');
    expect(ignored).toContain('Plan.md (en double)');
  });

  it('importe des fichiers .md séparés et normalise les accents macOS (NFD → NFC)', () => {
    const nfd = 'Idée.md'; // « Idée » écrit avec un accent « combiné », comme dans les noms de fichiers macOS
    const { notes: got } = readFiles([
      { name: nfd, bytes: strToU8('a') },
      { name: 'Note.MD', bytes: strToU8('b') },
    ]);
    expect(got.map((n) => n.title)).toEqual(['Idée', 'Note']);
  });

  it('sépare nouvelles notes et notes existantes (sans tenir compte de la casse)', () => {
    const plan = planImport(notes, [
      { title: 'accueil', content: 'nouveau' },
      { title: 'Nouvelle', content: 'x' },
    ]);
    expect(plan.toCreate.map((n) => n.title)).toEqual(['Nouvelle']);
    expect(plan.toReplace.map((r) => r.existing.id)).toEqual(['1']);
  });
});
