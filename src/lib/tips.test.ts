import { describe, expect, it } from 'vitest';
import { normalizeTipPercentages, parseTipInput, tipFromPercent } from './tips';

describe('tipFromPercent', () => {
  it('calcule le pourcentage arrondi au centime', () => {
    expect(tipFromPercent(33, 10)).toBe(3.3);
    expect(tipFromPercent(27.9, 15)).toBe(4.19);
  });

  it('vaut zéro pour un panier vide ou un pourcentage nul', () => {
    expect(tipFromPercent(0, 10)).toBe(0);
    expect(tipFromPercent(20, 0)).toBe(0);
  });
});

describe('parseTipInput', () => {
  it('accepte la virgule et le point', () => {
    expect(parseTipInput('2,50')).toBe(2.5);
    expect(parseTipInput('3.2')).toBe(3.2);
    expect(parseTipInput('')).toBe(0);
  });

  it('refuse les saisies invalides et les montants au-delà du maximum', () => {
    expect(parseTipInput('abc')).toBeNull();
    expect(parseTipInput('-2')).toBeNull();
    expect(parseTipInput('1.234')).toBeNull();
    expect(parseTipInput('500')).toBeNull();
  });
});

describe('normalizeTipPercentages', () => {
  it('trie, dédoublonne et écarte les valeurs hors bornes', () => {
    expect(normalizeTipPercentages([15, 5, 10, 10, 0, 80, 2.5])).toEqual([5, 10, 15]);
  });
});
