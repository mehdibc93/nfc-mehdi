import type { GameLogic, GameResult } from './types';

// Jeu de cartes « Couleurs », aux règles proches des jeux de défausse par couleur bien connus :
// 4 couleurs, cartes 0 à 9, Passe, Inverse, +2, Joker et Joker +4. On pose une carte de la même
// couleur ou de la même valeur que celle du dessus ; le premier qui n'a plus de carte gagne.
// Règles simplifiées pour jouer vite : pas de cumul des +2/+4, et après avoir pioché on peut
// poser n'importe quelle carte jouable ou passer.

export type CardColor = 'r' | 'y' | 'g' | 'b';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'plus2' | 'wild' | 'plus4';
export type Card = { id: number; color: CardColor | 'w'; value: CardValue };

export type CardsEvent = { kind: 'skip' | 'reverse' | 'plus2' | 'plus4' | 'draw' | 'color'; player: number; target?: number };

export type CardsState = {
  hands: Card[][];
  pile: Card[];
  discard: Card[];
  color: CardColor;
  turn: number;
  dir: 1 | -1;
  drew: boolean;
  result: GameResult;
  event: CardsEvent | null;
  /** Joueur qui vient d'oublier de crier « Couleurs ! » (et a pioché 2 cartes de pénalité). */
  forgot?: number | null;
};

/** `shout` : le joueur a crié « Couleurs ! » avant de poser son avant-dernière carte. */
export type CardsAction = { type: 'play'; cardId: number; color?: CardColor; shout?: boolean } | { type: 'draw' } | { type: 'pass' };

export const CARD_COLORS: CardColor[] = ['r', 'y', 'g', 'b'];
const HAND_SIZE = 7;

export function buildDeck(): Card[] {
  const cards: Card[] = [];
  let id = 0;
  for (const color of CARD_COLORS) {
    cards.push({ id: id++, color, value: '0' });
    for (const value of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'plus2'] as CardValue[]) {
      cards.push({ id: id++, color, value });
      cards.push({ id: id++, color, value });
    }
  }
  for (let i = 0; i < 4; i += 1) {
    cards.push({ id: id++, color: 'w', value: 'wild' });
    cards.push({ id: id++, color: 'w', value: 'plus4' });
  }
  return cards;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function topCard(state: CardsState): Card {
  return state.discard[state.discard.length - 1];
}

export function canPlay(state: CardsState, card: Card): boolean {
  if (card.color === 'w') return true;
  const top = topCard(state);
  return card.color === state.color || card.value === top.value;
}

function nextIndex(state: Pick<CardsState, 'turn' | 'dir' | 'hands'>, steps = 1): number {
  const count = state.hands.length;
  return (((state.turn + state.dir * steps) % count) + count) % count;
}

/** Pioche `count` cartes ; la défausse (sauf la carte du dessus) est remélangée si la pioche est vide. */
function drawCards(pile: Card[], discard: Card[], count: number): { drawn: Card[]; pile: Card[]; discard: Card[] } {
  let nextPile = [...pile];
  let nextDiscard = [...discard];
  const drawn: Card[] = [];
  for (let i = 0; i < count; i += 1) {
    if (nextPile.length === 0 && nextDiscard.length > 1) {
      const top = nextDiscard[nextDiscard.length - 1];
      nextPile = shuffle(nextDiscard.slice(0, -1), Math.random);
      nextDiscard = [top];
    }
    const card = nextPile.pop();
    if (!card) break;
    drawn.push(card);
  }
  return { drawn, pile: nextPile, discard: nextDiscard };
}

