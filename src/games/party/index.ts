import type { ComponentType } from 'react';
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

// Jeux d'ambiance : un seul téléphone pour toute la table (contenu en français).

export type { PartyDish };
export type PartyGameProps = { firstName: string; dishes: PartyDish[]; onQuit: () => void };

export type PartyGame = {
  id: string;
  emoji: string;
  title: string;
  text: string;
  players: string;
  tint: string;
  Component: ComponentType<PartyGameProps>;
  /** Jeu proposé seulement si cette condition est remplie (ex. assez de plats à la carte). */
  available?: (dishes: PartyDish[]) => boolean;
};

export const PARTY_GAMES: PartyGame[] = [
  { id: 'rather', emoji: '⚖️', title: 'Tu préfères ?', text: 'De vrais dilemmes qui font débattre', players: 'Dès 2 joueurs', tint: '#e0f4f4', Component: WouldYouRather },
  {
    id: 'price',
    emoji: '🏷️',
    title: 'Devine le prix',
    text: 'Le plus proche du prix de la carte gagne',
    players: 'Dès 2 joueurs',
    tint: '#dcf7e6',
    Component: PriceGuess,
    available: (dishes) => dishes.filter((dish) => dish.price > 0).length >= 3,
  },
  { id: 'roulette', emoji: '👆', title: 'Qui paie ?', text: 'Un doigt chacun, le hasard désigne', players: 'Dès 2 joueurs', tint: '#fde2e4', Component: FingerRoulette },
  { id: 'potato', emoji: '💣', title: 'La patate chaude', text: 'Un mot, on passe… avant que ça explose', players: 'Dès 3 joueurs', tint: '#ffe8d6', Component: HotPotato },
  { id: 'undercover', emoji: '🕵️', title: 'Undercover', text: 'Tous le même mot… sauf un', players: 'Dès 3 joueurs', tint: '#ece4ff', Component: Undercover },
  { id: 'reflex', emoji: '🎯', title: 'Duel de réflexes', text: 'Face à face : le plus rapide au vert', players: '2 joueurs', tint: '#e0ecff', Component: ReflexDuel },
  { id: 'forehead', emoji: '🤔', title: 'Le mot sur le front', text: 'Faites deviner le mot sans le dire', players: 'Dès 2 joueurs', tint: '#fff4cc', Component: Forehead },
  { id: 'quiz', emoji: '🧠', title: 'Quiz éclair', text: 'Le premier qui répond marque', players: 'Dès 2 joueurs', tint: '#fde2e4', Component: QuickQuiz },
  { id: 'cursed', emoji: '🔮', title: 'Le nombre maudit', text: 'Ne tombe pas dessus… sinon gage !', players: 'Dès 2 joueurs', tint: '#ece4ff', Component: CursedNumber },
  { id: 'whoofus', emoji: '👉', title: 'Qui de nous ?', text: '3, 2, 1… tout le monde pointe', players: 'Dès 3 joueurs', tint: '#e0f4f4', Component: WhoOfUs },
  { id: 'letters', emoji: '🔤', title: 'Petit bac express', text: 'Une lettre, une catégorie, 8 secondes', players: 'Dès 2 joueurs', tint: '#ffe8d6', Component: LetterRush },
];
