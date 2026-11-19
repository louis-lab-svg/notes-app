import { describe, it, expect } from 'vitest';
import { parseLinks, linkTargets, getBacklinks, buildGraph, renameLinks } from '../src/core/links.js';

const note = (title, content) => ({ id: title.toLowerCase().replace(/\s/g, '-'), title, content, updatedAt: 0 });

describe('détection des liens [[ ]]', () => {
  it('lien simple', () => {
    expect(parseLinks('Voir [[Recettes]] demain.')).toEqual([
      { target: 'Recettes', heading: null, alias: null },
    ]);
  });

  it('lien avec | (texte affiché)', () => {
    expect(parseLinks('Voir [[Recettes|mes recettes]].')).toEqual([
      { target: 'Recettes', heading: null, alias: 'mes recettes' },
    ]);
  });

  it('lien avec section #', () => {
    expect(parseLinks('[[Recettes#Desserts|gâteaux]]')).toEqual([
      { target: 'Recettes', heading: 'Desserts', alias: 'gâteaux' },
    ]);
  });

  it('plusieurs liens dans une note', () => {
    const md = '[[A]] et [[B|bé]]\n- puis [[C]]\n\nEncore [[A]]';
    expect(parseLinks(md).map((l) => l.target)).toEqual(['A', 'B', 'C', 'A']);
    expect(linkTargets(md)).toEqual(['A', 'B', 'C']); // sans doublon
  });

  it('doublons insensibles à la casse', () => {
    expect(linkTargets('[[Paris]] [[paris]] [[ PARIS ]]')).toEqual(['Paris']);
  });

  it('note sans lien', () => {
    expect(parseLinks('Juste du texte, avec [crochets] et [[ ]] vide.')).toEqual([]);
    expect(parseLinks('')).toEqual([]);
  });

  it('ignore les liens dans le code', () => {
    const md = 'vrai [[A]] `faux [[B]]`\n```\n[[C]]\n```\n~~~js\n[[D]]\n~~~\nfin [[E]]';
    expect(linkTargets(md)).toEqual(['A', 'E']);
  });

  it('accepte les lettres accentuées et la ponctuation', () => {
    expect(linkTargets("[[Idées d'été (2026)]]")).toEqual(["Idées d'été (2026)"]);
  });
});

describe('backlinks', () => {
  const a = note('Accueil', 'Voir [[Projets]] et [[Lectures|livres]]');
  const p = note('Projets', 'Retour à [[accueil]]. Voir [[Projets]] (moi-même).');
  const l = note('Lectures', 'Rien ici.');
  const x = note('Brouillon', 'Parle de [[Projets]] et de [[Note inexistante]]');
  const notes = [a, p, l, x];

  it('trouve les notes qui pointent vers une note', () => {
    expect(getBacklinks(notes, p).map((n) => n.title)).toEqual(['Accueil', 'Brouillon']);
  });

  it('fonctionne avec un lien | et sans tenir compte de la casse', () => {
    expect(getBacklinks(notes, l).map((n) => n.title)).toEqual(['Accueil']);
    expect(getBacklinks(notes, a).map((n) => n.title)).toEqual(['Projets']);
  });

  it('une note sans backlink renvoie une liste vide', () => {
    expect(getBacklinks(notes, x)).toEqual([]);
  });

  it("un lien vers soi-même n'est pas un backlink", () => {
    expect(getBacklinks(notes, p).map((n) => n.title)).not.toContain('Projets');
  });

  it('lien vers une note inexistante : apparaît quand la note est créée', () => {
    const nouvelle = note('Note inexistante', '');
    expect(getBacklinks([...notes, nouvelle], nouvelle).map((n) => n.title)).toEqual(['Brouillon']);
  });
});

describe('graphe', () => {
  it('crée des points pour les notes et des points « fantômes » pour les liens vers des notes inexistantes', () => {
    const notes = [note('A', '[[B]] [[Fantôme]] [[A]]'), note('B', '[[a]]'), note('C', '')];
    const g = buildGraph(notes);
    expect(g.nodes.map((n) => [n.name, n.missing])).toEqual([
      ['A', false],
      ['B', false],
      ['C', false],
      ['Fantôme', true],
    ]);
    // A↔B une seule fois, A→Fantôme, pas de A→A
    expect(g.links).toEqual([
      { source: 'a', target: 'b' },
      { source: 'a', target: 'missing:fantôme' },
    ]);
  });
});

describe('renommage', () => {
  it('met à jour les liens en gardant section et texte affiché', () => {
    const md = '[[Vieux]] [[vieux|alias]] [[Vieux#Partie]] ![[Vieux]] [[Autre]] `[[Vieux]]`';
    expect(renameLinks(md, 'Vieux', 'Neuf')).toBe(
      '[[Neuf]] [[Neuf|alias]] [[Neuf#Partie]] ![[Neuf]] [[Autre]] `[[Vieux]]`',
    );
  });

  it('ne change rien sans lien concerné', () => {
    expect(renameLinks('rien [[Autre]]', 'Vieux', 'Neuf')).toBe('rien [[Autre]]');
  });
});
