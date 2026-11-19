import { describe, it, expect } from 'vitest';
import { toggleTask } from '../src/core/tasks.js';

describe('toggleTask (cases à cocher)', () => {
  it('coche la bonne case', () => {
    expect(toggleTask('- [ ] a\n- [ ] b', 1)).toBe('- [ ] a\n- [x] b');
  });
  it('décoche une case cochée (x ou X)', () => {
    expect(toggleTask('- [X] a', 0)).toBe('- [ ] a');
  });
  it('ignore les cases dans un bloc de code', () => {
    const md = '```\n- [ ] dans le code\n```\n- [ ] vraie';
    expect(toggleTask(md, 0)).toBe('```\n- [ ] dans le code\n```\n- [x] vraie');
  });
  it('gère les listes numérotées et indentées', () => {
    expect(toggleTask('1. [ ] a\n   - [ ] b', 1)).toBe('1. [ ] a\n   - [x] b');
  });
  it('ne change rien si la case n’existe pas', () => {
    expect(toggleTask('pas de case', 0)).toBe('pas de case');
  });
});
