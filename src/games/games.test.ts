import { describe, expect, it } from 'vitest';
import { connect4, ticTacToe } from './gridGames';
import { buildDeck, canPlay, cards, type CardsState } from './cards';
import { billiards, rack, runShot, HEAD_SPOT, BALL_R, TABLE_H } from './billiards';

describe('morpion', () => {
  it('détecte une ligne gagnante et refuse de jouer hors tour', () => {
    let state = ticTacToe.init(2);
    expect(ticTacToe.apply(state, 1, { cell: 0 })).toBeNull();
    for (const [player, cell] of [[0, 0], [1, 3], [0, 1], [1, 4], [0, 2]]) {
      state = ticTacToe.apply(state, player, { cell })!;
    }
    expect(state.result).toEqual({ winner: 0 });
    expect(state.line).toEqual([0, 1, 2]);
    expect(ticTacToe.apply(state, 1, { cell: 5 })).toBeNull();
  });
});

describe('puissance 4', () => {
  it('empile les jetons et détecte 4 alignés en diagonale', () => {
    let state = connect4.init(2);
    const moves = [0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3];
    moves.forEach((col, index) => {
      state = connect4.apply(state, index % 2, { col })!;
    });
    expect(state.result).toEqual({ winner: 0 });
  });

  it('refuse une colonne pleine', () => {
    let state = connect4.init(2);
    for (let i = 0; i < 6; i += 1) state = connect4.apply(state, i % 2, { col: 0 })!;
    expect(connect4.apply(state, 0, { col: 0 })).toBeNull();
  });
});

describe('cartes', () => {
  it('construit un jeu de 108 cartes et distribue 7 cartes', () => {
    expect(buildDeck()).toHaveLength(108);
    const state = cards.init(3);
    expect(state.hands.map((hand) => hand.length)).toEqual([7, 7, 7]);
    expect(state.pile.length + state.discard.length + 21).toBe(108);
  });

  const base = (): CardsState => ({
    hands: [
      [{ id: 1, color: 'r', value: 'plus2' }, { id: 2, color: 'b', value: '3' }],
      [{ id: 3, color: 'g', value: '5' }],
      [{ id: 4, color: 'y', value: '1' }],
    ],
    pile: buildDeck().slice(20, 40),
    discard: [{ id: 99, color: 'r', value: '7' }],
    color: 'r',
    turn: 0,
    dir: 1,
    drew: false,
    result: null,
    event: null,
  });

  it('+2 fait piocher le suivant et le saute', () => {
    const next = cards.apply(base(), 0, { type: 'play', cardId: 1 })!;
    expect(next.hands[1]).toHaveLength(3);
    expect(next.turn).toBe(2);
  });

  it('refuse une carte qui ne correspond ni en couleur ni en valeur', () => {
    expect(canPlay(base(), { id: 2, color: 'b', value: '3' })).toBe(false);
    expect(cards.apply(base(), 0, { type: 'play', cardId: 2 })).toBeNull();
  });

  it('un joker exige une couleur', () => {
    const state = base();
    state.hands[0].push({ id: 50, color: 'w', value: 'wild' });
    expect(cards.apply(state, 0, { type: 'play', cardId: 50 })).toBeNull();
    expect(cards.apply(state, 0, { type: 'play', cardId: 50, color: 'g' })!.color).toBe('g');
  });

  it('la dernière carte posée fait gagner', () => {
    const state = base();
    state.hands[0] = [{ id: 1, color: 'r', value: '2' }];
    expect(cards.apply(state, 0, { type: 'play', cardId: 1 })!.result).toEqual({ winner: 0 });
  });
});

describe('billard', () => {
  it('la casse disperse les billes et ne bloque pas la partie', () => {
    const state = billiards.init(2);
    const next = billiards.apply(state, 0, { type: 'shot', angle: -Math.PI / 2, power: 1 })!;
    expect(next.shotId).toBe(1);
    const moved = next.balls.filter((ball, index) => ball.x !== state.balls[index].x || ball.y !== state.balls[index].y);
    expect(moved.length).toBeGreaterThan(5);
    for (const ball of next.balls) {
      if (ball.in) continue;
      expect(ball.y).toBeGreaterThanOrEqual(BALL_R - 1e-6);
      expect(ball.y).toBeLessThanOrEqual(TABLE_H - BALL_R + 1e-6);
    }
  });

  it("un coup dans le vide est une faute et passe la main", () => {
    const state = billiards.init(2);
    const next = billiards.apply(state, 0, { type: 'shot', angle: Math.PI / 2, power: 0.2 })!;
    expect(next.turn).toBe(1);
    expect(next.message).toBe('foul');
  });

  it('la blanche empochée revient au point de départ', () => {
    const balls = rack().map((ball) => (ball.n === 0 ? { ...ball, x: 6, y: 194 } : ball));
    const state = { ...billiards.init(2), balls, shotId: 3 };
    const next = billiards.apply(state, 0, { type: 'shot', angle: (3 * Math.PI) / 4, power: 0.5 })!;
    const cue = next.balls.find((ball) => ball.n === 0)!;
    expect(cue.in).toBe(false);
    expect(cue.x).toBe(HEAD_SPOT.x);
    expect(next.message).toBe('scratch');
    expect(next.turn).toBe(1);
  });

  it('la simulation finit toujours par s’arrêter', () => {
    const sim = runShot(rack(), -1.4, 1);
    expect(sim.balls.every((ball) => ball.vx === 0 && ball.vy === 0)).toBe(true);
  });
});

describe('parties complètes jouées au hasard', () => {
  it('le billard finit toujours par un vainqueur', () => {
    for (let game = 0; game < 5; game += 1) {
      let state = billiards.init(2);
      for (let shot = 0; shot < 400 && !state.result; shot += 1) {
        const cue = state.balls.find((ball) => ball.n === 0)!;
        const targets = state.balls.filter((ball) => ball.n !== 0 && !ball.in);
        const target = targets[Math.floor(Math.random() * targets.length)];
        const angle = Math.atan2(target.y - cue.y, target.x - cue.x) + (Math.random() - 0.5) * 0.1;
        state = billiards.apply(state, state.turn, { type: 'shot', angle, power: 0.3 + Math.random() * 0.7 })!;
        expect(state).not.toBeNull();
      }
      expect(state.result).not.toBeNull();
    }
  });

  it('les cartes finissent toujours par un vainqueur', () => {
    for (let game = 0; game < 20; game += 1) {
      let state = cards.init(2 + (game % 3));
      for (let move = 0; move < 2000 && !state.result; move += 1) {
        const hand = state.hands[state.turn];
        const card = hand.find((item) => canPlay(state, item));
        const next = card
          ? cards.apply(state, state.turn, { type: 'play', cardId: card.id, color: 'r' })
          : cards.apply(state, state.turn, { type: state.drew ? 'pass' : 'draw' });
        expect(next).not.toBeNull();
        state = next!;
        const total = state.hands.flat().length + state.pile.length + state.discard.length;
        expect(total).toBe(108);
      }
      expect(state.result).not.toBeNull();
    }
  });
});
