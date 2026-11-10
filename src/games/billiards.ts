import type { GameLogic, GameResult } from './types';

// Billard américain (« 8 ») simplifié, pour deux joueurs. La table est en portrait pour tenir sur
// un téléphone : 100 × 200 unités, bande de départ en bas. La simulation est discrète (pas fixe),
// ce qui permet de l'animer image par image côté client et de la calculer d'un coup côté hôte.

export const TABLE_W = 100;
export const TABLE_H = 200;
export const BALL_R = 2.6;
const POCKET_CORNER_R = 6;
const POCKET_SIDE_R = 5.2;
export const POCKETS: { x: number; y: number; r: number }[] = [
  { x: 0, y: 0, r: POCKET_CORNER_R },
  { x: TABLE_W, y: 0, r: POCKET_CORNER_R },
  { x: 0, y: TABLE_H / 2, r: POCKET_SIDE_R },
  { x: TABLE_W, y: TABLE_H / 2, r: POCKET_SIDE_R },
  { x: 0, y: TABLE_H, r: POCKET_CORNER_R },
  { x: TABLE_W, y: TABLE_H, r: POCKET_CORNER_R },
];
export const HEAD_SPOT = { x: TABLE_W / 2, y: TABLE_H * 0.75 };
const FOOT_SPOT = { x: TABLE_W / 2, y: TABLE_H * 0.28 };

const MAX_SPEED = 5.2; // unités par pas, à pleine puissance
const FRICTION = 0.986;
const STOP_SPEED = 0.025;
const CUSHION = 0.78;
const SUBSTEPS = 4;

export type Ball = { n: number; x: number; y: number; vx: number; vy: number; in: boolean };
export type Group = 'solids' | 'stripes';
export type BilliardsShot = { angle: number; power: number; before: Ball[] };
export type BilliardsMessage = 'foul' | 'scratch' | 'groupSolids' | 'groupStripes' | 'again' | null;

export type BilliardsState = {
  balls: Ball[];
  turn: number;
  /** Groupe du joueur 0 (le joueur 1 a l'autre), null tant qu'aucune bille n'a été empochée. */
  group0: Group | null;
  result: GameResult;
  shotId: number;
  lastShot: BilliardsShot | null;
  message: BilliardsMessage;
};

export type BilliardsAction = { type: 'shot'; angle: number; power: number };

export function groupOf(n: number): Group | null {
  if (n >= 1 && n <= 7) return 'solids';
  if (n >= 9 && n <= 15) return 'stripes';
  return null;
}

export function playerGroup(state: Pick<BilliardsState, 'group0'>, player: number): Group | null {
  if (!state.group0) return null;
  if (player === 0) return state.group0;
  return state.group0 === 'solids' ? 'stripes' : 'solids';
}

export function rack(): Ball[] {
  const rows = [[1], [9, 2], [10, 8, 3], [11, 4, 12, 5], [6, 13, 14, 7, 15]];
  const gap = 0.05;
  const balls: Ball[] = [{ n: 0, x: HEAD_SPOT.x, y: HEAD_SPOT.y, vx: 0, vy: 0, in: false }];
  rows.forEach((row, i) => {
    row.forEach((n, j) => {
      balls.push({
        n,
        x: FOOT_SPOT.x + (j - (row.length - 1) / 2) * (BALL_R * 2 + gap),
        y: FOOT_SPOT.y - i * (BALL_R * 2 + gap) * 0.866,
        vx: 0,
        vy: 0,
        in: false,
      });
    });
  });
  return balls;
}

export type Simulation = {
  balls: Ball[];
  firstHit: number | null;
  pocketed: number[];
  /** Avance d'un pas ; renvoie false quand toutes les billes sont arrêtées. */
  step: () => boolean;
};

