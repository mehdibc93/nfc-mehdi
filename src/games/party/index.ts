import type { ComponentType } from 'react';
import { PARTY_CATALOG, type CatalogEntry, type PartyLocale } from '../catalog';
import { WhoOfUs, WouldYouRather } from './CardGames';
import { CursedNumber } from './CursedNumber';
import { FingerRoulette } from './FingerRoulette';
import { Forehead } from './Forehead';
import { HotPotato } from './HotPotato';
import { LetterRush } from './LetterRush';
import { PriceGuess } from './PriceGuess';
import { QuickQuiz } from './QuickQuiz';
import { ReflexDuel } from './ReflexDuel';
import type { PartyDish } from './types';
import { Undercover } from './Undercover';

// Jeux d'ambiance : un seul téléphone pour toute la table (français, anglais, chinois).

export type { PartyDish };
export type PartyGameProps = { firstName: string; dishes: PartyDish[]; onQuit: () => void };

const COMPONENTS: Record<string, ComponentType<PartyGameProps>> = {
  rather: WouldYouRather,
  price: PriceGuess,
  roulette: FingerRoulette,
  potato: HotPotato,
  undercover: Undercover,
  reflex: ReflexDuel,
  forehead: Forehead,
  quiz: QuickQuiz,
  cursed: CursedNumber,
  whoofus: WhoOfUs,
  letters: LetterRush,
};

export type PartyGame = CatalogEntry & { Component: ComponentType<PartyGameProps> };

export const PARTY_GAMES: PartyGame[] = PARTY_CATALOG.map((entry) => ({ ...entry, Component: COMPONENTS[entry.id] }));

/** Jeux proposés : selon la langue, les jeux masqués par le restaurant et la carte (Devine le prix). */
export function availablePartyGames(lang: PartyLocale, hidden: string[], dishes: PartyDish[]): PartyGame[] {
  const pricedDishes = dishes.filter((dish) => dish.price > 0).length;
  return PARTY_GAMES.filter(
    (game) =>
      !hidden.includes(game.id) &&
      (!game.locales || game.locales.includes(lang)) &&
      (game.id !== 'price' || pricedDishes >= 3),
  );
}