export const cards: GameLogic<CardsState, CardsAction> = {
  minPlayers: 2,
  maxPlayers: 4,
  init: (players, random = Math.random) => {
    const pile = shuffle(buildDeck(), random);
    const hands: Card[][] = Array.from({ length: players }, () => pile.splice(0, HAND_SIZE));
    // Première carte retournée : une carte chiffre, pour démarrer sans effet spécial.
    const firstIndex = pile.findIndex((card) => /^\d$/.test(card.value));
    const [first] = pile.splice(firstIndex, 1);
    return {
      hands,
      pile,
      discard: [first],
      color: first.color as CardColor,
      turn: 0,
      dir: 1,
      drew: false,
      result: null,
      event: null,
    };
  },
  apply: (state, player, action) => {
    if (state.result || player !== state.turn) return null;

    if (action.type === 'draw') {
      if (state.drew) return null;
      const { drawn, pile, discard } = drawCards(state.pile, state.discard, 1);
      const hands = state.hands.map((hand, index) => (index === player ? [...hand, ...drawn] : hand));
      const next = { ...state, hands, pile, discard, event: { kind: 'draw' as const, player }, forgot: null };
      // Rien de jouable après la pioche : le tour passe tout seul.
      const playable = hands[player].some((card) => canPlay(next, card));
      if (!playable) return { ...next, drew: false, turn: nextIndex(state) };
      return { ...next, drew: true };
    }

    if (action.type === 'pass') {
      if (!state.drew) return null;
      return { ...state, drew: false, turn: nextIndex(state), event: null, forgot: null };
    }

    const hand = state.hands[player];
    const card = hand.find((item) => item.id === action.cardId);
    if (!card || !canPlay(state, card)) return null;
    if (card.color === 'w' && !CARD_COLORS.includes(action.color as CardColor)) return null;

    let hands = state.hands.map((items, index) => (index === player ? items.filter((item) => item.id !== card.id) : items));
    let pile = state.pile;
    let discard = [...state.discard, card];
    const color = card.color === 'w' ? (action.color as CardColor) : card.color;
    let dir = state.dir;
    let turn = nextIndex(state);
    let event: CardsEvent | null = card.color === 'w' && card.value === 'wild' ? { kind: 'color', player } : null;

    if (hands[player].length === 0) {
      return { ...state, hands, discard, color, drew: false, result: { winner: player }, event, forgot: null };
    }

    if (card.value === 'skip') {
      event = { kind: 'skip', player, target: turn };
      turn = nextIndex(state, 2);
    } else if (card.value === 'reverse') {
      dir = state.dir === 1 ? -1 : 1;
      // À deux joueurs, Inverse revient à rejouer (comme Passe).
      turn = hands.length === 2 ? player : nextIndex({ ...state, dir });
      event = { kind: 'reverse', player };
    } else if (card.value === 'plus2' || card.value === 'plus4') {
      const target = turn;
      const drawn = drawCards(pile, discard, card.value === 'plus2' ? 2 : 4);
      pile = drawn.pile;
      discard = drawn.discard;
      hands = hands.map((items, index) => (index === target ? [...items, ...drawn.drawn] : items));
      event = { kind: card.value, player, target };
      turn = nextIndex(state, 2);
    }

    // Plus qu'une carte sans avoir crié « Couleurs ! » : 2 cartes de pénalité.
    let forgot: number | null = null;
    if (hands[player].length === 1 && !action.shout) {
      const penalty = drawCards(pile, discard, 2);
      pile = penalty.pile;
      discard = penalty.discard;
      hands = hands.map((items, index) => (index === player ? [...items, ...penalty.drawn] : items));
      forgot = player;
    }

    return { ...state, hands, pile, discard, color, dir, turn, drew: false, event, forgot };
  },
  turnOf: (state) => state.turn,
  resultOf: (state) => state.result,
};

/** Choix d'un adversaire robot : garde ses jokers pour la fin, crie toujours « Couleurs ! ». */
export function botAction(state: CardsState, player: number): CardsAction {
  const hand = state.hands[player];
  const playable = hand.filter((card) => canPlay(state, card));
  if (playable.length === 0) return state.drew ? { type: 'pass' } : { type: 'draw' };
  // Cartes d'attaque d'abord, puis chiffres, jokers en dernier.
  const rank = (card: Card) => (card.color === 'w' ? 3 : ['plus2', 'skip', 'reverse'].includes(card.value) ? 0 : 1);
  const card = [...playable].sort((a, b) => rank(a) - rank(b))[0];
  const counts = CARD_COLORS.map((color) => hand.filter((item) => item.id !== card.id && item.color === color).length);
  const color = CARD_COLORS[counts.indexOf(Math.max(...counts))];
  return { type: 'play', cardId: card.id, color: card.color === 'w' ? color : undefined, shout: hand.length === 2 };
}