export function startShot(before: Ball[], angle: number, power: number): Simulation {
  const balls = before.map((ball) => ({ ...ball, vx: 0, vy: 0 }));
  const cue = balls.find((ball) => ball.n === 0)!;
  const speed = Math.max(0, Math.min(1, power)) * MAX_SPEED;
  cue.vx = Math.cos(angle) * speed;
  cue.vy = Math.sin(angle) * speed;
  const sim: Simulation = {
    balls,
    firstHit: null,
    pocketed: [],
    step: () => {
      let moving = false;
      for (let s = 0; s < SUBSTEPS; s += 1) {
        for (const ball of balls) {
          if (ball.in) continue;
          ball.x += ball.vx / SUBSTEPS;
          ball.y += ball.vy / SUBSTEPS;
        }
        // Chocs entre billes (masses égales, quasi élastiques).
        for (let i = 0; i < balls.length; i += 1) {
          const a = balls[i];
          if (a.in) continue;
          for (let j = i + 1; j < balls.length; j += 1) {
            const b = balls[j];
            if (b.in) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distSq = dx * dx + dy * dy;
            const min = BALL_R * 2;
            if (distSq >= min * min || distSq === 0) continue;
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = (min - dist) / 2;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;
            const approach = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (approach <= 0) continue;
            const impulse = approach * 0.97;
            a.vx -= impulse * nx;
            a.vy -= impulse * ny;
            b.vx += impulse * nx;
            b.vy += impulse * ny;
            if (sim.firstHit === null) {
              if (a.n === 0) sim.firstHit = b.n;
              else if (b.n === 0) sim.firstHit = a.n;
            }
          }
        }
        // Poches puis bandes.
        for (const ball of balls) {
          if (ball.in) continue;
          if (POCKETS.some((pocket) => Math.hypot(ball.x - pocket.x, ball.y - pocket.y) < pocket.r)) {
            ball.in = true;
            ball.vx = 0;
            ball.vy = 0;
            sim.pocketed.push(ball.n);
            continue;
          }
          if (ball.x < BALL_R) {
            ball.x = BALL_R;
            ball.vx = Math.abs(ball.vx) * CUSHION;
          } else if (ball.x > TABLE_W - BALL_R) {
            ball.x = TABLE_W - BALL_R;
            ball.vx = -Math.abs(ball.vx) * CUSHION;
          }
          if (ball.y < BALL_R) {
            ball.y = BALL_R;
            ball.vy = Math.abs(ball.vy) * CUSHION;
          } else if (ball.y > TABLE_H - BALL_R) {
            ball.y = TABLE_H - BALL_R;
            ball.vy = -Math.abs(ball.vy) * CUSHION;
          }
        }
      }
      for (const ball of balls) {
        if (ball.in) continue;
        ball.vx *= FRICTION;
        ball.vy *= FRICTION;
        if (Math.hypot(ball.vx, ball.vy) < STOP_SPEED) {
          ball.vx = 0;
          ball.vy = 0;
        } else {
          moving = true;
        }
      }
      return moving;
    },
  };
  return sim;
}

/** Simule un coup jusqu'à l'arrêt complet (plafonné pour ne jamais boucler). */
export function runShot(before: Ball[], angle: number, power: number): Simulation {
  const sim = startShot(before, angle, power);
  for (let i = 0; i < 4000 && sim.step(); i += 1);
  return sim;
}

/** Replace une bille sur un point libre, en décalant si une autre bille l'occupe. */
function respot(balls: Ball[], n: number, spot: { x: number; y: number }, direction: 1 | -1) {
  const ball = balls.find((item) => item.n === n)!;
  let y = spot.y;
  const free = (x: number, yy: number) =>
    balls.every((other) => other.n === n || other.in || Math.hypot(other.x - x, other.y - yy) >= BALL_R * 2 + 0.1);
  while (!free(spot.x, y) && y > BALL_R && y < TABLE_H - BALL_R) y += direction * (BALL_R * 2 + 0.2);
  Object.assign(ball, { x: spot.x, y, vx: 0, vy: 0, in: false });
}

function remaining(balls: Ball[], group: Group): number {
  return balls.filter((ball) => !ball.in && groupOf(ball.n) === group).length;
}

