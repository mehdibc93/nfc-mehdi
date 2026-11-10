import type { ComponentType } from 'react';
import { WhoOfUs, WouldYouRather } from './CardGames';
import { Drawing } from './Drawing';
import { FingerRoulette } from './FingerRoulette';
import { Forehead } from './Forehead';
import { LetterRush } from './LetterRush';
import { QuickQuiz } from './QuickQuiz';
import { Undercover } from './Undercover';

// Jeux d'ambiance : un seul téléphone pour toute la table (contenu en français).

export type PartyGameProps = { firstName: string; onQuit: () => void };

export type PartyGame = {
  id: string;
  emoji: string;
  title: string;
  text: string;
  players: string;
  tint: string;
  Component: ComponentType<PartyGameProps>;
};

export const PARTY_GAMES: PartyGame[] = [
  { id: 'roulette', emoji: '👆', title: 'Qui paie ?', text: 'Un doigt chacun, le hasard désigne', players: 'Dès 2 joueurs', tint: '#fde2e4', Component: FingerRoulette },
  { id: 'forehead', emoji: '🤔', title: 'Le mot sur le front', text: 'Faites deviner le mot sans le dire', players: 'Dès 2 joueurs', tint: '#e0ecff', Component: Forehead },
  { id: 'undercover', emoji: '🕵️', title: 'Undercover', text: 'Tous le même mot… sauf un', players: 'Dès 3 joueurs', tint: '#ece4ff', Component: Undercover },
  { id: 'quiz', emoji: '⚡', title: 'Quiz éclair', text: 'Le premier qui répond marque', players: 'Dès 2 joueurs', tint: '#fff4cc', Component: QuickQuiz },
  { id: 'drawing', emoji: '✏️', title: 'Le dessin', text: 'Un joueur dessine, la table devine', players: 'Dès 2 joueurs', tint: '#dcf7e6', Component: Drawing },
  { id: 'letters', emoji: '🔤', title: 'Petit bac express', text: 'Une lettre, une catégorie, 8 secondes', players: 'Dès 2 joueurs', tint: '#ffe8d6', Component: LetterRush },
  { id: 'whoofus', emoji: '👉', title: 'Qui de nous ?', text: '3, 2, 1… tout le monde pointe', players: 'Dès 3 joueurs', tint: '#fde2e4', Component: WhoOfUs },
  { id: 'rather', emoji: '⚖️', title: 'Tu préfères ?', text: 'Deux choix, la table vote', players: 'Dès 2 joueurs', tint: '#e0f4f4', Component: WouldYouRather },
];
