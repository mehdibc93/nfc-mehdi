import { describe, expect, it } from 'vitest';
import { formatEuros, monthlyCommission, yearlySavings } from './commission';

describe('monthlyCommission', () => {
  it('calcule la commission mensuelle arrondie à l’euro', () => {
    expect(monthlyCommission(3000, 30)).toBe(900);
    expect(monthlyCommission(2500, 15)).toBe(375);
  });

  it('borne les saisies incohérentes', () => {
    expect(monthlyCommission(-100, 30)).toBe(0);
    expect(monthlyCommission(1000, 150)).toBe(1000);
    expect(monthlyCommission(Number.NaN, 30)).toBe(0);
  });
});

describe('yearlySavings', () => {
  it('déduit l’abonnement annuel Nourevo de la commission évitée', () => {
    expect(yearlySavings(750)).toBe(9000 - 588);
  });

  it('ne descend jamais sous zéro', () => {
    expect(yearlySavings(20)).toBe(0);
  });
});

describe('formatEuros', () => {
  it('sépare les milliers par une espace', () => {
    expect(formatEuros(10800)).toBe('10 800 €');
    expect(formatEuros(900)).toBe('900 €');
    expect(formatEuros(1234567)).toBe('1 234 567 €');
  });
});