export const billiards: GameLogic<BilliardsState, BilliardsAction> = {
  minPlayers: 2,
  maxPlayers: 2,
  init: () => ({ balls: rack(), turn: 0, group0: null, result: null, shotId: 0, lastShot: null, message: null }),
  apply: (state, player, action) => {
    if (state.result || player !== state.turn || action.type !== 'shot') return null;
    if (!Number.isFinite(action.angle) || !Number.isFinite(action.power) || action.power <= 0) return null;
    const power = Math.min(1, action.power);
    const sim = runShot(state.balls, action.angle, power);
    const balls = sim.balls.map((ball) => ({ ...ball, vx: 0, vy: 0 }));
    const isBreak = state.shotId === 0;
    const other = 1 - player;
    const myGroupBefore = playerGroup(state, player);
    const clearedBefore = myGroupBefore ? remaining(state.balls, myGroupBefore) === 0 : false;

    const scratch = sim.pocketed.includes(0);
    let wrongFirst = sim.firstHit === null;
    if (!wrongFirst && myGroupBefore) {
      wrongFirst = clearedBefore ? sim.firstHit !== 8 : groupOf(sim.firstHit!) !== myGroupBefore;
    }
    const foul = scratch || wrongFirst;

    const base = { ...state, balls, shotId: state.shotId + 1, lastShot: { angle: action.angle, power, before: state.balls } };

    if (sim.pocketed.includes(8)) {
      if (isBreak) {
        respot(balls, 8, FOOT_SPOT, -1);
      } else {
        const win = clearedBefore && !foul;
        return { ...base, result: { winner: win ? player : other }, message: null };
      }
    }
    if (scratch) respot(balls, 0, HEAD_SPOT, 1);

    let group0 = state.group0;
    let message: BilliardsMessage = scratch ? 'scratch' : foul ? 'foul' : null;
    const coloured = sim.pocketed.filter((n) => groupOf(n) !== null);
    if (!group0 && !foul && coloured.length > 0) {
      const mine = groupOf(coloured[0])!;
      group0 = player === 0 ? mine : mine === 'solids' ? 'stripes' : 'solids';
      message = mine === 'solids' ? 'groupSolids' : 'groupStripes';
    }
    const myGroup = playerGroup({ group0 }, player);
    const scoredOwn = myGroup ? coloured.some((n) => groupOf(n) === myGroup) : coloured.length > 0;
    const keepTurn = !foul && scoredOwn;
    if (keepTurn && !message) message = 'again';
    return { ...base, group0, turn: keepTurn ? player : other, message };
  },
  turnOf: (state) => state.turn,
  resultOf: (state) => state.result,
};

/** Point où la bille blanche toucherait la première bille dans la direction visée (aide à la visée). */
export function aimPreview(balls: Ball[], angle: number): { x: number; y: number; ghost: boolean } {
  const cue = balls.find((ball) => ball.n === 0)!;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = Infinity;
  for (const ball of balls) {
    if (ball.n === 0 || ball.in) continue;
    const ox = ball.x - cue.x;
    const oy = ball.y - cue.y;
    const along = ox * dx + oy * dy;
    if (along <= 0) continue;
    const perpSq = ox * ox + oy * oy - along * along;
    const reach = (BALL_R * 2) ** 2;
    if (perpSq > reach) continue;
    const t = along - Math.sqrt(reach - perpSq);
    if (t < best) best = t;
  }
  if (best < Infinity) return { x: cue.x + dx * best, y: cue.y + dy * best, ghost: true };
  // Sinon, jusqu'à la bande.
  const tx = dx > 0 ? (TABLE_W - BALL_R - cue.x) / dx : dx < 0 ? (BALL_R - cue.x) / dx : Infinity;
  const ty = dy > 0 ? (TABLE_H - BALL_R - cue.y) / dy : dy < 0 ? (BALL_R - cue.y) / dy : Infinity;
  const t = Math.min(tx, ty);
  return { x: cue.x + dx * t, y: cue.y + dy * t, ghost: false };
}
